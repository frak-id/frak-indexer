import { Port } from "aws-cdk-lib/aws-ec2";
import {
    type ApplicationLoadBalancer,
    ApplicationProtocol,
    type ApplicationTargetGroup,
    ListenerAction,
    ListenerCondition,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";

/**
 * Create the http port mapping
 *  - The http port mapping will expose erpc + ponder reader
 */
export function addHttpListener({
    alb,
    erpcTargetGroup,
    readerTargetGroup,
}: {
    alb: ApplicationLoadBalancer;
    erpcTargetGroup: ApplicationTargetGroup;
    readerTargetGroup: ApplicationTargetGroup;
}) {
    // Create the listener on port 80
    const httpListener = alb.addListener("HttpListener", {
        port: 80,
    });
    httpListener.connections.allowInternally(
        Port.tcp(4001),
        "Allow erpc metrics port internally"
    );
    httpListener.connections.allowInternally(
        Port.tcp(8080),
        "Allow erpc public port internally"
    );
    httpListener.connections.allowInternally(
        Port.tcp(42069),
        "Allow indexer public port internally"
    );

    // Create our erpc target group on port 8080 and bind it to the http listener
    httpListener.addAction("Erpc80ForwardAction", {
        action: ListenerAction.forward([erpcTargetGroup]),
    });
    httpListener.addTargetGroups("Erpc80Target", {
        targetGroups: [erpcTargetGroup],
        priority: 1,
        conditions: [
            ListenerCondition.pathPatterns(["/ponder-rpc/*", "/nexus-rpc/*"]),
        ],
    });

    // Create our listener for ponder reader
    httpListener.addAction("Ponder80ForwardAction", {
        action: ListenerAction.forward([readerTargetGroup]),
    });
    httpListener.addTargetGroups("Ponder80Target", {
        targetGroups: [readerTargetGroup],
        priority: 2,
        conditions: [ListenerCondition.pathPatterns(["/*"])],
    });
}

/**
 * Add a full exposure around the ponder indexer instance
 *   todo: Should be protected endpoint
 */
export function addFullPonderIndexerExposure({
    alb,
    indexerTargetGroup,
}: {
    alb: ApplicationLoadBalancer;
    indexerTargetGroup: ApplicationTargetGroup;
}) {
    alb.addListener("PondexerIndexerListener", {
        port: 8080,
        protocol: ApplicationProtocol.HTTP,
        defaultTargetGroups: [indexerTargetGroup],
    });
}

/**
 * Add a full exposure around the ponder indexer instance
 *   todo: Should be protected endpoint
 */
export function addFullErpcExposure({
    alb,
    erpcTargetGroup,
    erpcMonitorTargetGroup,
}: {
    alb: ApplicationLoadBalancer;
    erpcTargetGroup: ApplicationTargetGroup;
    erpcMonitorTargetGroup: ApplicationTargetGroup;
}) {
    alb.addListener("ErpcListener", {
        port: 8081,
        protocol: ApplicationProtocol.HTTP,
        defaultTargetGroups: [erpcTargetGroup],
    });
    alb.addListener("ErpcMonitorListener", {
        port: 8082,
        protocol: ApplicationProtocol.HTTP,
        defaultTargetGroups: [erpcMonitorTargetGroup],
    });
}
