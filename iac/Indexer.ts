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
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, type ICluster } from "aws-cdk-lib/aws-ecs";
import {
    ApplicationLoadBalancer,
    ApplicationProtocol,
    ApplicationTargetGroup,
    ListenerAction,
    ListenerCondition,
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

type PonderInstanceConfig =
    (typeof ponderInstanceTypeConfig)[keyof typeof ponderInstanceTypeConfig];

/**
 * Define the differnent types of ponder instance we will deploy
 */
const ponderInstanceTypeConfig = {
    indexing: {
        suffix: "Indexing",
        port: 42069,
        entryPoint: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "info",
            "start",
        ],
        fargateService: {
            desiredCount: 1,
            minHealthyPercent: 0,
            maxHealthyPercent: 100,
        },
        scaling: {
            minContainers: 1,
            maxContainers: 1,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
    },
    serving: {
        suffix: "Serving",
        port: 42068,
        entryPoint: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "info",
            "serve",
        ],
        fargateService: undefined,
        scaling: {
            minContainers: 1,
            maxContainers: 4,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
    },
};

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
    const indexerService = addIndexerService({
        stack,
        app,
        vpc,
        cluster,
        instanceType: ponderInstanceTypeConfig.indexing,
    });

    // If we are missing the fargate services, early exit
    const indexerFaragateService = indexerService.cdk?.fargateService;
    const erpcFargateService = erpcService.cdk?.fargateService;
    if (!(indexerFaragateService && erpcFargateService)) {
        throw new Error(
            "Missing fargate service in the indexer or erpc service"
        );
    }

    // Add the erpc service as dependency to the indexer service, to ensure the deployment order
    indexerFaragateService.node.addDependency(erpcFargateService);

    // Then create our application load balancer
    const alb = new ApplicationLoadBalancer(stack, "Alb", {
        vpc,
        internetFacing: true,
    });

    // Allow connections to the applications ports
    alb.connections.allowTo(
        indexerFaragateService,
        Port.tcp(42069),
        "Allow connection from ALB to public indexer port"
    );
    alb.connections.allowTo(
        erpcFargateService,
        Port.tcp(8080),
        "Allow connection from ALB to public erpc port"
    );
    alb.connections.allowTo(
        erpcFargateService,
        Port.tcp(4001),
        "Allow connection from ALB to metrics erpc port"
    );

    // Create the listener on port 80
    const httpListener = alb.addListener("HttpListener", {
        port: 80,
    });
    httpListener.connections.allowInternally(
        Port.tcp(4001),
        "Allow erpc metrics port internally"
    );
    httpListener.connections.allowInternally(
        Port.tcp(8080),
        "Allow erpc public port internally"
    );
    httpListener.connections.allowInternally(
        Port.tcp(42069),
        "Allow indexer public port internally"
    );

    // Add the internal erpc url to the ponder instance
    indexerService.addEnvironment(
        "ERPC_INTERNAL_URL",
        `http://${alb.loadBalancerDnsName}/ponder-rpc/evm`
    );

    // Create our erpc target group on port 8080 and bind it to the http listener
    const erpcTargetGroup = new ApplicationTargetGroup(
        stack,
        "ErpcTargetGroup",
        {
            vpc: vpc,
            port: 8080,
            protocol: ApplicationProtocol.HTTP,
            targets: [erpcFargateService],
            deregistrationDelay: Duration.seconds(10),
            healthCheck: {
                path: "/",
                port: "4001",
                interval: Duration.seconds(30),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 5,
                healthyHttpCodes: "200",
            },
        }
    );
    httpListener.addAction("ErpcForwardAction", {
        action: ListenerAction.forward([erpcTargetGroup]),
    });
    httpListener.addTargetGroups("ErpcTarget", {
        targetGroups: [erpcTargetGroup],
        priority: 10,
        conditions: [
            ListenerCondition.pathPatterns(["/ponder-rpc/*", "/nexus-rpc/*"]),
        ],
    });

    // Add the indexer service to the ALB on bind it to the port 42069
    const indexerTargetGroup = new ApplicationTargetGroup(
        stack,
        "IndexerTargetGroup",
        {
            vpc: vpc,
            port: 42069,
            protocol: ApplicationProtocol.HTTP,
            targets: [indexerFaragateService],
            deregistrationDelay: Duration.seconds(10),
            healthCheck: {
                // use status instead of health since health is failing during historical syncing
                path: "/status",
                interval: Duration.seconds(30),
                healthyThresholdCount: 2,
                unhealthyThresholdCount: 5,
                healthyHttpCodes: "200-299",
            },
        }
    );
    httpListener.addAction("IndexerForwardAction", {
        action: ListenerAction.forward([indexerTargetGroup]),
    });
    httpListener.addTargetGroups("IndexerTarget", {
        targetGroups: [indexerTargetGroup],
        priority: 20,
        conditions: [ListenerCondition.pathPatterns(["/*"])],
    });

    // Create our CDN cache policy
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
    const {
        rpcSecrets,
        erpcDb,
        pimlicoApiKey,
        nexusRpcSecret,
        ponderRpcSecret,
    } = use(ConfigStack);
    const secrets = [
        ...rpcSecrets,
        pimlicoApiKey,
        erpcDb,
        nexusRpcSecret,
        ponderRpcSecret,
    ];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({ stack, secrets, name: "erpc" });

    // Get the container props of our prebuilt binaries
    const erpcImage = getImageFromName({
        stack,
        app,
        name: "erpc",
        tag: process.env.ERPC_IMAGE_TAG,
    });

    // The service itself
    const erpcService = new Service(stack, "ErpcService", {
        path: "packages/erpc",
        port: 8080,
        // Setup some capacity options
        scaling: {
            minContainers: 1,
            maxContainers: 4,
            cpuUtilization: 80,
            memoryUtilization: 80,
        },
        // Bind the secret we will be using
        bind: secrets,
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Hardware config
        cpu: "0.5 vCPU",
        memory: "1 GB",
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
                enableExecuteCommand: true,
                circuitBreaker: {
                    enable: true,
                },
            },
            // Directly specify the image position in the registry here
            container: {
                containerName: "erpc",
                image: erpcImage,
                secrets: cdkSecretsMap,
                portMappings: [
                    { containerPort: 8080 },
                    { containerPort: 4001 },
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
 *  - todo: options to expose a "serve" only instance with scalability
 */
function addIndexerService({
    stack,
    app,
    vpc,
    cluster,
    instanceType,
}: {
    stack: Stack;
    app: App;
    vpc: Vpc;
    cluster: ICluster;
    instanceType: PonderInstanceConfig;
}) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { ponderDb, ponderRpcSecret } = use(ConfigStack);
    const secrets = [ponderDb, ponderRpcSecret];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({ stack, secrets, name: "indexer" });

    // Get the container props of our prebuilt binaries
    const indexerImage = getImageFromName({
        stack,
        app,
        name: "indexer",
        tag: process.env.PONDER_IMAGE_TAG,
    });

    // The service itself
    const indexerService = new Service(
        stack,
        `Indexer${instanceType.suffix}Service`,
        {
            path: "packages/ponder",
            // SST not happy, can't connect to ECR to fetch the instance during the build process
            // file: "Dockerfile.prebuilt",
            port: instanceType.port,
            // Domain mapping
            // todo: could probably be deleted since we are building it before
            customDomain: {
                domainName: "indexer.frak.id",
                hostedZone: "frak.id",
            },
            // Setup some capacity options
            scaling: instanceType.scaling,
            // Bind the secret we will be using
            bind: secrets,
            // Arm architecture (lower cost)
            architecture: "arm64",
            // Hardware config
            cpu: "1 vCPU",
            memory: "2 GB",
            storage: "30 GB",
            // Log retention
            logRetention: "one_week",
            // Set the right environment variables
            environment: {
                // Ponder related stuff
                PONDER_LOG_LEVEL: "debug",
                // Erpc external endpoint
                ERPC_EXTERNAL_URL: "https://indexer.frak.id/ponder-rpc/evm",
            },
            cdk: {
                vpc,
                cluster,
                // Don't auto setup the ALB since we will be using the one from the indexer service
                // todo: setup the ALB after the indexer service is deployed
                applicationLoadBalancer: false,
                // Customise fargate service to enable circuit breaker (if the new deployment is failing)
                fargateService: {
                    enableExecuteCommand: true,
                    circuitBreaker: {
                        enable: true,
                    },
                    // Increase health check grace period
                    healthCheckGracePeriod: Duration.seconds(120),
                    ...instanceType.fargateService,
                },
                // Directly specify the image position in the registry here
                container: {
                    containerName: "indexer",
                    image: indexerImage,
                    secrets: cdkSecretsMap,
                    entryPoint: instanceType.entryPoint,
                },
            },
        }
    );

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });

    return indexerService;
}
