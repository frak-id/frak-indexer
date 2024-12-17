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

type RuleExport = [RateLimitRuleConfig, ...RateLimitRuleConfig[]];

export const envioRateRules: RuleExport = [
    genericRateLimitsRules(400),
    {
        method: "eth_getLogs",
        maxCount: 150,
        period: "1s",
        waitTime: "10s",
    },
];

export const alchemyRateRules: RuleExport = [
    genericRateLimitsRules(200),
    {
        method: "eth_getLogs",
        maxCount: 30,
        period: "1s",
        waitTime: "10s",
    },
];

export const pimlicoRateRules: RuleExport = [genericRateLimitsRules(400)];

export const blockPiRateRules: RuleExport = [genericRateLimitsRules(100)];

export const drpcRateRules: RuleExport = [genericRateLimitsRules(100)];

export const llamaFreeRateRules: RuleExport = [genericRateLimitsRules(30)];
export const tenderlyFreeRateRules: RuleExport = [genericRateLimitsRules(10)];
