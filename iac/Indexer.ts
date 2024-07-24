import { Repository } from "aws-cdk-lib/aws-ecr";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { Service, type StackContext, use } from "sst/constructs";
import { ConfigStack } from "./Config";
import { buildSecretsMap } from "./utils";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function IndexerStack({ app, stack }: StackContext) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { rpcSecrets, ponderDb } = use(ConfigStack);
    const secrets = [...rpcSecrets, ponderDb];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap(stack, secrets);

    // Get the container props of our prebuilt binaries
    const containerRegistry = Repository.fromRepositoryAttributes(
        stack,
        "IndexerEcr",
        {
            repositoryArn: `arn:aws:ecr:eu-west-1:${app.account}:repository/indexer`,
            repositoryName: "indexer",
        }
    );

    const imageTag = process.env.COMMIT_SHA ?? "latest";
    console.log(`Will use the image ${imageTag}`);
    const indexerImage = ContainerImage.fromEcrRepository(
        containerRegistry,
        imageTag
    );

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
                containerName: "indexer",
                image: indexerImage,
                secrets: cdkSecretsMap,
                /*healthCheck: {
                    command: [
                        "CMD-SHELL",
                        "curl -f http://localhost:42069/status || exit 1",
                    ],
                    interval: Duration.seconds(30),
                    timeout: Duration.seconds(5),
                    retries: 3,
                    startPeriod: Duration.seconds(30),
                },*/
            },
        },
    });

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });
}
