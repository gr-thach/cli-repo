import yaml from 'js-yaml';
import {
  CustomEngineRule,
  CustomEngineRuleFile,
  CustomEngineRuleSchema,
  GrRule
} from '../interfaces';
import {
  findCustomEngineRules,
  upsertEngineRules,
  deleteEngineRules
} from './core-api/customEngineRules';
import { validateCustomConfigRules, transformCustomConfigRules } from './yml';
import { listGrRules } from './core-api/grRules';

export const inputRuleToCustomEngineRule = (
  rule: CustomEngineRule,
  accountId: number,
  engineId: number,
  grRules: GrRule[]
) => {
  const { grId, grTitle, grDocs, ...metadata } = rule.metadata;

  if (!grId) {
    throw new Error(`rule ${rule.id} is missing metadata grId`);
  }

  const grRule = grRules.find(r => r.name === grId);
  if (!grRule) {
    throw new Error(
      `grId ${grId} for rule ${rule.id} does not correspond to an existing GuardRails Rule.`
    );
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

export const persistEngineRules = async (
  rules: string | undefined,
  accountId: number,
  engineId: number,
  validation: string
) => {
  const ruleSet = rules ? (yaml.load(rules) as CustomEngineRuleFile) : { rules: [] };

  const existingCustomEngineRules = (await findCustomEngineRules(
    accountId,
    engineId
  )) as CustomEngineRuleSchema[];

  const grRules = await listGrRules();

  if (ruleSet?.rules?.length) {
    const transformedRuleSet: CustomEngineRuleFile = transformCustomConfigRules(ruleSet);
    validateCustomConfigRules(transformedRuleSet, validation);
    const rulesInput = transformedRuleSet.rules.map(r =>
      inputRuleToCustomEngineRule(r, accountId, engineId, grRules)
    );
    const rulesToDelete = existingCustomEngineRules.filter(
      existing => !rulesInput.find(r => r.name === existing.name)
    );
    await upsertEngineRules(rulesInput);
    if (rulesToDelete.length) {
      await deleteEngineRules(rulesToDelete);
    }
  } else if (existingCustomEngineRules.length) {
    await deleteEngineRules(existingCustomEngineRules);
  }
};
