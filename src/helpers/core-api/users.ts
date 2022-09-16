import lodashGet from 'lodash/get';
import { coreAxios, wrapper, gql } from './index';
import { userFragment } from './fragments';
import { SessionProvider, Team, TeamRole, TeamRoleName, User } from '../../interfaces';

export const createUser = wrapper(async (user: Omit<User, 'acl' | 'apiKey' | 'deletedAt'>) => {
  const query = gql`
    mutation createUser($input: CreateUserInput!) {
      createUser(input: $input) {
        user {
          ...UserFragment
        }
      }
    }
    ${userFragment}
  `;

  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: { input: { user } }
  });

  return lodashGet(data, 'data.createUser.user');
});

export const createUsers = wrapper(
  async (
    users: Pick<User, 'idUser' | 'login' | 'provider' | 'providerInternalId' | 'avatarUrl'>[],
    accountId,
    roleId
  ): Promise<User[]> => {
    const { data } = await coreAxios.post(`/users/bulk`, {
      users,
      accountId,
      roleId
    });
    return data;
  }
);

export const updateUser = wrapper(async (idUser: string, patch: Partial<User>) => {
  const query = gql`
    mutation updateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          ...UserFragment
        }
      }
    }
    ${userFragment}
  `;
  const variables = { input: { idUser, patch } };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return lodashGet(data, 'data.updateUser.user');
});

export const findUserByApiKey = wrapper(
  async (apiKey: string): Promise<User | undefined> => {
    const query = gql`
      query($apiKey: String!) {
        users(condition: { apiKey: $apiKey }) {
          nodes {
            ...UserFragment
          }
        }
      }
      ${userFragment}
    `;

    const variables = { apiKey };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    const users = lodashGet(data, 'data.users.nodes') as User[] | undefined;

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
  }
);

export const findUserById = wrapper(
  async (idUser: string): Promise<User | undefined> => {
    const query = gql`
      query($idUser: UUID!) {
        user(idUser: $idUser) {
          ...UserFragment
        }
      }
      ${userFragment}
    `;

    const variables = { idUser };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.user', undefined);
  }
);

export const findUserByProviderInternalId = wrapper(
  async (providerInternalId: string, provider: SessionProvider): Promise<User> => {
    const query = gql`
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
      ${userFragment}
    `;

    const variables = { providerInternalId, provider: provider.toUpperCase() };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.users.nodes[0]', undefined);
  }
);

export const findUsersWithRoleByProviderInternalIds = wrapper(
  async (
    providerInternalIds: string[],
    provider: SessionProvider,
    accountId: number | string
  ): Promise<User[]> => {
    const query = gql`
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
      ${userFragment}
    `;

    const variables = {
      providerInternalIds,
      provider: provider.toUpperCase(),
      fkAccount: typeof accountId === 'string' ? parseInt(accountId, 10) : accountId
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    const users = lodashGet(data, 'data.users.nodes');

    if (!users) {
      return [];
    }

    return users.map((user: any) => {
      const { accountsUsers, ...rest } = user;
      const roleOverwrittenAt = lodashGet(accountsUsers, 'nodes[0].roleOverwrittenAt');
      const role = lodashGet(accountsUsers, 'nodes[0].role');
      return {
        ...rest,
        roleOverwrittenAt,
        ...(role && { role })
      };
    });
  }
);

export const findUserWithRoleByProviderInternalId = wrapper(
  async (
    providerInternalId: string,
    provider: SessionProvider,
    accountId: number | string
  ): Promise<User | undefined> => {
    const users = await findUsersWithRoleByProviderInternalIds(
      [providerInternalId],
      provider,
      accountId
    );
    return lodashGet(users, '[0]', undefined);
  }
);

interface UserFilters {
  teamId?: number;
  search: string;
  role: string;
}

export const queryUsers = wrapper(
  async (
    accountId: number,
    filters: UserFilters,
    limit = null,
    offset = null
  ): Promise<{ totalCount: number; users: User[] }> => {
    const { data } = await coreAxios.get('/users', {
      params: {
        ...filters,
        accountId,
        limit,
        offset
      }
    });

    return data;
  }
);

export const queryUsersFilters = wrapper(async (accountId: number, filters: UserFilters) => {
  const { data } = await coreAxios.get('/users/filters', {
    params: {
      ...filters,
      accountId
    }
  });

  return data;
});

export const createUserRole = wrapper(async (userId: string, accountId: number, roleId: number) => {
  const { data } = await coreAxios.post('/users/role', {
    userId,
    accountId,
    roleId
  });

  return data;
});

export const updateUsersRole = wrapper(
  async (
    userIds: string[],
    accountId: number,
    roleId: number,
    setRoleOverwrittenAt = false,
    cascade = false
  ) => {
    const { data } = await coreAxios.patch('/users/role', {
      userIds,
      accountId,
      roleId,
      setRoleOverwrittenAt,
      cascade
    });

    return data;
  }
);

interface RepositoriesByUser {
  fkRepository: number;
  name: TeamRoleName;
}

export const queryRepositoriesByUserOnTeam: (
  userId: string,
  accountId: number
) => Promise<RepositoriesByUser[]> = wrapper(async (userId: string, accountId: number) => {
  const {
    data: { allowedRepositories }
  } = await coreAxios.get(`/users/${userId}/repositories`, { params: { accountId } });

  return allowedRepositories;
});

export const queryUserTeamsOnUserAccount: (
  accountId: number,
  userId: string,
  teamRoleId?: number
) => Promise<(Team & { teamRole: TeamRole })[]> = wrapper(
  async (accountId: number, userId: string, teamRoleId?: number) => {
    const {
      data: { teams }
    } = await coreAxios.get(`/users/${userId}/accountTeams`, { params: { accountId, teamRoleId } });

    return teams;
  }
);

export const getUserIdsByProviderInternalIds = wrapper(
  async (
    provider: SessionProvider,
    providerInternalIds: string[]
  ): Promise<Array<{ idUser: string; providerInternalId: string }>> => {
    const { data } = await coreAxios.post(`/v2/users/getByProviderInternalIds`, {
      provider,
      providerInternalIds
    });

    return data;
  }
);
