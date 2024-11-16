import * as aws from "@pulumi/aws";

// Get the image we will deploy
const isProd = $app.stage === "production";
const imageTag = isProd
    ? process.env.PONDER_PROD_IMAGE_TAG
    : process.env.PONDER_DEV_IMAGE_TAG;
const _image = await aws.ecr.getImage({
    repositoryName: isProd ? "indexer-prod" : "indexer-dev",
    imageTag: imageTag ?? "latest",
});

// todo: If dev -> Single instance indexing instance without load balancer
// todo: If prod -> Indexing instance with no load balancer, and reader with load balancer
