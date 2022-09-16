import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import boom from '@hapi/boom';
import lodashMerge from 'lodash/merge';
import { validateTokens, validateIsOnPremise, findRepositoryByToken } from '../helpers/preHook';
import { linkToScan } from '../helpers/common';
import { getUploadUrl } from '../helpers/cli';
import { triggerScan } from '../helpers/scan';
import { getScanByCliToken, getScan as getScanById } from '../helpers/core-api/scans';
import { queuePriority } from '../helpers/subscription';
import { GitProvider, ParsedQs, ScanType } from '../interfaces';

export const trigger = async (req: Request, res: Response) => {
  validateIsOnPremise();

  const {
    body: {
      cliToken,
      preHookToken,
      repositoryProviderInternalId,
      sha,
      branch,
      gitArchiveFileName,
      gitDiffFileName,
      provider
    }
  } = req;

  await validateTokens(cliToken, preHookToken);

  const repository = await findRepositoryByToken(
    cliToken,
    preHookToken,
    provider,
    repositoryProviderInternalId
  );

  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const configuration = {
    bundles: [
      {
        general: ['detect-secrets', 'gr-secrets', 'semgrep']
      }
    ]
  };

  const dashboardUrl = linkToScan(repository.account, repository.idRepository, sha);
  const idScan = await triggerScan(
    sha,
    branch,
    repository.account,
    repository,
    ScanType.PRE_HOOK,
    queuePriority(repository.account.subscription, ScanType.PRE_HOOK),
    gitArchiveFileName,
    gitDiffFileName,
    configuration
  );

  return res.status(200).send({ idScan, dashboardUrl });
};

export const uploadUrl = async (req: Request, res: Response) => {
  validateIsOnPremise();

  const {
    body: { cliToken, preHookToken }
  } = req;

  await validateTokens(cliToken, preHookToken);

  const fileName = uuid();
  const signedUrl = await getUploadUrl(fileName);

  return res.status(200).send({ signedUrl, fileName });
};

export const getScan = async (req: Request, res: Response) => {
  validateIsOnPremise();

  const {
    query: { cliToken, preHookToken, idScan }
  } = req;

  await validateTokens(cliToken as string, preHookToken as string);

  let scan;

  if (cliToken) {
    scan = await getScanByCliToken(idScan, cliToken);
  } else if (preHookToken) {
    scan = await getScanById(idScan);
  }

  if (!scan) {
    throw boom.notFound('Scan not found');
  }

  if (scan.type !== ScanType.PRE_HOOK) {
    throw boom.badRequest("Not allowed to fetch a scan that isn't a pre-hook scan.");
  }

  return res.status(200).send({
    idScan: scan.idScan,
    status: scan.status,
    result: scan.result
  });
};

export const getVersion = async (req: Request, res: Response) => {
  validateIsOnPremise();

  const {
    query: { provider, version }
  } = req;

  if (typeof version !== 'string') {
    throw boom.badRequest('Version should be a string.');
  }

  // Version should be in the format major.minor.patch (e.g. 12.3.4).
  if (!/^\d+\.\d+\.\d+$/g.test(version)) {
    throw boom.badRequest('Invalid version format.');
  }

  let result;

  if (provider === GitProvider.GITLAB) {
    if (version === '1.0.0') {
      result = {
        status: 'UP_TO_DATE'
      };
    } else {
      result = {
        status: 'UNSUPPORTED_VERSION',
        info:
          'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
      };
    }
  } else if (provider === GitProvider.BITBUCKET_DATA_CENTER) {
    if (version === '1.0.0') {
      result = {
        status: 'UP_TO_DATE'
      };
    } else {
      result = {
        status: 'UNSUPPORTED_VERSION',
        info:
          'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
      };
    }
  } else {
    throw boom.badRequest(`Unexpected provider '${provider}'.`);
  }

  return res.status(200).send(result);
};

interface GetConfigurationParams extends ParsedQs {
  cliToken: string;
  preHookToken: string;
  provider: string;
  repositoryProviderInternalId: string;
}

export const getConfiguration = async (
  req: Request<any, any, any, GetConfigurationParams>,
  res: Response
) => {
  validateIsOnPremise();

  const {
    query: { cliToken, preHookToken, provider, repositoryProviderInternalId }
  } = req;

  await validateTokens(cliToken as string, preHookToken as string);

  const repository = await findRepositoryByToken(
    cliToken,
    preHookToken,
    provider as GitProvider,
    repositoryProviderInternalId
  );

  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const defaultConfig = { preHook: { enabled: false } };
  const config = lodashMerge(
    defaultConfig,
    repository.account.configuration,
    repository.configuration
  );

  if (!repository.isEnabled) {
    config.preHook.enabled = false;
  }

  return res.status(200).send(config.preHook);
};
