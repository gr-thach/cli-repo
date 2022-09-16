import crypto from 'crypto';
import moment from 'moment';
import boom from '@hapi/boom';
import { IncomingWebhook } from '@slack/client';
import { Schema } from 'bitbucket';
import lodashGet from 'lodash/get';
import reportError from '../../sentry';
import { env, constants } from '../../config';
import { findRepositoriesByAccountId } from './core-api/repositories';
import { queryRepositoriesByUserOnTeam } from './core-api/users';
import { createLastNDaysArray } from './stats';
import { getFeatureValue } from './subscription';
import { compareRepo as compareRepoGitlab } from './gitlab';
import { compareRepo as compareRepoBitbucketDataCenter } from './bitbucketDataCenter';
import {
  GitProvider,
  GitlabRepository,
  BBDCRepository,
  Repository,
  PlanFeatureName,
  Stats,
  GitRepository,
  GithubRepository,
  RepositoryWithAccount,
  AllowedRepositoriesByTeamRole,
  BaseAccount,
  CreateRepository,
  RequestUser
} from '../interfaces';
import { parseUser } from './user';

const generateBadgeToken = (identifier: string) => {
  const hmacForBadgesToken = () => crypto.createHmac('sha256', env.GUARDRAILS_BADGES_TOKEN_SECRET);
  return hmacForBadgesToken()
    .update(identifier.toLowerCase())
    .digest('hex');
};

export const getProviderSpecificFieldsForUpdate = (
  provider: GitProvider,
  gitRepo: GitRepository,
  isLegacyPlan?: boolean,
  existingRepo?: Repository
) => {
  let repo;

  if (provider === GitProvider.GITHUB) {
    repo = gitRepo as GithubRepository;
    let isEnabled;
    if (existingRepo) {
      isEnabled = existingRepo.isEnabled;
      if (!isEnabled && existingRepo.createdAt === existingRepo.updatedAt && !isLegacyPlan) {
        isEnabled = true;
      }
    }
    return {
      name: repo.name,
      ...(isEnabled !== undefined && { isEnabled }),
      isPrivate: !!repo.private,
      description: repo.description,
      fullName: repo.full_name,
      language: repo.language,
      defaultBranch: repo.default_branch,
      updatedAt: new Date().toJSON()
    };
  }
  if (provider === GitProvider.GITLAB) {
    repo = gitRepo as GitlabRepository;
    return {
      name: repo.path,
      isPrivate: repo.visibility === 'private',
      description: repo.description,
      fullName: repo.path_with_namespace,
      language: undefined,
      defaultBranch: repo.default_branch,
      updatedAt: new Date().toJSON()
    };
  }
  if (provider === GitProvider.BITBUCKET) {
    repo = gitRepo as Schema.Repository;
    if (!repo.name) {
      throw new Error('Expected to find the name on git repository.');
    }
    return {
      name: repo.name,
      isPrivate: !!repo.is_private,
      description: repo.description,
      fullName: repo.full_name || repo.name,
      language: repo.language,
      defaultBranch: lodashGet(gitRepo, 'mainbranch.name'),
      updatedAt: new Date().toJSON()
    };
  }
  if (provider === GitProvider.BITBUCKET_DATA_CENTER) {
    repo = gitRepo as BBDCRepository;
    if (!repo.id) {
      throw new Error('Expected to find a id on git repository.');
    }
    if (!repo.slug) {
      throw new Error('Expected to find a slug on git repository.');
    }
    return {
      name: repo.slug,
      isPrivate: !repo.public,
      // description: repo.description,
      fullName: `projects/${repo.project.key}/repos/${repo.slug}`,
      language: undefined,
      // defaultBranch: repo.default_branch,
      updatedAt: new Date().toJSON()
    };
  }
  throw new Error(`Invalid provider: "${provider}"`);
};

export const getProviderSpecificFieldsForCreate = (
  provider: GitProvider,
  gitRepo: GitRepository
) => {
  let repo;
  const updateFields = getProviderSpecificFieldsForUpdate(provider, gitRepo);
  if (provider === GitProvider.GITHUB) {
    repo = gitRepo as GithubRepository;
    return {
      ...updateFields,
      badgeToken: generateBadgeToken(repo.full_name),
      providerInternalId: String(repo.id)
    };
  }
  if (provider === GitProvider.GITLAB) {
    repo = gitRepo as GitlabRepository;
    return {
      ...updateFields,
      badgeToken: generateBadgeToken(repo.path),
      providerInternalId: String(repo.id)
    };
  }
  if (provider === GitProvider.BITBUCKET) {
    repo = gitRepo as Schema.Repository;
    if (!repo.name) {
      throw new Error('Expected to find the name on git repository.');
    }
    if (!repo.uuid) {
      throw new Error('Expected to find the uuid on git repository.');
    }
    return {
      ...updateFields,
      badgeToken: generateBadgeToken(repo.name),
      providerInternalId: repo.uuid
    };
  }
  if (provider === GitProvider.BITBUCKET_DATA_CENTER) {
    repo = gitRepo as BBDCRepository;
    if (!repo.id) {
      throw new Error('Expected to find a id on git repository.');
    }
    return {
      ...updateFields,
      badgeToken: generateBadgeToken(String(repo.id)),
      providerInternalId: String(repo.id)
    };
  }
  throw new Error(`Invalid provider: "${provider}"`);
};

