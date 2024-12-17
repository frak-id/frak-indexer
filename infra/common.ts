import * as aws from "@pulumi/aws";
import { Output } from "@pulumi/pulumi";

// Get the VPC
const { id: vpcId } = await aws.ec2.getVpc({
    filters: [{ name: "tag:Name", values: ["master-vpc"] }],
});
export const vpc = sst.aws.Vpc.get("MasterVpc", vpcId);

// Get the master cluster
export const cluster = await aws.ecs.getCluster({
    clusterName: `master-cluster-${$app.stage}`,
});

/**
 * Build the postgres DB for the current env
 */
export const database =
    $app.stage !== "production"
        ? sst.aws.Postgres.get("blockchain", {
              id: "frak-indexer-production-blockchaininstance",
          })
        : new sst.aws.Postgres("blockchain", {
              vpc: Output.create(vpc).apply((v) => ({
                  subnets: v.privateSubnets,
              })),
          });
