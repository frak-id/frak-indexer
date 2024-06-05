import { Repository } from "aws-cdk-lib/aws-ecr";
import { ContainerImage, Secret } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { SSTConfig } from "sst";
import { Config, Service, type Stack, type StackContext } from "sst/constructs";

export default {
    config(_input) {
        // Extract the stage from config, or from env data
        return {
            name: "frak-indexer",
            region: "eu-west-1",
            ssmPrefix: "/indexer/sst/",
        };
    },
    async stacks(app) {
        // Remove all resources when non-prod stages are removed
        app.setDefaultRemovalPolicy("destroy");

        // Global function properties
        app.setDefaultFunctionProps({
            // Log param's
            logRetention: "one_week",
            // Runtime node env
            runtime: "nodejs20.x",
            // Use arm64
            architecture: "arm_64",
            // Disable xray tracing
            tracing: "disabled",
        });

        app.stack(IndexerStack);
    },
} satisfies SSTConfig;

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
function IndexerStack({ app, stack }: StackContext) {
    // All the secrets env variable we will be using (in local you can just use a .env file)
    const secrets = [
        // Db url
        new Config.Secret(stack, "DATABASE_URL"),
        // Mainnet RPCs
        new Config.Secret(stack, "PONDER_RPC_URL_ARB"),
        new Config.Secret(stack, "PONDER_RPC_URL_OPTIMISM"),
        new Config.Secret(stack, "PONDER_RPC_URL_BASE"),
        new Config.Secret(stack, "PONDER_RPC_URL_POLYGON"),
        // Testnet RPCs
        new Config.Secret(stack, "PONDER_RPC_URL_ARB_SEPOLIA"),
    ];

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
    const indexerImage = ContainerImage.fromEcrRepository(
        containerRegistry,
        "latest"
    );

    // The service itself
    const indexerService = new Service(stack, "IndexerService", {
        path: "./",
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
            },
            // Directly specify the image position in the registry here
            container: {
                image: indexerImage,
                secrets: cdkSecretsMap,
                // Mark the container as non-essential, to don't fail the whole CI in case of deployment bug
                // essential: false,
            },
        },
    });

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });

    // Set up connections to database via the security group
    /*const cluster = indexerService.cdk?.cluster;
    if (cluster) {
        // Get the security group for the database and link to it
        const databaseSecurityGroup = SecurityGroup.fromLookupById(
            stack,
            "indexer-db-sg",
            "sg-0cbbb98322234113f"
        );
        databaseSecurityGroup.connections.allowFrom(cluster, Port.tcp(5432));
    }*/
}

/**
 * Build a list of secret name to CDK secret, for direct binding
 * @param stack
 * @param secrets
 */
function buildSecretsMap(stack: Stack, secrets: Config.Secret[]) {
    return secrets.reduce(
        (acc, secret) => {
            const isSpecificSecret = secret.name === "DATABASE_URL";
            const ssmPath = isSpecificSecret
                ? `/indexer/sst/Secret/${secret.name}/value`
                : `/sst/frak-indexer/.fallback/Secret/${secret.name}/value`;

            // Add the secret
            const stringParameter =
                StringParameter.fromSecureStringParameterAttributes(
                    stack,
                    `Secret${secret.name}`,
                    {
                        parameterName: ssmPath,
                    }
                );
            acc[secret.name] = Secret.fromSsmParameter(stringParameter);
            return acc;
        },
        {} as Record<string, Secret>
    );
}
