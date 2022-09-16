import { CustomConfigSpec, EngineConfig } from '../interfaces';
import {
  createEngineAccountConfig,
  updateEngineAccountConfig,
  listEngineAccountConfig,
  queryCustomConfigSpecs
} from './core-api/engineConfigs';
import { persistEngineRules } from './customEngineRule';

export const listEngineConfig = async (accountId: number) => {
  const engineSpecList = await queryCustomConfigSpecs(accountId);

  const customConfigs = await listEngineAccountConfig(accountId);

  return engineSpecList.reduce<EngineConfig[]>((list, spec) => {
    const config = customConfigs.find(c => c.specId === spec.specId);
    if (config) {
      list.push({ ...config, format: spec.format });
    } else {
      list.push(spec);
    }

    return list;
  }, []);
};

export const createEngineConfig = async (
  engineId: number,
  accountId: number,
  { rules, envVars }: Pick<EngineConfig, 'rules' | 'envVars'>,
  configSpec: CustomConfigSpec
) => {
  const customConfig = await createEngineAccountConfig(engineId, configSpec.specId, accountId, {
    rules,
    envVars
  });
  if (rules) {
    await persistEngineRules(rules, accountId, engineId, configSpec.validation);
  }

  return customConfig;
};

export const updateEngineConfig = async (
  engineId: number,
  engineConfigId: string,
  accountId: number,
  { rules, envVars }: Pick<EngineConfig, 'rules' | 'envVars'>,
  configSpec: CustomConfigSpec
) => {
  const customConfig = await updateEngineAccountConfig(engineConfigId, { rules, envVars });

  await persistEngineRules(rules, accountId, engineId, configSpec.validation);

  return customConfig;
};
