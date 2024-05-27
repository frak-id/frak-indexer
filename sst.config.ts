/// <reference path=".sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: "frak-indexer",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            providers: {
                aws: {
                    region: "eu-west-1",
                },
            },
        };
    },
    async run() {
        // const vpc = new sst.aws.Vpc("IndexerVpc");

        const cluster = new sst.aws.Cluster("IndexerCluster");

        cluster.addService("IndexerService", {
            public: {
                // Domain mapping
                domain: {
                    name: "indexer.frak.id",
                },
                // Port of the container
                ports: [{ listen: "42069/http", forward: "42069/http" }],
            },
            // Arm architecture (lower cost)
            architecture: "arm64",
            // Hardware config
            cpu: "1 vCPU",
            memory: "4 GB",
            storage: "30 GB",
            // Log retention
            logging: {
                retention: "1 week",
            },
        });
    },
});
