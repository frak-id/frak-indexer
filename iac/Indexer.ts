import {
    AllowedMethods,
    CacheCookieBehavior,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    CachedMethods,
    OriginProtocolPolicy,
    OriginRequestPolicy,
    ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Port, Vpc } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancer } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Duration } from "aws-cdk-lib/core";
import type { StackContext } from "sst/constructs";
import { Distribution } from "sst/constructs/Distribution.js";
import {
    addFullErpcExposure,
    addFullPonderIndexerExposure,
    addHttpListener,
} from "./builder/Alb";
import { addErpcService } from "./builder/Erpc";
import { addPonderService, ponderInstanceTypeConfig } from "./builder/Ponder";

/**
 * The CDK stack that will deploy the indexer service
 * @param stack
 * @constructor
 */
export function IndexerStack({ app, stack }: StackContext) {
    // Create our VPC
    const vpc = new Vpc(stack, "Vpc", {
        natGateways: 1,
    });

    // Create the cluster for each services
    const cluster = new Cluster(stack, "EcsCluster", {
        clusterName: `${stack.stage}-IndexingCluster`,
        vpc,
    });

    // Then add the erpc service
    const { erpcService, erpcMonitorTargetGroup, erpcTargetGroup } =
        addErpcService({
            stack,
            app,
            vpc,
            cluster,
        });

    // Add the indexer service
    const {
        service: indexerSstService,
        fargateService: indexerService,
        targetGroup: indexerTargetGroup,
    } = addPonderService({
        stack,
        app,
        vpc,
        cluster,
        instanceType: ponderInstanceTypeConfig.indexing,
    });
    const {
        service: readerSstService,
        fargateService: readerService,
        targetGroup: readerTargetGroup,
    } = addPonderService({
        stack,
        app,
        vpc,
        cluster,
        instanceType: ponderInstanceTypeConfig.reading,
    });

    // If we are missing the fargate services, early exit
    const erpcFargateService = erpcService.cdk?.fargateService;
    if (!erpcFargateService) {
        throw new Error(
            "Missing fargate service in the indexer or erpc service"
        );
    }

    // Add the erpc service as dependency to the indexer service, to ensure the deployment order
    indexerService.node.addDependency(erpcFargateService);

    // Then create our application load balancer
    const alb = new ApplicationLoadBalancer(stack, "Alb", {
        vpc,
        internetFacing: true,
    });

    // Add the internal erpc url to the ponder instance
    indexerSstService.addEnvironment(
        "ERPC_INTERNAL_URL",
        `http://${alb.loadBalancerDnsName}/ponder-rpc/evm`
    );
    readerSstService.addEnvironment(
        "ERPC_INTERNAL_URL",
        `http://${alb.loadBalancerDnsName}/ponder-rpc/evm`
    );

    // Allow connections to the applications ports
    alb.connections.allowTo(
        indexerService,
        Port.tcp(42069),
        "Allow connection from ALB to public indexer indexing port"
    );
    alb.connections.allowTo(
        readerService,
        Port.tcp(42069),
        "Allow connection from ALB to public indexer serving port"
    );
    alb.connections.allowTo(
        erpcFargateService,
        Port.tcp(8080),
        "Allow connection from ALB to public erpc port"
    );
    alb.connections.allowTo(
        erpcFargateService,
        Port.tcp(4001),
        "Allow connection from ALB to metrics erpc port"
    );

    // Create the listener on port 80
    addHttpListener({
        alb,
        erpcTargetGroup,
        readerTargetGroup,
    });

    // Create full exposure around erpc + ponder on secific ports
    addFullErpcExposure({
        alb,
        erpcTargetGroup,
        erpcMonitorTargetGroup,
    });
    addFullPonderIndexerExposure({
        alb,
        indexerTargetGroup,
    });

    // Create our CDN cache policy
    const cachePolicy = new CachePolicy(this, "CachePolicy", {
        queryStringBehavior: CacheQueryStringBehavior.all(),
        headerBehavior: CacheHeaderBehavior.none(),
        cookieBehavior: CacheCookieBehavior.none(),
        defaultTtl: Duration.days(0),
        maxTtl: Duration.days(365),
        minTtl: Duration.days(0),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
        comment: "Indexer/Rpc response cache policy",
    });

    // Add the cloudfront distribution
    const distribution = new Distribution(this, "Distribution", {
        customDomain: {
            domainName: "indexer.frak.id",
            hostedZone: "frak.id",
        },
        cdk: {
            distribution: {
                defaultRootObject: "",
                defaultBehavior: {
                    viewerProtocolPolicy:
                        ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    origin: new HttpOrigin(alb.loadBalancerDnsName, {
                        protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
                        readTimeout: Duration.seconds(60),
                    }),
                    allowedMethods: AllowedMethods.ALLOW_ALL,
                    cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
                    compress: true,
                    cachePolicy,
                    originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
                },
            },
        },
    });

    stack.addOutputs({
        AlbArn: alb.loadBalancerArn,
        DistributionId: distribution.cdk.distribution.distributionId,
    });

    return indexerService;
}
