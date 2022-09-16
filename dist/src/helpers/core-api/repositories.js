"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRepositoriesByIds = exports.queryRepositoriesByIds = exports.queryRepoFilters = exports.updateRepositories = exports.updateRepository = exports.createRepositories = exports.findRepositoryForBadges = exports.hasRepositoryData = exports.getRepositoriesByIds = exports.getRepositoryWithAccountById = exports.getRepositoryById = exports.findRepositoriesByAccountId = exports.findRepositoryWithAccountByCliTokenAndProviderInternalId = exports.findRepositoryIdsByProviderInternalId = exports.findRepositoryWithAccountByProviderInternalId = exports.findRepositoryWithAccountByCliToken = void 0;
const get_1 = __importDefault(require("lodash/get"));
const uniq_1 = __importDefault(require("lodash/uniq"));
const index_1 = require("./index");
const fragments_1 = require("./fragments");
const queryFilter_1 = require("../queryFilter");
const accounts_1 = require("./accounts");
exports.findRepositoryWithAccountByCliToken = (0, index_1.wrapper)(async (cliToken, repositoryName) => {
    const query = (0, index_1.gql) `
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
      ${fragments_1.repositoryFragment}
    `;
    const variables = { cliToken, repositoryName };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    const repository = (0, get_1.default)(data, 'data.repositories.nodes[0]');
    if (repository) {
        const account = await (0, accounts_1.findAccountById)(repository.fkAccount);
        const repositoryWithAccount = {
            ...repository,
            account
        };
        return repositoryWithAccount;
    }
    return undefined;
});
exports.findRepositoryWithAccountByProviderInternalId = (0, index_1.wrapper)(async (providerInternalId, provider) => {
    const { data } = await index_1.coreAxios.post(`/v2/repositories/getRepositoryByProviderInternalId`, {
        providerInternalId,
        provider
    });
    const repository = (0, index_1.formatRepository)(data);
    if (repository) {
        const account = await (0, accounts_1.findAccountById)(repository.fkAccount);
        const repositoryWithAccount = {
            ...repository,
            account
        };
        return repositoryWithAccount;
    }
    return undefined;
});
exports.findRepositoryIdsByProviderInternalId = (0, index_1.wrapper)(async (providerInternalIds, provider) => {
    const { data } = await index_1.coreAxios.post(`/v2/repositories/getRepositoryByProviderInternalIds`, {
        providerInternalIds,
        provider
    });
    return data;
});
exports.findRepositoryWithAccountByCliTokenAndProviderInternalId = (0, index_1.wrapper)(async (cliToken, providerInternalId) => {
    const query = (0, index_1.gql) `
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
      ${fragments_1.repositoryFragment}
    `;
    const variables = { cliToken, providerInternalId };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    const repository = (0, get_1.default)(data, 'data.repositories.nodes[0]');
    if (repository) {
        const account = await (0, accounts_1.findAccountById)(repository.fkAccount);
        const repositoryWithAccount = {
            ...repository,
            account
        };
        return repositoryWithAccount;
    }
    return undefined;
});
exports.findRepositoriesByAccountId = (0, index_1.wrapper)(async (accountId) => {
    const query = (0, index_1.gql) `
      query($idAccount: Int!) {
        repositories(condition: { fkAccount: $idAccount, deletedAt: null }) {
          nodes {
            ...RepositoryFragment
          }
        }
      }
      ${fragments_1.repositoryFragment}
    `;
    const variables = { idAccount: accountId };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.repositories.nodes');
});
exports.getRepositoryById = (0, index_1.wrapper)(async (repositoryId) => {
    const { data } = await index_1.coreAxios.post(`/v2/repositories/getRepositoryById`, {
        repositoryId
    });
    return (0, index_1.formatRepository)(data);
});
exports.getRepositoryWithAccountById = (0, index_1.wrapper)(async (repositoryId) => {
    const { data } = await index_1.coreAxios.post(`/v2/repositories/getRepositoryById`, {
        repositoryId
    });
    const repository = (0, index_1.formatRepository)(data);
    if (repository) {
        const account = await (0, accounts_1.findAccountById)(repository.fkAccount);
        const repositoryWithAccount = {
            ...repository,
            account
        };
        return repositoryWithAccount;
    }
    return undefined;
});
exports.getRepositoriesByIds = (0, index_1.wrapper)(async (repositoryIds) => {
    const { data } = await index_1.coreAxios.post(`/v2/repositories/getRepositoriesByIds`, {
        repositoryIds
    });
    const repositories = (0, index_1.formatRepositories)(data);
    const accounts = await (0, accounts_1.findAccountsByIds)((0, uniq_1.default)(repositories.map(r => r.fkAccount)));
    const repositoriesWithAccount = [];
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
});
exports.hasRepositoryData = (0, index_1.wrapper)(async (repositoryId) => {
    const { data } = await index_1.coreAxios.post('/v2/repositories/hasData', { repositoryId });
    return (0, get_1.default)(data, 'hasData', false);
});
exports.findRepositoryForBadges = (0, index_1.wrapper)(async (repoName, accountIdentifier, provider) => {
    const query = (0, index_1.gql) `
    query($repoName: String!, $accountIdentifier: String!, $provider: EnumAccountsProvider!) {
      repositories(
        condition: { name: $repoName, deletedAt: null }
        filter: {
          accountByFkAccount: {
            ${(0, queryFilter_1.accountIdentifierFilter)(provider)}
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
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.repositories.nodes[0]');
});
exports.createRepositories = (0, index_1.wrapper)(async (repos) => {
    if (!repos.length) {
        return [];
    }
    const query = `mutation createRepository($input:CreateRepositoryInput!) {
    createRepository(input:$input) {
      repository { ... RepositoryFragment }
    }
  } ${fragments_1.repositoryFragment}`;
    const { data } = await index_1.coreAxios.post('/graphql', repos.map(x => ({ query, variables: { input: { repository: x } } })));
    const repositories = [];
    data.forEach(result => {
        repositories.push(result.data.createRepository.repository);
    });
    return repositories;
});
exports.updateRepository = (0, index_1.wrapper)(async (idRepository, patch) => {
    const query = `mutation updateRepository($input:UpdateRepositoryInput!) {
    updateRepository(input:$input) {
      repository { ... RepositoryFragment }
    }
  } ${fragments_1.repositoryFragment}`;
    const variables = { input: { idRepository, patch } };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.updateRepository.repository');
});
exports.updateRepositories = (0, index_1.wrapper)(async (updatesBatch) => {
    if (!updatesBatch.length) {
        return [];
    }
    return Promise.all(updatesBatch.map(update => (0, exports.updateRepository)(update.idRepository, update.patch)));
});
exports.queryRepoFilters = (0, index_1.wrapper)(async (repositoryIds, filters = {}) => {
    const { data } = await index_1.coreAxios.post('/repositories/filters', {
        ...filters,
        repositoryIds: repositoryIds.join()
    });
    return data;
});
// Used only to list repositories with pagination
exports.queryRepositoriesByIds = (0, index_1.wrapper)(async (repositoryIds, filters = {}) => {
    const { data } = await index_1.coreAxios.post('/repositories', {
        ...filters,
        repositoryIds: repositoryIds.join()
    });
    const repositories = (0, index_1.formatRepositories)((0, get_1.default)(data, 'repositories'));
    return {
        repositories: repositories,
        totalCount: (0, get_1.default)(data, 'totalCount')
    };
});
exports.deleteRepositoriesByIds = (0, index_1.wrapper)(async (repositoryIds) => {
    return index_1.coreAxios.post('/v2/repositories/deleteRepositoriesByIds', { repositoryIds });
});
//# sourceMappingURL=repositories.js.map