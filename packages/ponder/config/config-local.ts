import { createEnvConfig } from "./configBuilder";

/**
 * Local config
 */
export default createEnvConfig({
    network: {
        chainId: 42161,
        deploymentBlock: 261367992,
    },
    networkKey: "arbitrum",
});
