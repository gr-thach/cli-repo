import lodashGet from 'lodash/get';
import lodashUniq from 'lodash/uniq';
import { coreAxios, wrapper, gql, formatRepository, formatRepositories } from './index';
import { repositoryFragment } from './fragments';
import { accountIdentifierFilter } from '../queryFilter';
import { findAccountById, findAccountsByIds } from './accounts';
import {
  CreateRepository,
  FiltersForRepositoryFilters,
  GitProvider,
  Repository,
  RepositoryFilters,
  RepositoryFiltersResponse,
  RepositoryWithAccount
} from '../../interfaces';

export const findRepositoryWithAccountByCliToken = wrapper(
  async (cliToken: string, repositoryName: string): Promise<RepositoryWithAccount | undefined> => {
    const query = gql`
      query($cliToken: String!, $repositoryName: String!) {
        repositories(
          condition: { name: $repositoryName, deletedAt: null }
          filter: {
            accountByFkAccount: { cliToken: { equalTo: $cliToken }, deletedAt: { isNull: true } }
          }
        ) {
          nodes {
            ...RepositoryFragment
          }
        }
      }
      ${repositoryFragment}
    `;

    const variables = { cliToken, repositoryName };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    const repository: Repository | undefined = lodashGet(data, 'data.repositories.nodes[0]');

    if (repository) {
      const account = await findAccountById(repository.fkAccount);
      const repositoryWithAccount: RepositoryWithAccount = {
        ...repository,
        account
      };
      return repositoryWithAccount;
    }
    return undefined;
  }
);

export const findRepositoryWithAccountByProviderInternalId = wrapper(
  async (
    providerInternalId: string,
    provider: GitProvider
  ): Promise<RepositoryWithAccount | undefined> => {
    const { data } = await coreAxios.post(`/v2/repositories/getRepositoryByProviderInternalId`, {
      providerInternalId,
      provider
    });

    const repository = formatRepository(data);

    if (repository) {
      const account = await findAccountById(repository.fkAccount);
      const repositoryWithAccount: RepositoryWithAccount = {
        ...repository,
        account
      };
      return repositoryWithAccount;
    }
    return undefined;
  }
);

export const findRepositoryIdsByProviderInternalId = wrapper(
  async (
    providerInternalIds: string[],
    provider: GitProvider
  ): Promise<Array<{ providerInternalId: string; idRepository: number }>> => {
    const { data } = await coreAxios.post(`/v2/repositories/getRepositoryByProviderInternalIds`, {
      providerInternalIds,
      provider
    });
    return data;
  }
);

export const findRepositoryWithAccountByCliTokenAndProviderInternalId = wrapper(
  async (
    cliToken: string,
    providerInternalId: string
  ): Promise<RepositoryWithAccount | undefined> => {
    const query = gql`
      query($cliToken: String!, $providerInternalId: String!) {
        repositories(
          condition: { providerInternalId: $providerInternalId, deletedAt: null }
          filter: {
            accountByFkAccount: { cliToken: { equalTo: $cliToken }, deletedAt: { isNull: true } }
          }
        ) {
          nodes {
            ...RepositoryFragment
          }
        }
      }
      ${repositoryFragment}
    `;

    const variables = { cliToken, providerInternalId };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    const repository: Repository | undefined = lodashGet(data, 'data.repositories.nodes[0]');
    if (repository) {
      const account = await findAccountById(repository.fkAccount);
      const repositoryWithAccount: RepositoryWithAccount = {
        ...repository,
        account
      };
      return repositoryWithAccount;
    }
    return undefined;
  }
);

export const findRepositoriesByAccountId = wrapper(
  async (accountId: number): Promise<Repository[]> => {
    const query = gql`
      query($idAccount: Int!) {
        repositories(condition: { fkAccount: $idAccount, deletedAt: null }) {
          nodes {
            ...RepositoryFragment
          }
        }
      }
      ${repositoryFragment}
    `;

    const variables = { idAccount: accountId };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    return lodashGet(data, 'data.repositories.nodes');
  }
);

export const getRepositoryById = wrapper(
  async (repositoryId: number): Promise<Repository | undefined> => {
    const { data } = await coreAxios.post(`/v2/repositories/getRepositoryById`, {
      repositoryId
    });

    return formatRepository(data);
  }
);

export const getRepositoryWithAccountById = wrapper(
  async (repositoryId: number): Promise<RepositoryWithAccount | undefined> => {
    const { data } = await coreAxios.post(`/v2/repositories/getRepositoryById`, {
      repositoryId
    });
    const repository = formatRepository(data);

    if (repository) {
      const account = await findAccountById(repository.fkAccount);
      const repositoryWithAccount: RepositoryWithAccount = {
        ...repository,
        account
      };
      return repositoryWithAccount;
    }
    return undefined;
  }
);

