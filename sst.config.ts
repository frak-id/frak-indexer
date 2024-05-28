import { Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Secret } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { SSTConfig } from "sst";
import { Config, Service, type StackContext } from "sst/constructs";

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
function IndexerStack({ stack }: StackContext) {
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
            maxContainers: 4,
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
            PONDER_LOG_LEVEL: "debug",
            PONDER_TELEMETRY_DISABLED: "true",
        },
    });

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });

    // Set up connections to database via security groups
    const cluster = indexerService.cdk?.cluster;
    if (cluster) {
        // Get the security group for the database and link to it
        const databaseSecurityGroup = SecurityGroup.fromLookupById(
            stack,
            "indexer-db-sg",
            "sg-0cbbb98322234113f"
        );
        databaseSecurityGroup.connections.allowFrom(cluster, Port.tcp(5432));
    }

    // Find the container
    const containerName = indexerService.getConstructMetadata().data.container;
    if (!containerName) {
        console.error("Failed to find container name");
        return;
    }

    const container =
        // Try to find the container via it's name
        indexerService.cdk?.taskDefinition?.findContainer(containerName) ??
        // Otherwise,  get the default one
        indexerService.cdk?.taskDefinition?.defaultContainer;
    if (!container) {
        console.error("Failed to find container");
        return;
    }

    console.log(
        `Found container: ${containerName}: ${container.containerName}`
    );

    // Add a stage secret to the container
    const addSecret = (secretName: string) => {
        const ssmPath = `/indexer/sst/Secret/${secretName}/value`;
        try {
            const stringParameter =
                StringParameter.fromSecureStringParameterAttributes(
                    stack,
                    `Secret${secretName}`,
                    {
                        parameterName: ssmPath,
                    }
                );
            container.addSecret(
                secretName,
                Secret.fromSsmParameter(stringParameter)
            );
        } catch {
            console.error(`Failed to regular secret: ${secretName}`);
        }
    };

    // Add a fallback secret to the container
    const addFallbackSecret = (secretName: string) => {
        const ssmPath = `/sst/frak-indexer/.fallback/Secret/${secretName}/value`;
        try {
            const stringParameter =
                StringParameter.fromSecureStringParameterAttributes(
                    stack,
                    `SecretFallback${secretName}`,
                    {
                        parameterName: ssmPath,
                    }
                );
            container.addSecret(
                `${secretName}_FALLBACK`,
                Secret.fromSsmParameter(stringParameter)
            );
        } catch {
            console.error(`Failed to add fallback secret: ${secretName}`);
        }
    };

    // Add all the secrets directly to the container environment
    for (const secret of secrets) {
        // Add the secrets
        addSecret(secret.name);
        addFallbackSecret(secret.name);
    }
}
