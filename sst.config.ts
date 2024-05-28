import { Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import type { SSTConfig } from "sst";
import { Service, type StackContext } from "sst/constructs";

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
    // TODO: Should be bound to the VPC of the postgresql table
    // Get the security group for the database
    const databaseSecurityGroup = SecurityGroup.fromLookupById(
        stack,
        "subgraph-security-group",
        "sg-037f30a3a8d9fa718"
    );

    // The service itself
    const indexerService = new Service(stack, "IndexerService", {
        path: "./",
        port: 42069,
        // Domain mapping
        customDomain: {
            domainName: "indexer.frak.id",
            hostedZone: "frak.id",
        },
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Hardware config
        cpu: "1 vCPU",
        memory: "4 GB",
        storage: "30 GB",
        // Log retention
        logRetention: "one_week",
    });
    // Set up connections to database via security groups
    const cluster = indexerService.cdk?.cluster;
    if (cluster) {
        console.log("Allowing connections from indexer to database");
        databaseSecurityGroup.connections.allowFrom(cluster, Port.tcp(5432));
    }

    stack.addOutputs({
        indexerServiceId: indexerService.id,
    });
}
