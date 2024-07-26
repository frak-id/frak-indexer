import { Repository } from "aws-cdk-lib/aws-ecr";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { Duration } from "aws-cdk-lib/core";
import { Service, type StackContext, use } from "sst/constructs";
import { ConfigStack } from "./Config";
import { IndexerStack } from "./Indexer";
import { buildSecretsMap } from "./utils";

/**
 * The CDK stack that will deploy the erpc service
 * @param stack
 * @constructor
 */
export function ErpcStack({ app, stack }: StackContext) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { rpcSecrets, erpcDb } = use(ConfigStack);
    const secrets = [...rpcSecrets, erpcDb];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap(stack, secrets);

    // Get the container props of our prebuilt binaries
    const containerRegistry = Repository.fromRepositoryAttributes(
        stack,
        "ErpcEcr",
        {
            repositoryArn: `arn:aws:ecr:eu-west-1:${app.account}:repository/erpc`,
            repositoryName: "erpc",
        }
    );

    const imageTag = process.env.COMMIT_SHA ?? "latest";
    console.log(`Will use the image ${imageTag}`);
    const erpcImage = ContainerImage.fromEcrRepository(
        containerRegistry,
        imageTag
    );

    // Get our indexer service
    const indexerService = use(IndexerStack);

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
            vpc: indexerService.cdk?.vpc,
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
                containerName: "erpc",
                image: erpcImage,
                secrets: cdkSecretsMap,
            },
        },
    });

    stack.addOutputs({
        erpcServiceId: erpcService.id,
    });
}
