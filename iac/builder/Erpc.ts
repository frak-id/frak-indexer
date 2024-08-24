import type { Vpc } from "aws-cdk-lib/aws-ec2";
import type { ICluster } from "aws-cdk-lib/aws-ecs";
import {
    ApplicationProtocol,
    ApplicationTargetGroup,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Duration } from "aws-cdk-lib/core";
import { type App, Service, type Stack, use } from "sst/constructs";
import { ConfigStack } from "../Config";
import { buildSecretsMap, getImageFromName } from "../utils";

/**
 * Add the eRPC service to the stack
 */
export function addErpcService({
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

    if (!erpcService.cdk?.fargateService) {
        throw new Error("Missing fargate service configuration");
    }

    // Create the target group for a potential alb usage
    const erpcTargetGroup = new ApplicationTargetGroup(
        stack,
        "ErpcTargetGroup",
        {
            vpc: vpc,
            port: 8080,
            protocol: ApplicationProtocol.HTTP,
            targets: [erpcService.cdk.fargateService],
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

    stack.addOutputs({
        erpcServiceId: erpcService.id,
    });

    return { erpcService, erpcTargetGroup };
}
