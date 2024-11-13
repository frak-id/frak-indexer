import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

export function buildCluster() {
    const vpc = awsx.ec2.Vpc.get("nexus-vpc", "vpc-id");

    // Create an EKS cluster with Fargate profiles if needed
    const cluster = new eks.Cluster("IndexingCluster", {
        vpcId: vpc.id,
        instanceType: "t3.medium",
        desiredCapacity: 1,
        minSize: 1,
        maxSize: 4,
    });

    // Install Cert-Manager via Helm
    const certManager = new k8s.helm.v3.Chart(
        "cert-manager",
        {
            chart: "cert-manager",
            version: "v1.10.1",
            fetchOpts: { repo: "https://charts.jetstack.io" },
            values: { installCRDs: true },
        },
        { provider: cluster.provider }
    );

    // ClusterIssuer for Let's Encrypt (Cert-Manager)
    const clusterIssuer = new k8s.apiextensions.CustomResource(
        "letsencrypt-cluster-issuer",
        {
            apiVersion: "cert-manager.io/v1",
            kind: "ClusterIssuer",
            metadata: { name: "letsencrypt-production" },
            spec: {
                acme: {
                    server: "https://acme-v02.api.letsencrypt.org/directory",
                    email: "tech@frak-labs.com",
                    privateKeySecretRef: { name: "letsencrypt-production-key" },
                    solvers: [
                        {
                            dns01: {
                                route53: {
                                    region: "eu-west-1",
                                    // todo: dynamic find the hosted zone id
                                    hostedZoneID: "eu-west-1",
                                },
                            },
                        },
                    ],
                },
            },
        },
        { provider: cluster.provider }
    );

    // Install ExternalDNS via Helm
    const externalDns = new k8s.helm.v3.Chart(
        "external-dns",
        {
            chart: "external-dns",
            version: "1.10.0",
            fetchOpts: { repo: "https://charts.bitnami.com/bitnami" },
            values: {
                provider: "aws",
                aws: { zoneType: "public" },
                domainFilters: ["frak-labs.com"],
                policy: "sync",
            },
        },
        { provider: cluster.provider }
    );

    // Return everything
    return { vpc, cluster, certManager, clusterIssuer, externalDns };
}
