import { createEnvConfig } from "./configBuilder";

/**
 * Local config
 */
export default createEnvConfig({
    network: {
        chainId: 421614,
        deploymentBlock: 86607902,
    },
    networkKey: "arbitrumSepolia",
});
