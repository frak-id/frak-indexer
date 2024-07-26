import type { SSTConfig } from "sst";
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
        // Remove all resources when non-prod stages are removed
        app.setDefaultRemovalPolicy("destroy");

        // Global function properties
        app.setDefaultFunctionProps({
            // Log param's
            logRetention: "one_week",
            // Runtime node env
            runtime: "nodejs20.x",
            // Use arm64
            architecture: "arm_64",
            // Disable xray tracing
            tracing: "disabled",
        });

        app.stack(ConfigStack);
        app.stack(IndexerStack);
        app.stack(ErpcStack);
    },
} satisfies SSTConfig;
