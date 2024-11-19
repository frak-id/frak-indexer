import type { SSTConfig } from "sst";
import { ClusterStack } from "./iac/Cluster";
import { ConfigStack } from "./iac/Config";
import { ErpcStack } from "./iac/Erpc";
import { IndexerStack } from "./iac/Indexer";

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
        app.setDefaultRemovalPolicy("destroy");
        app.setDefaultFunctionProps({
            // Log param's
            logRetention: "three_days",
            // Runtime node env
            runtime: "nodejs20.x",
            // Use arm64
            architecture: "arm_64",
            // Disable xray tracing
            tracing: "disabled",
        });

        app.stack(ConfigStack)
            .stack(ClusterStack)
            .stack(ErpcStack)
            .stack(IndexerStack);
    },
} satisfies SSTConfig;
