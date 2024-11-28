import type { RateLimitRuleConfig } from "@erpc-cloud/config";

/**
 * Build a generic rate limits rules, counting on the number of request per minutes
 * @param count
 */
function genericRateLimitsRules(count: number): RateLimitRuleConfig {
    return {
        method: "*",
        maxCount: count,
        period: "1s",
        waitTime: "30s",
    };
}

export const envioRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(400),
    {
        method: "eth_getLogs",
        maxCount: 150,
        period: "1s",
        waitTime: "10s",
    },
];

export const alchemyRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(200),
    {
        method: "eth_getLogs",
        maxCount: 30,
        period: "1s",
        waitTime: "10s",
    },
];

export const pimlicoRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(400),
];

export const blockPiRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(100),
];

export const drpcRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(100),
];

export const llamaFreeRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(30),
];
export const tenderlyFreeRateRules: RateLimitRuleConfig[] = [
    genericRateLimitsRules(10),
];
