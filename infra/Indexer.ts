import * as pulumiAws from "@pulumi/aws";


// The VPC
const vpc = new sst.aws.Vpc("IndexerVpc", {
    az: 1,
    nat: "managed"
})

// Create the global indexing ecs cluster
const cluster = new sst.aws.Cluster("IndexerCluster", {
    vpc
})

// Get the erpc image
const erpcImage = pulumiAws.ecr.getImage({
    repositoryName: "erpc",
    imageTag: process.env.ERPC_IMAGE_TAG ?? "latest"
    
})

// Create the service
// todo: stuck here for now, can't pass prebuilt image to the service
cluster.addService("ErpcService", {
    // Setup some capacity options
    scaling: {
        min: 1,
        max: 4,
        cpuUtilization: 80,
        memoryUtilization: 80,
    },
    // Global architecture
    architecture: "arm64",
    cpu: "0.5 vCPU",
    memory: "0.5 GB",
    storage: "21 GB",
    // Log stuff
    logging: {
        retention: "3 days"
    },
    // Some env + secrets
    environment: {
        ERPC_LOG_LEVEL: "warn",
    },

    // Some transformation stuff
    transform: {
    }
    
})
