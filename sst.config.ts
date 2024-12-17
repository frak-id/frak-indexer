/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "frak-indexer",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            provider: {
                aws: {
                    region: "eu-west-1",
                },
            },
        };
    },
    async run() {
        await import("./infra/common.ts");

        await import("./infra/erpc.ts");

        if ($app.stage === "production") {
            // Ponder deployment on prod
            await import("./infra/ponder.prod.ts");
        } else {
            // Only ponder on dev
            await import("./infra/ponder.dev.ts");
        }
    },
});
