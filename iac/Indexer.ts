import {
    AllowedMethods,
    CacheCookieBehavior,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    CachedMethods,
    OriginProtocolPolicy,
    OriginRequestPolicy,
    ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, type ICluster } from "aws-cdk-lib/aws-ecs";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Duration } from "aws-cdk-lib/core";
import {
    type App,
    Service,
    type Stack,
    type StackContext,
    use,
} from "sst/constructs";
import { Distribution } from "sst/constructs/Distribution.js";
import { ConfigStack } from "./Config";
import { buildSecretsMap, getImageFromName } from "./utils";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function IndexerStack({ app, stack }: StackContext) {
    // Create our VPC
    const vpc = new Vpc(stack, "Vpc", {
        natGateways: 1,
    });

    // Create the cluster for each services
    const cluster = new Cluster(stack, "EcsCluster", {
        clusterName: `${stack.stage}-IndexingCluster`,
        vpc,
    });

    // Then add the erpc service
    const erpcService = addErpcService({ stack, app, vpc, cluster });

    // Add the indexer service
    const indexerService = addIndexerService({ stack, app, vpc, cluster });

    // If we are missing the fargate services, early exit
    const indexerFaragateService = indexerService.cdk?.fargateService;
    const erpcFargateService = erpcService.cdk?.fargateService;
    if (!(indexerFaragateService && erpcFargateService)) {
        throw new Error(
            "Missing fargate service in the indexer or erpc service"
        );
    }

    // Then create our application load balancer
    const alb = new ApplicationLoadBalancer(stack, "Alb", {
        vpc,
        internetFacing: true,
    });

    // Add the indexer service to the ALB
    const indexerListener = alb.addListener("IndexerListener", {
        port: 80,
    });
    indexerListener.addTargets("IndexerTarget", {
        port: 80,
        targets: [indexerFaragateService],
        deregistrationDelay: Duration.seconds(30),
        healthCheck: {
            path: "/health",
            interval: Duration.seconds(20),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 5,
            healthyHttpCodes: "200-299",
        },
    });

    // todo: add erpc service to the ALB
    // Add the listener on port 8080 for the rpc
    const erpcListener = alb.addListener("ErpcListener", {
        port: 4000,
        protocol: ApplicationProtocol.HTTP,
    });
    erpcListener.addTargets("ErpcTarget", {
        port: 4000,
        protocol: ApplicationProtocol.HTTP,
        targets: [erpcFargateService],
        deregistrationDelay: Duration.seconds(30),
        healthCheck: {
            path: "/health",
            port: "80",
            interval: Duration.seconds(20),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 5,
            healthyHttpCodes: "200-299",
        },
    });

    const cachePolicy = new CachePolicy(this, "CachePolicy", {
        queryStringBehavior: CacheQueryStringBehavior.all(),
        headerBehavior: CacheHeaderBehavior.none(),
        cookieBehavior: CacheCookieBehavior.none(),
        defaultTtl: Duration.days(0),
        maxTtl: Duration.days(365),
        minTtl: Duration.days(0),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
        comment: "Indexer/Rpc response cache policy",
    });

    // Add the cloudfront distribution
    const distribution = new Distribution(this, "Distribution", {
        customDomain: {
            domainName: "indexer.frak.id",
            hostedZone: "frak.id",
        },
        cdk: {
            distribution: {
                defaultRootObject: "",
                defaultBehavior: {
                    viewerProtocolPolicy:
                        ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new HttpOrigin(alb.loadBalancerDnsName, {
                        protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
                        readTimeout: Duration.seconds(60),
                    }),
                    allowedMethods: AllowedMethods.ALLOW_ALL,
                    cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
                    compress: true,
                    cachePolicy,
                    originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
                },
            },
        },
    });

    stack.addOutputs({
        AlbArn: alb.loadBalancerArn,
        DistributionId: distribution.cdk.distribution.distributionId,
    });

    return indexerService;
}

/**
 * Add the eRPC service to the stack
 */
