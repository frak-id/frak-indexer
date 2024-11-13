import * as aws from "@pulumi/aws";
import type { Cluster } from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

const subdomain = "rpc.frak-labs.com";
const appLabels = { app: "erpc" };

export function buildErpc({ cluster }: { cluster: Cluster }) {
    // Define the image tag we will use
    const imageTag = process.env.ERPC_IMAGE_TAG ?? "latest";

    // Get the ECR repository and build the image URI
    const repo = aws.ecr.getRepositoryOutput({ name: "erpc" });
    const imageUri = repo.apply(
        (result) => `${result.repositoryUrl}:${imageTag}`
    );

    // Define app labels and deployment
    const deployment = new k8s.apps.v1.Deployment(
        "erpc-deployment",
        {
            metadata: { name: "erpc" },
            spec: {
                replicas: 1,
                selector: { matchLabels: appLabels },
                template: {
                    metadata: { labels: appLabels },
                    spec: {
                        containers: [
                            {
                                name: "erpc",
                                image: imageUri,
                                ports: [{ containerPort: 8080 }],
                                envFrom: [
                                    { secretRef: { name: "app-secrets" } },
                                ],
                                resources: {
                                    requests: { cpu: "250m", memory: "512Mi" },
                                    limits: { cpu: "250m", memory: "512Mi" },
                                },
                                livenessProbe: {
                                    httpGet: {
                                        path: "/healthcheck",
                                        port: 8080,
                                    },
                                    initialDelaySeconds: 20,
                                    periodSeconds: 10,
                                    failureThreshold: 5,
                                },
                            },
                        ],
                    },
                },
            },
        },
        { provider: cluster.provider }
    );

    // Define Ingress for service exposure with SSL and DNS annotations
    const ingress = new k8s.networking.v1.Ingress(
        "erpc-ingress",
        {
            metadata: {
                name: "erpc-ingress",
                annotations: {
                    "external-dns.alpha.kubernetes.io/hostname": subdomain, // ExternalDNS annotation
                    "cert-manager.io/cluster-issuer": "letsencrypt-production", // Cert-Manager for SSL
                },
            },
            spec: {
                rules: [
                    {
                        host: subdomain,
                        http: {
                            paths: [
                                {
                                    path: "/",
                                    pathType: "Prefix",
                                    backend: {
                                        service: {
                                            name: deployment.metadata.name,
                                            port: { number: 8080 },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
                tls: [
                    {
                        hosts: [subdomain],
                        secretName: "tls-secret-rpc-frak-id",
                    },
                ],
            },
        },
        { provider: cluster.provider }
    );

    return { ingress };
}
