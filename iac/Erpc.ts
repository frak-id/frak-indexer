import { Duration } from "aws-cdk-lib/core";
import { Service, type StackContext, use } from "sst/constructs";
import { ClusterStack } from "./Cluster";
import { ConfigStack } from "./Config";
import { buildSecretsMap, getImageFromName } from "./utils";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function ErpcStack({ app, stack }: StackContext) {
    const { vpc, cluster } = use(ClusterStack);

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
        // The domain where it's hosted
        customDomain: {
            domainName: "rpc.frak.id",
            hostedZone: "frak.id",
        },
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
        cpu: "0.25 vCPU",
        memory: "0.5 GB",
        storage: "20 GB",
        // Log retention
        logRetention: "three_days",
        // Set the right environment variables
        environment: {
            ERPC_LOG_LEVEL: "warn",
        },
        cdk: {
            vpc,
            cluster,
            // Don't auto setup the ALB since we will be using the one from the indexer service
            // todo: setup the ALB after the indexer service is deployed
            // Maybe a closed to the internet alb?
            applicationLoadBalancer: {
                internetFacing: true,
            },
            applicationLoadBalancerTargetGroup: {
                deregistrationDelay: Duration.seconds(10),
                healthCheck: {
                    path: "/",
                    port: "4001",
                    interval: Duration.seconds(30),
                    healthyThresholdCount: 2,
                    unhealthyThresholdCount: 5,
                    healthyHttpCodes: "200",
                },
            },
            // Customise fargate service to enable circuit breaker (if the new deployment is failing)
            fargateService: {
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

    return {
        erpcService,
    };
}
