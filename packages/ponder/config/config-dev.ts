import { createEnvConfig } from "./configBuilder";

export default createEnvConfig({
    pgDatabase: "ponder_dev",
    network: {
        chainId: 421614,
        deploymentBlock: 75793399,
    },
    networkKey: "arbitrumSepolia",
});
