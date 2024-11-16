import * as aws from "@pulumi/aws";
import {
    type ComponentResourceOptions,
    type Output,
    all,
} from "@pulumi/pulumi";
import { DnsValidatedCertificate } from "../../.sst/platform/src/components/aws/dns-validated-certificate.js";
import { dns as awsDns } from "../../.sst/platform/src/components/aws/dns.js";
import { Component } from "../../.sst/platform/src/components/component.js";
import {
    type DurationMinutes,
    toSeconds,
} from "../../.sst/platform/src/components/duration.js";

type Port = `${number}/${"http" | "https" | "tcp" | "udp" | "tcp_udp" | "tls"}`;

type ServiceDomainArgs = {
    vpcId: Output<string>;
    // The domain on which it will be linked
    domain: string;
    // Ports config
    ports: {
        listen: Port;
        forward?: Port;
    }[];
    // Healthcheck config
    health: {
        path: string;
        interval: DurationMinutes;
        timeout: DurationMinutes;
        healthyThreshold?: number;
        unhealthyThreshold?: number;
        successCodes?: string;
    };
};

export class ServiceTargets extends Component {
    private readonly certificate: DnsValidatedCertificate;
    private readonly lb: Promise<aws.lb.GetLoadBalancerResult>;

    public readonly targetGroups: Output<Record<string, aws.lb.TargetGroup>>;
    public readonly listeners: Output<Record<string, aws.lb.Listener>>;

    constructor(
        private name: string,
        private args: ServiceDomainArgs,
        opts?: ComponentResourceOptions
    ) {
        super("sst:frak:ServiceDomain", name, args, opts);

        // Get the master load balancer
        this.lb = this.getMasterLoadBalancer();

        // Create the certificate
        this.certificate = this.createSsl();

        // Create the target groups
        const { listeners, targets } = this.createTargets();
        this.targetGroups = targets;
        this.listeners = listeners;

        // Register the service dns alias
        this.registerDnsAlias();
    }

    // Get the master load balancer
    private getMasterLoadBalancer() {
        return aws.lb.getLoadBalancer({
            name: "master-elb",
        });
    }

    // Create the SSL certificate for this service
    private createSsl() {
        return new DnsValidatedCertificate(
            `${this.name}Ssl`,
            {
                domainName: this.args.domain,
                dns: awsDns(),
            },
            { parent: this }
        );
    }

    // Create the target groups
    private createTargets() {
        return all([
            this.args.ports,
            this.args.health,
            this.certificate.arn,
            this.lb,
        ]).apply(([ports, health, cert, lb]) => {
            const listeners: Record<string, aws.lb.Listener> = {};
            const targets: Record<string, aws.lb.TargetGroup> = {};

            for (const p of ports) {
                // Split the port to readable stuff
                const listenParts = p.listen.split("/");
                const forwardParts = p.forward
                    ? p.forward.split("/")
                    : listenParts;

                const forwardProtocol = forwardParts[1].toUpperCase();
                const forwardPort = Number.parseInt(forwardParts[0]);
                const listenProtocol = listenParts[1].toUpperCase();
                const listenPort = Number.parseInt(listenParts[0]);

                // Build the target id
                const targetId = `${forwardProtocol}${forwardPort}`;

                // Create the target group
                const target =
                    targets[targetId] ??
                    new aws.lb.TargetGroup(
                        `${this.name}Target${targetId}`,
                        {
                            namePrefix: forwardProtocol,
                            port: forwardPort,
                            protocol: forwardProtocol,
                            targetType: "ip",
                            vpcId: this.args.vpcId,
                            healthCheck: {
                                path: health.path,
                                healthyThreshold: health.healthyThreshold,
                                unhealthyThreshold: health.unhealthyThreshold,
                                interval: toSeconds(health.interval),
                                timeout: toSeconds(health.timeout),
                                matcher: health.successCodes,
                            },
                        },
                        { parent: this }
                    );
                targets[targetId] = target;

                const listenerId = `${listenProtocol}${listenPort}`;
                const listener =
                    listeners[listenerId] ??
                    new aws.lb.Listener(
                        `${this.name}Listener${listenerId}`,
                        {
                            loadBalancerArn: lb.arn,
                            port: listenPort,
                            protocol: listenProtocol,
                            certificateArn: ["HTTPS", "TLS"].includes(
                                listenProtocol
                            )
                                ? cert
                                : undefined,
                            defaultActions: [
                                {
                                    type: "forward",
                                    targetGroupArn: target.arn,
                                },
                            ],
                        },
                        { parent: this }
                    );
                listeners[listenerId] = listener;

                // Create the listener rule
                new aws.lb.ListenerRule(`${this.name}Rule${listenerId}`, {
                    listenerArn: listener.arn,
                    actions: [
                        {
                            type: "forward",
                            targetGroupArn: target.arn,
                        },
                    ],
                    conditions: [
                        {
                            hostHeader: {
                                values: [this.args.domain],
                            },
                        },
                    ],
                });
            }

            return { listeners, targets };
        });
    }

    // Register the service dns alias
    private registerDnsAlias() {
        const dns = awsDns();
        all([this.lb]).apply(([lb]) => {
            dns.createAlias(
                this.name,
                {
                    name: this.args.domain,
                    aliasName: lb.dnsName,
                    aliasZone: lb.zoneId,
                },
                { parent: this }
            );
        });
    }
}
