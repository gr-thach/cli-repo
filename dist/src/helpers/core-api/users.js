"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdsByProviderInternalIds = exports.queryUserTeamsOnUserAccount = exports.queryRepositoriesByUserOnTeam = exports.updateUsersRole = exports.createUserRole = exports.queryUsersFilters = exports.queryUsers = exports.findUserWithRoleByProviderInternalId = exports.findUsersWithRoleByProviderInternalIds = exports.findUserByProviderInternalId = exports.findUserById = exports.findUserByApiKey = exports.updateUser = exports.createUsers = exports.createUser = void 0;
const get_1 = __importDefault(require("lodash/get"));
const index_1 = require("./index");
const fragments_1 = require("./fragments");
exports.createUser = (0, index_1.wrapper)(async (user) => {
    const query = (0, index_1.gql) `
    mutation createUser($input: CreateUserInput!) {
      createUser(input: $input) {
        user {
          ...UserFragment
        }
      }
    }
    ${fragments_1.userFragment}
  `;
    const { data } = await index_1.coreAxios.post('/graphql', {
        query,
        variables: { input: { user } }
    });
    return (0, get_1.default)(data, 'data.createUser.user');
});
exports.createUsers = (0, index_1.wrapper)(async (users, accountId, roleId) => {
    const { data } = await index_1.coreAxios.post(`/users/bulk`, {
        users,
        accountId,
        roleId
    });
    return data;
});
exports.updateUser = (0, index_1.wrapper)(async (idUser, patch) => {
    const query = (0, index_1.gql) `
    mutation updateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          ...UserFragment
        }
      }
    }
    ${fragments_1.userFragment}
  `;
    const variables = { input: { idUser, patch } };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.updateUser.user');
});
exports.findUserByApiKey = (0, index_1.wrapper)(async (apiKey) => {
    const query = (0, index_1.gql) `
      query($apiKey: String!) {
        users(condition: { apiKey: $apiKey }) {
          nodes {
            ...UserFragment
          }
        }
      }
      ${fragments_1.userFragment}
    `;
    const variables = { apiKey };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    const users = (0, get_1.default)(data, 'data.users.nodes');
    if (!users || users.length === 0) {
        return undefined;
    }
    if (users.length > 1) {
        // This shouldn't be impossible, but if we do get this error we have made a misstake somewhere and
        // managed to generate the same cli token for different accounts.
        const ids = users.map(user => user.idUser);
        throw new Error(`Found multiple users with the same api key. User ids were [${ids}].`);
    }
    return users[0];
});
exports.findUserById = (0, index_1.wrapper)(async (idUser) => {
    const query = (0, index_1.gql) `
      query($idUser: UUID!) {
        user(idUser: $idUser) {
          ...UserFragment
        }
      }
      ${fragments_1.userFragment}
    `;
    const variables = { idUser };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.user', undefined);
});
exports.findUserByProviderInternalId = (0, index_1.wrapper)(async (providerInternalId, provider) => {
    const query = (0, index_1.gql) `
      query($providerInternalId: String!, $provider: EnumUsersProvider!) {
        users(
          condition: {
            provider: $provider
            providerInternalId: $providerInternalId
            deletedAt: null
          }
          first: 1
        ) {
          nodes {
            ...UserFragment
          }
        }
      }
      ${fragments_1.userFragment}
    `;
    const variables = { providerInternalId, provider: provider.toUpperCase() };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.users.nodes[0]', undefined);
});
exports.findUsersWithRoleByProviderInternalIds = (0, index_1.wrapper)(async (providerInternalIds, provider, accountId) => {
    const query = (0, index_1.gql) `
      query($providerInternalIds: [String!], $provider: EnumUsersProvider!, $fkAccount: Int!) {
        users(
          filter: {
            provider: { equalTo: $provider }
            providerInternalId: { in: $providerInternalIds }
            deletedAt: { isNull: true }
          }
        ) {
          nodes {
            ...UserFragment
            accountsUsers: accountsUsersByFkUser(condition: { fkAccount: $fkAccount }) {
              nodes {
                roleOverwrittenAt
                role: roleByFkRole {
                  idRole
                  name
                  description
                }
              }
            }
          }
        }
      }
      ${fragments_1.userFragment}
    `;
    const variables = {
        providerInternalIds,
        provider: provider.toUpperCase(),
        fkAccount: typeof accountId === 'string' ? parseInt(accountId, 10) : accountId
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    const users = (0, get_1.default)(data, 'data.users.nodes');
    if (!users) {
        return [];
    }
    return users.map((user) => {
        const { accountsUsers, ...rest } = user;
        const roleOverwrittenAt = (0, get_1.default)(accountsUsers, 'nodes[0].roleOverwrittenAt');
        const role = (0, get_1.default)(accountsUsers, 'nodes[0].role');
        return {
            ...rest,
            roleOverwrittenAt,
            ...(role && { role })
        };
    });
});
exports.findUserWithRoleByProviderInternalId = (0, index_1.wrapper)(async (providerInternalId, provider, accountId) => {
    const users = await (0, exports.findUsersWithRoleByProviderInternalIds)([providerInternalId], provider, accountId);
    return (0, get_1.default)(users, '[0]', undefined);
});
exports.queryUsers = (0, index_1.wrapper)(async (accountId, filters, limit = null, offset = null) => {
    const { data } = await index_1.coreAxios.get('/users', {
        params: {
            ...filters,
            accountId,
            limit,
            offset
        }
    });
    return data;
});
exports.queryUsersFilters = (0, index_1.wrapper)(async (accountId, filters) => {
    const { data } = await index_1.coreAxios.get('/users/filters', {
        params: {
            ...filters,
            accountId
        }
    });
    return data;
});
exports.createUserRole = (0, index_1.wrapper)(async (userId, accountId, roleId) => {
    const { data } = await index_1.coreAxios.post('/users/role', {
        userId,
        accountId,
        roleId
    });
    return data;
});
exports.updateUsersRole = (0, index_1.wrapper)(async (userIds, accountId, roleId, setRoleOverwrittenAt = false, cascade = false) => {
    const { data } = await index_1.coreAxios.patch('/users/role', {
        userIds,
        accountId,
        roleId,
        setRoleOverwrittenAt,
        cascade
    });
    return data;
});
exports.queryRepositoriesByUserOnTeam = (0, index_1.wrapper)(async (userId, accountId) => {
    const { data: { allowedRepositories } } = await index_1.coreAxios.get(`/users/${userId}/repositories`, { params: { accountId } });
    return allowedRepositories;
});
exports.queryUserTeamsOnUserAccount = (0, index_1.wrapper)(async (accountId, userId, teamRoleId) => {
    const { data: { teams } } = await index_1.coreAxios.get(`/users/${userId}/accountTeams`, { params: { accountId, teamRoleId } });
    return teams;
});
exports.getUserIdsByProviderInternalIds = (0, index_1.wrapper)(async (provider, providerInternalIds) => {
    const { data } = await index_1.coreAxios.post(`/v2/users/getByProviderInternalIds`, {
        provider,
        providerInternalIds
    });
    return data;
});
//# sourceMappingURL=users.js.map