export const populateGitReposToDBRepos = (
  account: BaseAccount,
  gitRepos: GitRepository[],
  isLegacyPlan: boolean
): CreateRepository[] => {
  if (!Array.isArray(gitRepos)) {
    throw new Error('gitRepos is not an array');
  }

  const { idAccount, provider } = account;

  return gitRepos.map(gitRepo => ({
    provider: provider,
    ...getProviderSpecificFieldsForCreate(provider, gitRepo),
    // for new github repos that are not in a legacy plan, we enable by default
    isEnabled: provider === GitProvider.GITHUB && !isLegacyPlan,
    fkAccount: idAccount,
    createdAt: new Date().toJSON()
  }));
};

export const isPrivateReposLimitReached = async (repository: RepositoryWithAccount) => {
  const repositories = await findRepositoriesByAccountId(repository.fkAccount);

  const totalPrivateRepositoriesCount = repositories.reduce((acc, currentRepository) => {
    if (env.ENVIRONMENT === 'onpremise') {
      return acc + (currentRepository.isEnabled ? 1 : 0);
    }
    return acc + (currentRepository.isPrivate && currentRepository.isEnabled ? 1 : 0);
  }, 0);

  const accountMaxPrivateReposAllowed = (await getFeatureValue(
    repository.account.subscription,
    PlanFeatureName.PRIVATE_REPOSITORIES
  )) as number;

  // limit reached
  if (totalPrivateRepositoriesCount >= accountMaxPrivateReposAllowed) {
    return {
      totalPrivateRepositoriesCount,
      accountMaxPrivateReposAllowed
    };
  }
  return false;
};

export const shouldUpdateRepository = (
  repo: Repository,
  gitRepo: GitRepository,
  provider: GitProvider,
  isLegacyPlan: boolean
) => {
  switch (provider) {
    case GitProvider.GITHUB:
      return !repo.isEnabled && repo.createdAt === repo.updatedAt && !isLegacyPlan;
    case GitProvider.GITLAB:
      return compareRepoGitlab(repo, gitRepo as GitlabRepository);
    case GitProvider.BITBUCKET_DATA_CENTER:
      return compareRepoBitbucketDataCenter(repo, gitRepo as BBDCRepository);
    default:
      return false;
  }
};

export const formatRepositoriesStatsResponse = (stats: Stats[], days = 30) => {
  const orderedResponse: { [key: string]: { [key: string]: {} } } = {};
  const mergedStatsByRepositoryFk: { [key: string]: { [key: string]: number } } = {};
  const lastThirtyDays = createLastNDaysArray(days);

  stats.forEach(row => {
    const repoId = String(row.fkRepository);

    if (!mergedStatsByRepositoryFk[repoId]) {
      mergedStatsByRepositoryFk[repoId] = {};
    }

    const d = moment(row.timegroup).format('YYYY-MM-DD');

    mergedStatsByRepositoryFk[repoId][d] = row.totalVulnerabilities;
  });

  Object.keys(mergedStatsByRepositoryFk).forEach(repoId => {
    let previous = 0;
    orderedResponse[repoId] = {};
    Object.keys(lastThirtyDays).forEach(date => {
      if (mergedStatsByRepositoryFk[repoId][date] === undefined) {
        orderedResponse[repoId][date] = previous;
      } else {
        orderedResponse[repoId][date] = mergedStatsByRepositoryFk[repoId][date];
        previous = mergedStatsByRepositoryFk[repoId][date];
      }
    });
  });

  return orderedResponse;
};

export const getAllAccountsRepositoryIds = async (accountId: number) => {
  const allAccountRepositories = await findRepositoriesByAccountId(accountId);
  return allAccountRepositories.map(r => r.idRepository);
};

export const getAllowedRepositoryIdsGroupedByTeamRole = async (
  userId: string,
  accountId: number
) => {
  const allowedRepositoriesGroupByTeamRole = await queryRepositoriesByUserOnTeam(userId, accountId);
  if (!allowedRepositoriesGroupByTeamRole.length) {
    return null;
  }

  return allowedRepositoriesGroupByTeamRole.reduce<AllowedRepositoriesByTeamRole>(
    (acc, { name: teamRoleName, fkRepository }) => {
      acc[teamRoleName]!.push(fkRepository);
      return acc;
    },
    {
      team_developer: [],
      team_security_engineer: [],
      team_admin: []
    }
  );
};

export const privateRepositoriesLimitReachedError = async ({
  repositoryId,
  user,
  totalPrivateRepositoriesCount,
  accountMaxPrivateReposAllowed
}: {
  repositoryId: number;
  user: RequestUser;
  totalPrivateRepositoriesCount: number;
  accountMaxPrivateReposAllowed: number;
}) => {
  if (env.ENVIRONMENT === 'production' || env.ENVIRONMENT === 'staging') {
    try {
      const { login } = parseUser(user);
      const webhook = new IncomingWebhook(
        env.ENVIRONMENT === 'production'
          ? constants.slackGrowthWebhookUrl
          : constants.slackDevopsWebhookUrl
      );
      const message = `:warning: ${login} tried to enable repo with id ${repositoryId} | private enabled repos: ${totalPrivateRepositoriesCount} / plan limit: ${accountMaxPrivateReposAllowed}`;

      await webhook.send(message);
    } catch (e) {
      await reportError(e);
    }
  }

  throw boom.paymentRequired('Your plan does not allow more private repositories');
};
