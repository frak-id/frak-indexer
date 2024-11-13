/// <reference path="./.sst/platform/config.d.ts" />

import { buildCluster, buildConfig, buildErpc } from "./iac";

export default $config({
    app(_input) {
        return {
            name: "infra-tools",
            removal: "remove",
            home: "aws",
            provider: {
                aws: {
                    region: "eu-west-1",
                },
            },
        };
    },
    async run() {
        buildConfig();
        const { cluster } = buildCluster();
        buildErpc({ cluster });
    },
});
