import { createEnvConfig } from "./configBuilder";

/**
 * Local config
 */
export default createEnvConfig({
    network: {
        chainId: 421614,
        deploymentBlock: 75793399,
    },
    networkKey: "arbitrumSepolia",
});
