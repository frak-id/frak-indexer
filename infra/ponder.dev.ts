import * as aws from "@pulumi/aws";
import { Service } from "../.sst/platform/src/components/aws/service.js";
import { cluster, vpc } from "./common.ts";
import { ServiceCloudfrontTarget } from "./components/ServiceCloudfrontTargets.ts";
import { getPonderEntrypoint, ponderEnv } from "./utils.ts";

// Get the image we will deploy
const image = await aws.ecr.getImage({
    repositoryName: "indexer-dev",
    imageTag: process.env.PONDER_DEV_IMAGE_TAG ?? "latest",
});

/**
 * Build the ponder indexing service
 */
export const ponderIndexer = new Service("PonderDevIndexer", {
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
    entrypoint: getPonderEntrypoint("indexer"),
    // Env
    ...ponderEnv,
    // Logging options
    logging: {
        retention: "3 days",
    },
    // Tell the service registry to forward requests to the 42069 port
    serviceRegistry: {
        port: 42069,
    },
});

/**
 * Add the cloudfront distribution to it
 */
export const target = new ServiceCloudfrontTarget("PonderIndexerCloudfront", {
    vpcId: vpc.id,
    service: ponderIndexer,
    domain: "ponder-dev.frak-labs.com",
});
