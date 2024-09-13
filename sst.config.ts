/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "frak-indexer",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
            region: "eu-west-1",
        }
      }
    };
  },
  async run() {
    // todo: need to reput the config variables
    // await import("./infra/Config");
    await import("./infra/Indexer");
  },
});
