export function buildConfig() {
    // Define secrets
    // const config = new Config();
    const secrets = {
        // BLOCKPI_API_KEY_ARB_SEPOLIA: config.requireSecret(
        //     "BLOCKPI_API_KEY_ARB_SEPOLIA"
        // ),
        // BLOCKPI_API_KEY_ARB: config.requireSecret("BLOCKPI_API_KEY_ARB"),
        // ALCHEMY_API_KEY: config.requireSecret("ALCHEMY_API_KEY"),
        // PIMLICO_API_KEY: config.requireSecret("PIMLICO_API_KEY"),
        // PONDER_RPC_SECRET: config.requireSecret("PONDER_RPC_SECRET"),
        // NEXUS_RPC_SECRET: config.requireSecret("NEXUS_RPC_SECRET"),
        // PONDER_DATABASE_URL: config.requireSecret("PONDER_DATABASE_URL"),
        // ERPC_DATABASE_URL: config.requireSecret("ERPC_DATABASE_URL"),
    };

    // Create Kubernetes Secrets
    // const k8sSecrets = new k8s.core.v1.Secret("app-secrets", {
    //     metadata: { name: "app-secrets" },
    //     stringData: secrets,
    // });

    // Return everything
    // return { k8sSecrets, secrets };
}
