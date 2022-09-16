import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { createEngineConfig, updateEngineConfig, listEngineConfig } from '../helpers/engineConfig';
import { fetchCustomConfigSpec, getEngineAccountConfig } from '../helpers/core-api/engineConfigs';

export const list = async (req: Request, res: Response) => {
  const { account } = req;

  const engineSpecs = await listEngineConfig(account!.idAccount);

  return res.send(engineSpecs);
};

export const create = async (req: Request, res: Response) => {
  const {
    params: { engineId },
    body: { rules, envVars },
    query: { configSpecId },
    account
  } = req;

  let engineConfig;
  const configSpec = await fetchCustomConfigSpec(String(configSpecId));
  if (!configSpec) {
    throw boom.badRequest('Error: config spec not found for this account');
  }
  try {
    engineConfig = await createEngineConfig(
      Number(engineId),
      account!.idAccount,
      { rules, envVars },
      configSpec
    );
  } catch (e) {
    throw boom.badRequest((e as Error).message);
  }

  return res.status(201).send(engineConfig);
};

export const update = async (req: Request, res: Response) => {
  const {
    params: { engineId },
    body: { rules, envVars },
    query: { engineConfigId, configSpecId },
    account
  } = req;

  const accountEngineConfig = await getEngineAccountConfig(
    String(engineConfigId),
    account!.idAccount
  );
  if (!accountEngineConfig) {
    throw boom.notFound(
      `Engine config with id ${engineConfigId} and accountId ${account!.idAccount} not found`
    );
  }

  const configSpec = await fetchCustomConfigSpec(String(configSpecId));
  if (!configSpec) {
    throw boom.badRequest('Error: config spec not found for this account');
  }
  let engineConfig;
  try {
    engineConfig = await updateEngineConfig(
      Number(engineId),
      String(engineConfigId),
      account!.idAccount,
      {
        rules,
        envVars
      },
      configSpec
    );
  } catch (e) {
    throw boom.badRequest((e as Error).message);
  }

  return res.status(201).send(engineConfig);
};
