import { createEnvConfig } from "./configBuilder";

/**
 * Config for the prod env
 */
export default createEnvConfig({
    pgDatabase: "ponder_prod",
    network: {
        chainId: 42161,
        deploymentBlock: undefined,
    },
    networkKey: "arbitrum",
});
