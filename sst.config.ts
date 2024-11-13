export default $config({
    app(input) {
        return {
            name: "infra-tools",
            removal: input?.stage === "production" ? "retain" : "remove",
            home: "aws",
            provider: {
                aws: {
                    region: "eu-west-1",
                },
            },
            providers: {
                kubernetes: "4.18.3",
                "kubernetes-cert-manager": "0.0.7",
                eks: "3.0.2",
                "kubernetes-coredns": "0.0.2",
            },
        };
    },
    async run() {
        await import("./infra/Config");
        await import("./infra/Cluster");
        // buildErpc({ cluster });
    },
});
