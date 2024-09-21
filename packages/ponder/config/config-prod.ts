import { createEnvConfig } from "./configBuilder";

export default createEnvConfig({
    pgDatabase: "ponder_prod",
    network: {
        chainId: 42161,
        deploymentBlock: undefined,
    },
    networkKey: "arbitrum",
});