function addErpcService({
    stack,
    app,
    vpc,
    cluster,
}: { stack: Stack; app: App; vpc: Vpc; cluster: ICluster }) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { rpcSecrets, erpcDb } = use(ConfigStack);
    const secrets = [...rpcSecrets, erpcDb];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({ stack, secrets, name: "erpc" });

    // Get the container props of our prebuilt binaries
    const erpcImage = getImageFromName({ stack, app, name: "erpc" });

    // The service itself
    const erpcService = new Service(stack, "ErpcService", {
        path: "packages/erpc",
        port: 4000,
        // Setup some capacity options
        scaling: {
            minContainers: 1,
            maxContainers: 1,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
        // Bind the secret we will be using
        bind: secrets,
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Hardware config
        cpu: "1 vCPU",
        memory: "4 GB",
        storage: "30 GB",
        // Log retention
        logRetention: "one_week",
        // Set the right environment variables
        environment: {
            ERPC_LOG_LEVEL: "warn",
        },
        cdk: {
            vpc,
            cluster,
            // Don't auto setup the ALB since we will be using the one from the indexer service
            // todo: setup the ALB after the indexer service is deployed
            applicationLoadBalancer: false,
            // Customise fargate service to enable circuit breaker (if the new deployment is failing)
            fargateService: {
                circuitBreaker: {
                    enable: true,
                },
                // Disable rolling update
                desiredCount: 1,
                minHealthyPercent: 0,
                maxHealthyPercent: 100,
            },
            // Directly specify the image position in the registry here
            container: {
                containerName: "erpc",
                image: erpcImage,
                secrets: cdkSecretsMap,
                portMappings: [
                    { containerPort: 4000, hostPort: 4000 },
                    { containerPort: 4001, hostPort: 4001 },
                ],
            },
        },
    });

    stack.addOutputs({
        erpcServiceId: erpcService.id,
    });

    return erpcService;
}

/**
 * Add the indexer service to the stack
 */
function addIndexerService({
    stack,
    app,
    vpc,
    cluster,
}: { stack: Stack; app: App; vpc: Vpc; cluster: ICluster }) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { rpcSecrets, ponderDb } = use(ConfigStack);
    const secrets = [...rpcSecrets, ponderDb];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({ stack, secrets, name: "indexer" });

    // Get the container props of our prebuilt binaries
    const indexerImage = getImageFromName({ stack, app, name: "indexer" });

    // The service itself
    const indexerService = new Service(stack, "IndexerService", {
        path: "packages/ponder",
        // SST not happy, can't connect to ECR to fetch the instance during the build process
        // file: "Dockerfile.prebuilt",
        port: 42069,
        // Domain mapping
        customDomain: {
            domainName: "indexer.frak.id",
            hostedZone: "frak.id",
        },
        // Setup some capacity options
        scaling: {
            minContainers: 1,
            maxContainers: 1,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
        // Bind the secret we will be using
        bind: secrets,
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Hardware config
        cpu: "1 vCPU",
        memory: "4 GB",
        storage: "30 GB",
        // Log retention
        logRetention: "one_week",
        // Set the right environment variables
        environment: {
            // Ponder related stuff
            PONDER_LOG_LEVEL: "info",
            PONDER_TELEMETRY_DISABLED: "true",
        },
        cdk: {
            vpc,
            cluster,
            // Don't auto setup the ALB since we will be using the one from the indexer service
            // todo: setup the ALB after the indexer service is deployed
            applicationLoadBalancer: false,
            // Customise fargate service to enable circuit breaker (if the new deployment is failing)
            fargateService: {
                circuitBreaker: {
                    enable: true,
                },
                // Disable rolling update
                desiredCount: 1,
                minHealthyPercent: 0,
                maxHealthyPercent: 100,
                // Increase health check grace period
                healthCheckGracePeriod: Duration.seconds(120),
            },
            // Directly specify the image position in the registry here
            container: {
                containerName: "indexer",
                image: indexerImage,
                secrets: cdkSecretsMap,
            },
        },
    });

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });

    return indexerService;
}
