import { type StackContext, use } from "sst/constructs";
import { ClusterStack } from "./Cluster";
import { ConfigStack } from "./Config";
import { ErpcStack } from "./Erpc";
import { buildSecretsMap, getImageFromName } from "./utils";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function IndexerStack({ app, stack }: StackContext) {
    const { vpc, cluster } = use(ClusterStack);
    const { erpcService } = use(ErpcStack);

    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { ponderDb, ponderRpcSecret } = use(ConfigStack);
    const secrets = [ponderDb, ponderRpcSecret];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({
        stack,
        secrets,
        name: "Ponder",
    });

    // Get the container props of our prebuilt binaries
    const indexerDevImage = getImageFromName({
        stack,
        app,
        name: "indexer-dev",
        tag: process.env.PONDER_DEV_IMAGE_TAG,
    });
    const indexerProdImage = getImageFromName({
        stack,
        app,
        name: "indexer-prod",
        tag: process.env.PONDER_PROD_IMAGE_TAG,
    });

    // todo: Build each services for each config and env
}
