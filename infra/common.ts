import * as aws from "@pulumi/aws";

// Get the VPC
const { id: vpcId } = await aws.ec2.getVpc({
    filters: [{ name: "tag:Name", values: ["master-vpc"] }],
});
export const vpc = sst.aws.Vpc.get("MasterVpc", vpcId);

// Get the master cluster
export const cluster = await aws.ecs.getCluster({
    clusterName: `master-cluster-${$app.stage}`,
});
