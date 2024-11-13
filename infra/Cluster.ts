import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";
import * as certmanager from "@pulumi/kubernetes-cert-manager";

// Get our main vpc
//  todo: How to find it nicely?
// export const vpc = sst.aws.Vpc.get("Vpc", "vpc-012a9fe84bf8bdc9c");

// Create an EKS cluster with Fargate profiles if needed
//  todo: This should be a top level cluster shared by every ressources
//  todo: Each env and app should have their own namespace, like app.name-app.stage
//  todo: But they should share same ingress, same cluster, and same loadbalancers
//  todo: For local deployment, skip everything tht is backend related?
export const cluster = new eks.Cluster("IndexingCluster", {
    // vpcId: vpc.id,
    instanceType: "t4g.medium",
    desiredCapacity: 1,
    minSize: 1,
    maxSize: 4,
});

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig;

// Create the eks secrets
export const k8sSecrets = new k8s.core.v1.Secret(
    "app-secrets",
    {
        metadata: { name: "app-secrets" },
        stringData: {},
    },
    {
        provider: cluster.provider,
    }
);

// Install cert-manager into our cluster.
export const certManager = new certmanager.CertManager(
    "cert-manager",
    {
        installCRDs: true,
    },
    { provider: cluster.provider }
);

// ClusterIssuer for Let's Encrypt (Cert-Manager)
export const clusterIssuer = new k8s.apiextensions.CustomResource(
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
//  todo: This is failing
//  todo: This should also be moved to an infra specific repository
export const externalDns = new k8s.helm.v3.Chart(
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
