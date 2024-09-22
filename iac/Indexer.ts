import type { EcrImage } from "aws-cdk-lib/aws-ecs";
import type { Secret } from "aws-cdk-lib/aws-ecs";
import { Duration } from "aws-cdk-lib/core";
import {
    Service,
    type ServiceProps,
    type Stack,
    type StackContext,
    use,
} from "sst/constructs";
import { ClusterStack } from "./Cluster";
import { ConfigStack } from "./Config";
import { ErpcStack } from "./Erpc";
import { buildSecretsMap, getImageFromName } from "./utils";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function IndexerStack({ app, stack }: StackContext) {
    const { vpc, cluster } = use(ClusterStack);
    const { erpcService } = use(ErpcStack);

    // All the secrets env variable we will be using (in local you can just use a .env file)
    const { ponderDb, ponderRpcSecret } = use(ConfigStack);
    const secrets = [ponderDb, ponderRpcSecret];

    // Get our CDK secrets map
    const cdkSecretsMap = buildSecretsMap({
        stack,
        secrets,
        name: "Ponder",
    });

    // Get the potential internal erpc dns
    const erpcInternalDns =
        erpcService.cdk?.applicationLoadBalancer?.loadBalancerDnsName;

    // Get the container props of our prebuilt binaries
    const indexerDevImage = getImageFromName({
        stack,
        app,
        name: "indexer-dev",
        tag: process.env.PONDER_DEV_IMAGE_TAG,
    });
    const indexerProdImage = getImageFromName({
        stack,
        app,
        name: "indexer-prod",
        tag: process.env.PONDER_PROD_IMAGE_TAG,
    });

    // Some global config that will be shared accross all the instances
    const sharedConfig = {
        path: "packages/ponder",
        port: 42069,
        // Bind the secret we will be using
        bind: secrets,
        // Arm architecture (lower cost)
        architecture: "arm64",
        // Log retention
        logRetention: "three_days",
        // Set the right environment variables
        environment: {
            // Erpc endpoint
            ERPC_URL: erpcInternalDns
                ? `http://${erpcInternalDns}/ponder-rpc/evm`
                : "https://rpc.frak.id/ponder-rpc/evm",
        },
        cdk: {
            vpc,
            cluster,
        },
    } as const;

    // Build the dev indexer instance
    const devIndexer = createServiceConfig({
        stack,
        serviceName: "PonderIndexerDevService",
        sharedConfig,
        typeKey: "indexer",
        image: indexerDevImage,
        entryPoint: entryPoints.dev.indexer,
        secrets: cdkSecretsMap,
    });

    // Build the dev reader instance
    const devReader = createServiceConfig({
        stack,
        serviceName: "PonderReaderDevService",
        sharedConfig,
        typeKey: "reader",
        domainKey: "dev",
        image: indexerDevImage,
        entryPoint: entryPoints.dev.reader,
        secrets: cdkSecretsMap,
    });

    // // Build the prod indexer instance
    // const prodIndexer = createServiceConfig({
    //     stack,
    //     serviceName: "PonderIndexerProdService",
    //     sharedConfig,
    //     typeKey: "indexer",
    //     image: indexerProdImage,
    //     entryPoint: entryPoints.prod.indexer,
    //     secrets: cdkSecretsMap,
    // });

    // // Build the prod reader instance
    // const prodReader = createServiceConfig({
    //     stack,
    //     serviceName: "PonderReaderProdService",
    //     sharedConfig,
    //     typeKey: "reader",
    //     domainKey: "prod",
    //     image: indexerProdImage,
    //     entryPoint: entryPoints.prod.reader,
    //     secrets: cdkSecretsMap,
    // });

    stack.addOutputs({
        DevIndexerServiceId: devIndexer.id,
        DevReaderServiceId: devReader.id,
        // ProdIndexerServiceId: prodIndexer.id,
        // ProdReaderServiceId: prodReader.id,
    });

    // Tell that prod and dev indexer services depends on the erpc service
    devIndexer.node.addDependency(erpcService);
    // prodIndexer.node.addDependency(erpcService);
}

/**
 * Create a service config
 */
function createServiceConfig({
    stack,
    serviceName,
    sharedConfig,
    typeKey,
    domainKey,
    image,
    secrets,
    entryPoint,
}: {
    stack: Stack;
    serviceName: string;
    sharedConfig: Pick<ServiceProps, "port"> & Partial<ServiceProps>;
    typeKey: keyof typeof baseProps;
    domainKey?: keyof typeof domainProps;
    entryPoint: string[];
    image: EcrImage;
    secrets: Record<string, Secret>;
}) {
    return new Service(stack, serviceName, {
        ...sharedConfig,
        ...baseProps[typeKey],
        customDomain: domainKey ? domainKey[domainKey] : undefined,
        cdk: {
            ...sharedConfig.cdk,
            ...baseProps[typeKey].cdk,
            container: {
                containerName: serviceName.toLowerCase(),
                image,
                secrets: secrets,
                entryPoint,
            },
        },
    });
}

/**
 * Base props for the different indexing services
 */
const baseProps: Record<"indexer" | "reader", Partial<ServiceProps>> = {
    indexer: {
        cpu: "0.5 vCPU",
        memory: "1 GB",
        storage: "20 GB",
        scaling: {
            minContainers: 1,
            maxContainers: 1,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
        cdk: {
            // No ALB for the indexing instances
            applicationLoadBalancer: false,
            // No cloudfront distribution for the indexing instances
            cloudfrontDistribution: false,
            fargateService: {
                circuitBreaker: { enable: true },
                // Disable rollup update for the indexer
                desiredCount: 1,
                minHealthyPercent: 0,
                maxHealthyPercent: 100,
            },
        },
    },
    reader: {
        cpu: "0.25 vCPU",
        memory: "0.5 GB",
        storage: "20 GB",
        scaling: {
            minContainers: 1,
            maxContainers: 4,
            cpuUtilization: 90,
            memoryUtilization: 90,
        },
        cdk: {
            fargateService: {
                circuitBreaker: { enable: true },
            },
            // Custom the health check on the reading instance
            applicationLoadBalancerTargetGroup: {
                deregistrationDelay: Duration.seconds(10),
                healthCheck: {
                    path: "/health",
                    interval: Duration.seconds(30),
                    healthyThresholdCount: 2,
                    unhealthyThresholdCount: 5,
                    healthyHttpCodes: "200-299",
                },
            },
        },
    },
};

/**
 * Docker entry points depending on the instance type
 */
const entryPoints = {
    dev: {
        indexer: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "info",
            "--config",
            "config/config-dev.ts",
            "start",
        ],
        reader: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "warn",
            "--config",
            "config/config-dev.ts",
            "serve",
        ],
    },
    prod: {
        indexer: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "warn",
            "--config",
            "config/config-prod.ts",
            "start",
        ],
        reader: [
            "pnpm",
            "ponder",
            "--log-format",
            "json",
            "--log-level",
            "warn",
            "--config",
            "config/config-prod.ts",
            "serve",
        ],
    },
};

/**
 * Domain depending on the env
 */
const domainProps = {
    dev: {
        domainName: "indexer-dev.frak.id",
        hostedZone: "frak.id",
    },
    prod: {
        domainName: "indexer.frak.id",
        hostedZone: "frak.id",
    },
};
