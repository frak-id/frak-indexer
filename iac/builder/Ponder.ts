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

type PonderInstanceConfig =
    (typeof ponderInstanceTypeConfig)[keyof typeof ponderInstanceTypeConfig];

/**
 * Define the differnent types of ponder instance we will deploy
 */
export const ponderInstanceTypeConfig = {
    indexing: {
        suffix: "Indexer",
        entryPoint: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "warn",
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
        hardware: {
            cpu: "0.5 vCPU",
            memory: "1 GB",
            storage: "20 GB",
        } as const,
    },
    reading: {
        suffix: "IndexerReader",
        entryPoint: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "warn",
            "serve",
        ],
        fargateService: undefined,
        scaling: {
            minContainers: 1,
            maxContainers: 4,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
        hardware: {
            cpu: "0.25 vCPU",
            memory: "0.5 GB",
            storage: "20 GB",
        } as const,
    },
};

/**
 * Add the indexer service to the stack
 */
export function addPonderService({
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
    const cdkSecretsMap = buildSecretsMap({
        stack,
        secrets,
        name: instanceType.suffix,
    });

    // Get the container props of our prebuilt binaries
    const indexerImage = getImageFromName({
        stack,
        app,
        name: "indexer",
        tag: process.env.PONDER_IMAGE_TAG,
        suffix: instanceType.suffix,
    });

    // The service itself
    const service = new Service(stack, `${instanceType.suffix}Service`, {
        path: "packages/ponder",
        // SST not happy, can't connect to ECR to fetch the instance during the build process
        // file: "Dockerfile.prebuilt",
        port: 42069,
        // Setup some capacity options
        scaling: instanceType.scaling,
        // Bind the secret we will be using
        bind: secrets,
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Hardware config
        cpu: instanceType.hardware.cpu,
        memory: instanceType.hardware.memory,
        storage: instanceType.hardware.storage,
        // Log retention
        logRetention: "three_days",
        // Set the right environment variables
        environment: {
            // Ponder related stuff
            PONDER_LOG_LEVEL: "warn",
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
                containerName: instanceType.suffix.toLowerCase(),
                image: indexerImage,
                secrets: cdkSecretsMap,
                entryPoint: instanceType.entryPoint,
            },
        },
    });

    stack.addOutputs({
        [`${instanceType.suffix}ServiceId`]: service.id,
    });

    if (!service.cdk?.fargateService) {
        throw new Error("Missing fargate service configuration");
    }

    // Create the target groupe
    const targetGroup = new ApplicationTargetGroup(
        stack,
        `${instanceType.suffix}TargetGroup`,
        {
            vpc: vpc,
            port: 42069,
            protocol: ApplicationProtocol.HTTP,
            targets: [service.cdk.fargateService],
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

    return { service, fargateService: service.cdk.fargateService, targetGroup };
}
