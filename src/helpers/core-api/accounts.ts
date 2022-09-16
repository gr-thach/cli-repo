import lodashGet from 'lodash/get';
import { env } from '../../../config';
import { AccountType, BaseAccount, Account, GitProvider, AccountWithRepos } from '../../interfaces';
import { coreAxios, wrapper, gql, formatRepositories } from './index';
import { accountFragment } from './fragments';

// we don't request subscriptions for onpremise
const withSubscription = env.ENVIRONMENT === 'onpremise' ? 0 : 1;

// account by id //
interface FindAccountByIdParams {
  accountId: number;
  withRootAccountInfo?: number;
}
const _findAccountById = async ({ accountId, withRootAccountInfo = 0 }: FindAccountByIdParams) => {
  const { data } = await coreAxios.get(`/accounts/${accountId}`, {
    params: { withRootAccountInfo, withSubscription }
  });
  return data;
};
export const findAccountById = wrapper(
  async (accountId: number): Promise<Account> =>
    _findAccountById({ accountId, withRootAccountInfo: 1 })
);
export const findBaseAccountById = wrapper(
  async (accountId: number): Promise<BaseAccount> => _findAccountById({ accountId })
);
// account by id //

// accounst by ids //
export const findAccountsByIds = wrapper(
  async (accountIds: number[]): Promise<Account[]> => {
    if (!accountIds || !accountIds.length) {
      return [];
    }
    const { data } = await coreAxios.get('/accounts', {
      params: {
        accountIds: accountIds.join(','),
        withRootAccountInfo: 1,
        withSubscription
      }
    });
    return data;
  }
);
// accounst by ids //

// accounts by identifiers //
/**
 * @deprecated - This function is still only used for upload custom engines, but we need to change this and stop using it.
 */
export const findAccountsByIdentifiers = wrapper(
  async (accountIdentifiers: string[], provider: GitProvider): Promise<Account[]> => {
    if (!accountIdentifiers || !accountIdentifiers.length) {
      return [];
    }
    const { data } = await coreAxios.get('/accounts', {
      params: {
        accountIdentifiers: accountIdentifiers.join(','),
        provider,
        withRepos: 0,
        withRootAccountInfo: 1,
        withSubscription
      }
    });
    return data;
  }
);
// accounst by identifiers //

// base accounst by provider internal ids //
interface FindAccountsByProviderInternalIdsParams {
  providerInternalIds: string[];
  provider: GitProvider;
  type?: AccountType;
  withRepos?: number;
  withRootAccountInfo?: number;
}
const _findAccountsByProviderInternalIds = async ({
  providerInternalIds,
  provider,
  type,
  withRepos = 0,
  withRootAccountInfo = 0
}: FindAccountsByProviderInternalIdsParams) => {
  if (!providerInternalIds || !providerInternalIds.length) {
    return [];
  }
  const { data } = await coreAxios.get('/accounts', {
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
export const findBaseAccountsByProviderInternalIds = wrapper(
  async (
    providerInternalIds: string[],
    provider: GitProvider,
    type?: AccountType
  ): Promise<BaseAccount[]> =>
    _findAccountsByProviderInternalIds({ providerInternalIds, provider, type })
);
// base accounst by provider internal ids //

// base account by provider internal id //
export const findBaseAccountByProviderInternalId = async (
  providerInternalId: string,
  provider: GitProvider,
  type?: AccountType
): Promise<BaseAccount> => {
  const accounts = await findBaseAccountsByProviderInternalIds(
    [providerInternalId],
    provider,
    type
  );
  return lodashGet(accounts, '[0]');
};
export const findAccountWithReposByProviderInternalId = async (
  providerInternalId: string,
  provider: GitProvider,
  type?: AccountType
): Promise<AccountWithRepos | undefined> => {
  const accounts = await _findAccountsByProviderInternalIds({
    providerInternalIds: [providerInternalId],
    provider,
    type,
    withRepos: 1,
    withRootAccountInfo: 1
  });
  const account = lodashGet(accounts, '[0]');
  if (!account) {
    return undefined;
  }
  const { repositories, ...rest } = account;
  return {
    ...rest,
    repositories: formatRepositories(repositories)
  };
};
// base account by provider internal id //

export const findBaseAccountByCliToken = wrapper(
  async (cliToken: string): Promise<BaseAccount> => {
    const query = gql`
      query($cliToken: String!) {
        accounts(condition: { cliToken: $cliToken, deletedAt: null }) {
          nodes {
            ...AccountFragment
          }
        }
      }
      ${accountFragment}
    `;
    const variables = { cliToken };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.accounts.nodes[0]');
  }
);

type PatchAccount = Partial<
  Pick<
    BaseAccount,
    | 'fkParentAccount'
    | 'login'
    | 'configuration'
    | 'filterReposByWriteAccess'
    | 'providerMetadata'
    | 'findingConfiguration'
    | 'usersSynchronized'
  >
>;

export const updateAccount = wrapper(
  async (accountId: number, patch: PatchAccount): Promise<BaseAccount> => {
    if (!patch) {
      throw new Error(`Patch was null or undefined when updating account '${accountId}'.`);
    }

    const query = gql`
      mutation updateAccount($input: UpdateAccountInput!) {
        updateAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${accountFragment}
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
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.updateAccount.account');
  }
);

type CreateAccount = Pick<
  BaseAccount,
  'login' | 'type' | 'provider' | 'providerInternalId' | 'createdAt' | 'updatedAt' | 'cliToken'
> &
  Partial<Pick<BaseAccount, 'providerMetadata' | 'installationId'>>;

export const createAccount = wrapper(
  async (account: CreateAccount): Promise<BaseAccount> => {
    const query = gql`
      mutation createAccount($input: CreateAccountInput!) {
        createAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${accountFragment}
    `;
    const { data } = await coreAxios.post('/graphql', { query, variables: { input: { account } } });
    return lodashGet(data, 'data.createAccount.account');
  }
);

export const createAccounts = wrapper(
  async (accounts: CreateAccount[]): Promise<BaseAccount[]> => {
    const query = gql`
      mutation createAccount($input: CreateAccountInput!) {
        createAccount(input: $input) {
          account {
            ...AccountFragment
          }
        }
      }
      ${accountFragment}
    `;
    const { data } = await coreAxios.post(
      '/graphql',
      accounts.map(x => ({ query, variables: { input: { account: x } } }))
    );
    return (data as Array<{ data: { createAccount: { account: Account } } }>).reduce<Account[]>(
      (acc, current) => acc.concat(current.data.createAccount.account),
      []
    );
  }
);

export const destroyAccount = wrapper(
  async (accountId: number): Promise<void> => {
    await coreAxios.delete(`/accounts/${accountId}`);
  }
);
