import * as aws from "@pulumi/aws";
import { Service } from "../.sst/platform/src/components/aws/service.js";
import { cluster, vpc } from "./common.ts";
import { erpcService } from "./erpc.ts";

// Get the image we will deploy
const isProd = $app.stage === "production";
const imageTag = isProd
    ? process.env.PONDER_PROD_IMAGE_TAG
    : process.env.PONDER_DEV_IMAGE_TAG;
const image = await aws.ecr.getImage({
    repositoryName: isProd ? "indexer-prod" : "indexer-dev",
    imageTag: imageTag ?? "latest",
});

// The erpc path suffix
const erpcPath = isProd ? "/ponder-rpc/evm" : "/ponder-dev-rpc/evm";

// Get the base erpc url
const cloudmapNamespaceId = vpc.nodes.cloudmapNamespace.id;
const cloudmapErpcUrl = `http://${cloudmapNamespaceId}.${erpcService.nodes.cloudmapService.name}${erpcPath}`;
const externalErpcUrl = `https://rpc.frak-labs.com/${erpcPath}`;

// The entrypoint for the ponder instance
const entrypoint = isProd
    ? [
          "pnpm",
          "ponder",
          "--log-format",
          "json",
          "--log-level",
          "warn",
          "--config",
          "config/config-prod.ts",
          "start",
      ]
    : [
          "pnpm",
          "ponder",
          "--log-format",
          "json",
          "--log-level",
          "info",
          "--config",
          "config/config-dev.ts",
          "start",
      ];

// todo: If dev -> Single instance indexing instance without load balancer, cloudfront to ECS link
// todo: If prod -> Indexing instance with no load balancer, and reader with load balancer

/**
 * Build the ponder indexer service
 */
export const ponderIndexer = new Service("PonderIndexer", {
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
    entrypoint,
    // Env
    environment: {
        INTERNAL_RPC_URL: cloudmapErpcUrl,
        EXTERNAL_RPC_URL: externalErpcUrl,
    },
    ssm: {
        // Endpoints secrets,
        PONDER_RPC_SECRET:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/sst/frak-indexer/.fallback/Secret/NEXUS_RPC_SECRET/value",
        // Postgres db
        PONDER_DATABASE_URL:
            "arn:aws:ssm:eu-west-1:262732185023:parameter/indexer/sst/Secret/PONDER_DATABASE_URL/value",
    },
    // Logging options
    logging: {
        retention: "3 days",
    },
});
