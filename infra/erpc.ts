import * as aws from "@pulumi/aws";
// Import it manually since not exposed by ssd
import { Service } from "../.sst/platform/src/components/aws/service.js";

if ($app.stage !== "production") {
    throw new Error("eRPC is reserved for production usage");
}

// Get the VPC
const { id: vpcId } = await aws.ec2.getVpc({
    filters: [{ name: "tag:Name", values: ["master-vpc"] }],
});
const vpc = sst.aws.Vpc.get("MasterVpc", vpcId);

// Get the master cluster
const cluster = await aws.ecs.getCluster({
    clusterName: `master-cluster-${$app.stage}`,
});

// Get the image we will deploy
const image = await aws.ecr.getImage({
    repositoryName: "erpc",
    imageTag: process.env.ERPC_IMAGE_TAG ?? "latest",
});

// Create the erpc service (only on prod stage)
// todo: service not exposed wttffff??
new Service("ErpcService", {
    vpc,
    cluster: {
        name: cluster.clusterName,
        arn: cluster.arn,
    },
    // hardware config
    cpu: "0.25 vCPU",
    memory: "0.5 GB",
    storage: "20 GB",
    architecture: "arm64",
    // Image to be used
    image: image.imageUri,
    // Scaling options
    // todo: request througputs?
    scaling: {
        min: 1,
        max: 4,
        cpuUtilization: 80,
        memoryUtilization: 80,
    },
    // Env
    environment: {
        ERPC_LOG_LEVEL: "warn",
    },
    // SSM secrets
    ssm: {
        // RPCs
        BLOCKPI_API_KEY_ARB_SEPOLIA:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/BLOCKPI_API_KEY_ARB_SEPOLIA/value",
        BLOCKPI_API_KEY_ARB:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/BLOCKPI_API_KEY_ARB/value",
        ALCHEMY_API_KEY:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/ALCHEMY_API_KEY/value",
        PIMLICO_API_KEY:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/PIMLICO_API_KEY/value",
        // Endpoints secrets,
        PONDER_RPC_SECRET:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/NEXUS_RPC_SECRET/value",
        NEXUS_RPC_SECRET:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/NEXUS_RPC_SECRET/value",
        // Postgres db
        ERPC_DATABASE_URL:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/indexer/sst/Secret/ERPC_DATABASE_URL/value",
    },
    // Load balancer options
    loadBalancer: {
        domain: {
            name: "rpc.frak-labs.com",
        },
        ports: [
            { listen: "80/http", forward: "8080/http" },
            { listen: "443/https", forward: "8080/http" },
        ],
        health: {
            "8080/http": {
                path: "/healthcheck",
                interval: "30 seconds",
                successCodes: "200-499",
                healthyThreshold: 2,
                unhealthyThreshold: 5,
            },
        },
    },
    // Logging options
    logging: {
        retention: "3 days",
    },
});
