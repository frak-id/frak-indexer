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
        // ERPC deployment on prod
        if ($app.stage === "production") {
            await import("./infra/erpc.ts");
        }
    },
});