export const getRepositoriesByIds = wrapper(
  async (repositoryIds: number[]): Promise<RepositoryWithAccount[]> => {
    const { data } = await coreAxios.post<Repository[]>(`/v2/repositories/getRepositoriesByIds`, {
      repositoryIds
    });

    const repositories = formatRepositories(data);

    const accounts = await findAccountsByIds(lodashUniq(repositories.map(r => r.fkAccount)));

    const repositoriesWithAccount: RepositoryWithAccount[] = [];

    repositories.forEach(repository => {
      const account = accounts.find(a => a.idAccount === repository.fkAccount);
      if (!account) {
        throw Error(`Account not found for repository with id [${repository.idRepository}]`);
      }
      repositoriesWithAccount.push({
        ...repository,
        account
      });
    });

    return repositoriesWithAccount;
  }
);

export const hasRepositoryData = wrapper(
  async (repositoryId: number): Promise<boolean> => {
    const { data } = await coreAxios.post('/v2/repositories/hasData', { repositoryId });
    return lodashGet(data, 'hasData', false);
  }
);

interface RepositoryForBadges {
  badgeToken: string;
  isPrivate: boolean;
  isEnabled: boolean;
}
export const findRepositoryForBadges = wrapper(
  async (
    repoName: string,
    accountIdentifier: string,
    provider: GitProvider
  ): Promise<RepositoryForBadges> => {
    const query = gql`
    query($repoName: String!, $accountIdentifier: String!, $provider: EnumAccountsProvider!) {
      repositories(
        condition: { name: $repoName, deletedAt: null }
        filter: {
          accountByFkAccount: {
            ${accountIdentifierFilter(provider)}
            provider: { equalTo: $provider }
            deletedAt: { isNull: true }
          }
        }
      ) {
        nodes {
          badgeToken
          isPrivate
          isEnabled
        }
      }
    }
  `;

    const variables = {
      repoName,
      accountIdentifier,
      provider: provider.toUpperCase()
    };

    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.repositories.nodes[0]');
  }
);

export const createRepositories = wrapper(
  async (repos: CreateRepository[]): Promise<Repository[]> => {
    if (!repos.length) {
      return [];
    }
    const query = `mutation createRepository($input:CreateRepositoryInput!) {
    createRepository(input:$input) {
      repository { ... RepositoryFragment }
    }
  } ${repositoryFragment}`;

    const { data } = await coreAxios.post<
      any,
      { data: { data: { createRepository: { repository: Repository } } }[] }
    >(
      '/graphql',
      repos.map(x => ({ query, variables: { input: { repository: x } } }))
    );

    const repositories: Repository[] = [];

    data.forEach(result => {
      repositories.push(result.data.createRepository.repository);
    });

    return repositories;
  }
);

type PatchRepository = Partial<
  Pick<
    Repository,
    | 'fkAccount'
    | 'provider'
    | 'isEnabled'
    | 'name'
    | 'isPrivate'
    | 'description'
    | 'fullName'
    | 'language'
    | 'defaultBranch'
    | 'updatedAt'
    | 'configuration'
  >
>;

export const updateRepository = wrapper(
  async (idRepository: number, patch: PatchRepository): Promise<Repository> => {
    const query = `mutation updateRepository($input:UpdateRepositoryInput!) {
    updateRepository(input:$input) {
      repository { ... RepositoryFragment }
    }
  } ${repositoryFragment}`;

    const variables = { input: { idRepository, patch } };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    return lodashGet(data, 'data.updateRepository.repository');
  }
);

export const updateRepositories = wrapper(
  async (
    updatesBatch: { idRepository: number; patch: PatchRepository }[]
  ): Promise<Repository[]> => {
    if (!updatesBatch.length) {
      return [];
    }
    return Promise.all(
      updatesBatch.map(update => updateRepository(update.idRepository, update.patch))
    );
  }
);

export const queryRepoFilters = wrapper(
  async (
    repositoryIds: number[],
    filters: FiltersForRepositoryFilters = {}
  ): Promise<RepositoryFiltersResponse> => {
    const { data } = await coreAxios.post('/repositories/filters', {
      ...filters,
      repositoryIds: repositoryIds.join()
    });

    return data;
  }
);

// Used only to list repositories with pagination
export const queryRepositoriesByIds = wrapper(
  async (
    repositoryIds: number[],
    filters: RepositoryFilters = {}
  ): Promise<{ repositories: Repository[]; totalCount: number }> => {
    const { data } = await coreAxios.post('/repositories', {
      ...filters,
      repositoryIds: repositoryIds.join()
    });

    const repositories = formatRepositories(lodashGet(data, 'repositories'));

    return {
      repositories: repositories,
      totalCount: lodashGet(data, 'totalCount')
    };
  }
);

export const deleteRepositoriesByIds = wrapper(
  async (repositoryIds: number[]): Promise<void> => {
    return coreAxios.post('/v2/repositories/deleteRepositoriesByIds', { repositoryIds });
  }
);
