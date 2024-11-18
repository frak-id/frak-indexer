import * as aws from "@pulumi/aws";
import { all } from "@pulumi/pulumi";
// Import it manually since not exposed by ssd
import { Service } from "../.sst/platform/src/components/aws/service.js";
import { cluster, vpc } from "./common.ts";
import { ServiceTargets } from "./components/ServiceTargets.ts";

if ($app.stage !== "production") {
    throw new Error("eRPC is reserved for production usage");
}

// Get the image we will deploy
const image = await aws.ecr.getImage({
    repositoryName: "erpc",
    imageTag: process.env.ERPC_IMAGE_TAG ?? "latest",
});

// Create the service targets
const erpcServiceTargets = new ServiceTargets("ErpcServiceDomain", {
    vpcId: vpc.id,
    domain: "rpc.frak.id",
    ports: [
        { listen: "80/http", forward: "8080/http" },
        { listen: "443/https", forward: "8080/http" },
    ],
    health: {
        path: "/healthcheck",
        interval: "60 seconds",
        timeout: "5 seconds",
        successCodes: "200-499",
        healthyThreshold: 2,
        unhealthyThreshold: 5,
    },
});

// Create the erpc service (only on prod stage)
export const erpcService = new Service("Erpc", {
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
    scaling: {
        min: 1,
        max: 4,
        cpuUtilization: 80,
        memoryUtilization: 80,
    },
    // Logging options
    logging: {
        retention: "3 days",
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
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/PONDER_RPC_SECRET/value",
        NEXUS_RPC_SECRET:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/NEXUS_RPC_SECRET/value",
        // Postgres db
        ERPC_DATABASE_URL:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/indexer/sst/Secret/ERPC_DATABASE_URL/value",
    },
    // Tell the service registry to forward requests to the 8080 port
    serviceRegistry: {
        port: 8080,
    },
    // Link the service to the target groups we previously build
    transform: {
        service: {
            loadBalancers: all(erpcServiceTargets.targetGroups).apply(
                (target) =>
                    Object.values(target).map((target) => ({
                        targetGroupArn: target.arn,
                        containerName: "Erpc",
                        containerPort: target.port.apply(
                            (port) => port as number
                        ),
                    }))
            ),
        },
    },
});
