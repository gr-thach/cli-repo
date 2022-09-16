"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.persistEngineRules = exports.inputRuleToCustomEngineRule = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const customEngineRules_1 = require("./core-api/customEngineRules");
const yml_1 = require("./yml");
const grRules_1 = require("./core-api/grRules");
const inputRuleToCustomEngineRule = (rule, accountId, engineId, grRules) => {
    const { grId, grTitle, grDocs, ...metadata } = rule.metadata;
    if (!grId) {
        throw new Error(`rule ${rule.id} is missing metadata grId`);
    }
    const grRule = grRules.find(r => r.name === grId);
    if (!grRule) {
        throw new Error(`grId ${grId} for rule ${rule.id} does not correspond to an existing GuardRails Rule.`);
    }
    return {
        name: rule.id,
        title: grTitle,
        docs: grDocs,
        ruleId: grRule.idRule,
        fkAccount: accountId,
        fkEngine: engineId,
        ...metadata
    };
};
exports.inputRuleToCustomEngineRule = inputRuleToCustomEngineRule;
const persistEngineRules = async (rules, accountId, engineId, validation) => {
    const ruleSet = rules ? js_yaml_1.default.load(rules) : { rules: [] };
    const existingCustomEngineRules = (await (0, customEngineRules_1.findCustomEngineRules)(accountId, engineId));
    const grRules = await (0, grRules_1.listGrRules)();
    if (ruleSet?.rules?.length) {
        const transformedRuleSet = (0, yml_1.transformCustomConfigRules)(ruleSet);
        (0, yml_1.validateCustomConfigRules)(transformedRuleSet, validation);
        const rulesInput = transformedRuleSet.rules.map(r => (0, exports.inputRuleToCustomEngineRule)(r, accountId, engineId, grRules));
        const rulesToDelete = existingCustomEngineRules.filter(existing => !rulesInput.find(r => r.name === existing.name));
        await (0, customEngineRules_1.upsertEngineRules)(rulesInput);
        if (rulesToDelete.length) {
            await (0, customEngineRules_1.deleteEngineRules)(rulesToDelete);
        }
    }
    else if (existingCustomEngineRules.length) {
        await (0, customEngineRules_1.deleteEngineRules)(existingCustomEngineRules);
    }
};
exports.persistEngineRules = persistEngineRules;
//# sourceMappingURL=customEngineRule.js.map