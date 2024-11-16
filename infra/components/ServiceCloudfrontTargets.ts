import * as aws from "@pulumi/aws";
import {
    type ComponentResourceOptions,
    type Output,
    all,
} from "@pulumi/pulumi";
import { DnsValidatedCertificate } from "../../.sst/platform/src/components/aws/dns-validated-certificate.js";
import { dns as awsDns } from "../../.sst/platform/src/components/aws/dns.js";
import type { Service } from "../../.sst/platform/src/components/aws/service.js";
import { Component } from "../../.sst/platform/src/components/component.js";
import { vpc } from "../common.ts";

type ServiceCloudfrontTargetArgs = {
    vpcId: Output<string>;
    service: Service;
    // The domain on which it will be linked
    domain: string;
};

export class ServiceCloudfrontTarget extends Component {
    private readonly dns = awsDns();

    private readonly certificate: DnsValidatedCertificate;
    private readonly distribution: aws.cloudfront.Distribution;

    constructor(
        private name: string,
        private args: ServiceCloudfrontTargetArgs,
        opts?: ComponentResourceOptions
    ) {
        super("sst:frak:ServiceCloudfrontTarget", name, args, opts);

        // Create the certificate
        this.certificate = this.createSsl();

        // Create the cloudfront distribution
        this.distribution = this.createCloudfrontDistribution();

        // Register the service dns alias
        this.registerDnsAlias();
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

    // Create the cloudfront distribution
    private createCloudfrontDistribution() {
        // Get the cloudmap service and namespace
        const domainName = all([
            vpc.nodes.cloudmapNamespace.id,
            this.args.service.nodes.cloudmapService.name,
        ]).apply(([namespaceId, serviceName]) => {
            return `${namespaceId}.${serviceName}`;
        });

        // Build the cloudfront distribution
        return new aws.cloudfront.Distribution(
            `${this.name}Distribution`,
            {
                enabled: true,
                origins: [
                    {
                        domainName,
                        originId: "ECSServiceOrigin",
                        customOriginConfig: {
                            httpPort: 80,
                            httpsPort: 443,
                            originSslProtocols: ["TLSv1.2"],
                            originProtocolPolicy: "https-only",
                        },
                    },
                ],
                defaultCacheBehavior: {
                    targetOriginId: "ECSServiceOrigin",
                    viewerProtocolPolicy: "redirect-to-https",
                    allowedMethods: ["GET", "HEAD", "OPTIONS"],
                    cachedMethods: ["GET", "HEAD"],
                    forwardedValues: {
                        queryString: true,
                        cookies: { forward: "none" },
                    },
                },
                viewerCertificate: {
                    acmCertificateArn: this.certificate.arn,
                    sslSupportMethod: "sni-only",
                },
                restrictions: {
                    geoRestriction: {
                        restrictionType: "none",
                    },
                },
            },
            {
                parent: this,
            }
        );
    }

    // Register the service dns alias
    private registerDnsAlias() {
        this.dns.createAlias(
            this.name,
            {
                name: this.args.domain,
                aliasName: this.distribution.domainName,
                aliasZone: this.distribution.hostedZoneId,
            },
            { parent: this }
        );
    }
}
