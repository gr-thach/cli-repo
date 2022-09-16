import boom from '@hapi/boom';

import { findBaseAccountByCliToken } from './core-api/accounts';
import { env } from '../../config';
import {
  findRepositoryWithAccountByCliTokenAndProviderInternalId,
  findRepositoryWithAccountByProviderInternalId
} from './core-api/repositories';
import { GitProvider } from '../interfaces';

// There are two ways of authenticating with pre-hook.
// 1. Using cli token, this is used by Bitbucket pre-hook because the token is entered in the Bitbucket UI in the project or repo settings.
//    which means that we can't have a single token because then users could trigger scans for repositories that they don't have access to.
// 2. Using pre-hook token, this is used by Gitlab pre-hook, this is because the pre-hook is installed inside the Gitlab instance on a global level,
//    so it is only possible to have a single token for all repositories in the Gitlab instance. The pre-hook token is entered in the replicated config
//    and in the pre-hook config inside the Gitlab instance.
export const validateTokens = async (cliToken: string, preHookToken: string) => {
  if (cliToken && preHookToken) {
    throw boom.badRequest(
      'You are not allowed to authenticate with both a cli token and a pre-hook token.'
    );
  } else if (cliToken) {
    const account = await findBaseAccountByCliToken(cliToken);

    if (!account) {
      throw boom.badRequest('Invalid cli token.');
    }
  } else if (preHookToken) {
    if (preHookToken !== env.GUARDRAILS_PRE_HOOK_TOKEN) {
      throw boom.badRequest('Invalid pre-hook token.');
    }
  } else {
    throw boom.badRequest('Requires cli token or pre-hook token.');
  }
};

export const validateIsOnPremise = () => {
  if (env.ENVIRONMENT !== 'onpremise') {
    throw boom.badRequest('Endpoint is only available in on-premise installations.');
  }
};

export const findRepositoryByToken = async (
  cliToken: string,
  preHookToken: string,
  provider: GitProvider,
  repositoryProviderInternalId: string
) => {
  let repository;

  if (cliToken) {
    repository = findRepositoryWithAccountByCliTokenAndProviderInternalId(
      cliToken,
      repositoryProviderInternalId
    );
  } else if (preHookToken) {
    repository = findRepositoryWithAccountByProviderInternalId(
      repositoryProviderInternalId,
      provider
    );
  } else {
    throw boom.badRequest('Requires cli token or pre-hook token.');
  }

  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  return repository;
};
