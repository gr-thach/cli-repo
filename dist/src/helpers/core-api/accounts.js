"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroyAccount = exports.createAccounts = exports.createAccount = exports.updateAccount = exports.findBaseAccountByCliToken = exports.findAccountWithReposByProviderInternalId = exports.findBaseAccountByProviderInternalId = exports.findBaseAccountsByProviderInternalIds = exports.findAccountsByIdentifiers = exports.findAccountsByIds = exports.findBaseAccountById = exports.findAccountById = void 0;
const get_1 = __importDefault(require("lodash/get"));
const config_1 = require("../../../config");
const index_1 = require("./index");
const fragments_1 = require("./fragments");
// we don't request subscriptions for onpremise
const withSubscription = config_1.env.ENVIRONMENT === 'onpremise' ? 0 : 1;
const _findAccountById = async ({ accountId, withRootAccountInfo = 0 }) => {
    const { data } = await index_1.coreAxios.get(`/accounts/${accountId}`, {
        params: { withRootAccountInfo, withSubscription }
    });
    return data;
};
exports.findAccountById = (0, index_1.wrapper)(async (accountId) => _findAccountById({ accountId, withRootAccountInfo: 1 }));
exports.findBaseAccountById = (0, index_1.wrapper)(async (accountId) => _findAccountById({ accountId }));
// account by id //
// accounst by ids //
exports.findAccountsByIds = (0, index_1.wrapper)(async (accountIds) => {
    if (!accountIds || !accountIds.length) {
        return [];
    }
    const { data } = await index_1.coreAxios.get('/accounts', {
        params: {
            accountIds: accountIds.join(','),
            withRootAccountInfo: 1,
            withSubscription
        }
    });
    return data;
});
// accounst by ids //
// accounts by identifiers //
/**
 * @deprecated - This function is still only used for upload custom engines, but we need to change this and stop using it.
 */
exports.findAccountsByIdentifiers = (0, index_1.wrapper)(async (accountIdentifiers, provider) => {
    if (!accountIdentifiers || !accountIdentifiers.length) {
        return [];
    }
    const { data } = await index_1.coreAxios.get('/accounts', {
        params: {
            accountIdentifiers: accountIdentifiers.join(','),
            provider,
            withRepos: 0,
            withRootAccountInfo: 1,
            withSubscription
        }
    });
    return data;
});
const _findAccountsByProviderInternalIds = async ({ providerInternalIds, provider, type, withRepos = 0, withRootAccountInfo = 0 }) => {
    if (!providerInternalIds || !providerInternalIds.length) {
        return [];
    }
    const { data } = await index_1.coreAxios.get('/accounts', {
        params: {
            providerInternalIds: providerInternalIds.join(','),
            provider,
            type,
            withRepos,
            withRootAccountInfo
        }
    });
    return data;
};
exports.findBaseAccountsByProviderInternalIds = (0, index_1.wrapper)(async (providerInternalIds, provider, type) => _findAccountsByProviderInternalIds({ providerInternalIds, provider, type }));
// base accounst by provider internal ids //
// base account by provider internal id //
const findBaseAccountByProviderInternalId = async (providerInternalId, provider, type) => {
    const accounts = await (0, exports.findBaseAccountsByProviderInternalIds)([providerInternalId], provider, type);
    return (0, get_1.default)(accounts, '[0]');
};
exports.findBaseAccountByProviderInternalId = findBaseAccountByProviderInternalId;
const findAccountWithReposByProviderInternalId = async (providerInternalId, provider, type) => {
    const accounts = await _findAccountsByProviderInternalIds({
        providerInternalIds: [providerInternalId],
        provider,
        type,
        withRepos: 1,
        withRootAccountInfo: 1
    });
    const account = (0, get_1.default)(accounts, '[0]');
    if (!account) {
        return undefined;
    }
    const { repositories, ...rest } = account;
    return {
        ...rest,
        repositories: (0, index_1.formatRepositories)(repositories)
    };
};
exports.findAccountWithReposByProviderInternalId = findAccountWithReposByProviderInternalId;
// base account by provider internal id //
exports.findBaseAccountByCliToken = (0, index_1.wrapper)(async (cliToken) => {
    const query = (0, index_1.gql) `
      query($cliToken: String!) {
        accounts(condition: { cliToken: $cliToken, deletedAt: null }) {
          nodes {
            ...AccountFragment
          }
        }
      }
      ${fragments_1.accountFragment}
    `;
    const variables = { cliToken };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.accounts.nodes[0]');
});
exports.updateAccount = (0, index_1.wrapper)(async (accountId, patch) => {
    if (!patch) {
        throw new Error(`Patch was null or undefined when updating account '${accountId}'.`);
    }
    const query = (0, index_1.gql) `
      mutation updateAccount($input: UpdateAccountInput!) {
        updateAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${fragments_1.accountFragment}
    `;
    const variables = {
        input: {
            idAccount: accountId,
            patch: {
                ...patch,
                updatedAt: new Date().toJSON()
            }
        }
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.updateAccount.account');
});
exports.createAccount = (0, index_1.wrapper)(async (account) => {
    const query = (0, index_1.gql) `
      mutation createAccount($input: CreateAccountInput!) {
        createAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${fragments_1.accountFragment}
    `;
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables: { input: { account } } });
    return (0, get_1.default)(data, 'data.createAccount.account');
});
exports.createAccounts = (0, index_1.wrapper)(async (accounts) => {
    const query = (0, index_1.gql) `
      mutation createAccount($input: CreateAccountInput!) {
        createAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${fragments_1.accountFragment}
    `;
    const { data } = await index_1.coreAxios.post('/graphql', accounts.map(x => ({ query, variables: { input: { account: x } } })));
    return data.reduce((acc, current) => acc.concat(current.data.createAccount.account), []);
});
exports.destroyAccount = (0, index_1.wrapper)(async (accountId) => {
    await index_1.coreAxios.delete(`/accounts/${accountId}`);
});
//# sourceMappingURL=accounts.js.map