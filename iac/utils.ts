import { Repository } from "aws-cdk-lib/aws-ecr";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { Secret } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { App, Config, Stack } from "sst/constructs";

const specificSecretsList = ["ERPC_DATABASE_URL", "DATABASE_URL"];

/**
 * Get an ECS image from the given name
 */
export function getImageFromName({
    stack,
    app,
    name,
    tag,
    suffix
}: { stack: Stack; app: App; name: string; tag?: string, suffix?: string }) {
    // Get the container props of our prebuilt binaries
    const containerRegistry = Repository.fromRepositoryAttributes(
        stack,
        `${name}Ecr${suffix}`,
        {
            repositoryArn: `arn:aws:ecr:eu-west-1:${app.account}:repository/${name}`,
            repositoryName: name,
        }
    );

    const imageTag = tag ?? "latest";
    console.log(`Will use the image ${imageTag}`);
    return ContainerImage.fromEcrRepository(containerRegistry, imageTag);
}

/**
 * Build a list of secret name to CDK secret, for direct binding
 * @param stack
 * @param secrets
 */
export function buildSecretsMap({
    stack,
    secrets,
    name,
}: { stack: Stack; secrets: Config.Secret[]; name: string }) {
    return secrets.reduce(
        (acc, secret) => {
            const isSpecificSecret = specificSecretsList.includes(secret.name);
            const ssmPath = isSpecificSecret
                ? `/indexer/sst/Secret/${secret.name}/value`
                : `/sst/frak-indexer/.fallback/Secret/${secret.name}/value`;

            // Add the secret
            const stringParameter =
                StringParameter.fromSecureStringParameterAttributes(
                    stack,
                    `Secret_${name}_${secret.name}`,
                    {
                        parameterName: ssmPath,
                    }
                );
            acc[secret.name] = Secret.fromSsmParameter(stringParameter);
            return acc;
        },
        {} as Record<string, Secret>
    );
}
