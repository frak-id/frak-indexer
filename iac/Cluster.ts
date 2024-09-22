import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import type { StackContext } from "sst/constructs";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function ClusterStack({ stack }: StackContext) {
    // Use the global nexus vpc
    const vpc = Vpc.fromLookup(stack, "Vpc", {
        vpcName: "nexus-vpc",
    });

    // Create the cluster for each services
    const cluster = new Cluster(stack, "EcsCluster", {
        clusterName: `${stack.stage}-IndexingCluster`,
        vpc,
    });

    stack.addOutputs({
        ClusterName: cluster.clusterName,
    });

    return { cluster, vpc };
}
