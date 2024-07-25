import { Secret } from "aws-cdk-lib/aws-ecs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Config, Stack } from "sst/constructs";

const specificSecretsList = ["ERPC_DATABASE_URL", "DATABASE_URL"];

/**
 * Build a list of secret name to CDK secret, for direct binding
 * @param stack
 * @param secrets
 */
export function buildSecretsMap(stack: Stack, secrets: Config.Secret[]) {
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
                    `Secret${secret.name}`,
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
