import boom from '@hapi/boom';
import { AllowedAccounts, AllowedRepositories, RequestUser } from '../interfaces';
import SyncService from '../services/sync';
import Cache from '../services/cache';
import { env } from '../../config';
import { parseUser } from './user';
import { findUserByProviderInternalId, updateUser } from './core-api/users';

const allowedAccountsCacheKey = (provider: string, login: string) => {
  return `allowedAccounts_${provider}_${login}_v2`;
};

/**
 * This function runs the synchronize logic to get all needed entities from the VCS and save it on cache
 * and user's table to then be able to access this information to know what each user has access to.
 *
 * @param user RequestUser is the user we get from the session
 * @returns AllowedAccounts Json string
 */
export const renewAllowedAccountsByUser = async (user: RequestUser) => {
  const { provider, login } = parseUser(user);
  const cache = new Cache(env.CACHE_PROVIDER).getInstance();

  const syncService = new SyncService(user, Boolean(env.ACL_WRITE_ACCESS_REPOS_MODE));
  const allowedAccounts = await syncService.synchronize();

  const allowedAccountsJson = JSON.stringify(allowedAccounts);
  const cacheKey = allowedAccountsCacheKey(provider, login);
  cache.set(cacheKey, allowedAccountsJson, env.ACL_CACHE_EXPIRE_TIME);

  const userInDb = await findUserByProviderInternalId(user.providerInternalId, provider);
  await updateUser(userInDb.idUser, { acl: allowedAccountsJson });

  return allowedAccountsJson;
};

export const getAllowedAccountsByUser = async (
  user: RequestUser
): Promise<{ allowedAccounts: AllowedAccounts; isSynchronizing: boolean }> => {
  const { provider, login } = parseUser(user);
  const cache = new Cache(env.CACHE_PROVIDER).getInstance();
  const cacheKey = allowedAccountsCacheKey(provider, login);

  let isSynchronizing = false;

  // 1. try to get it from cache
  let allowedAccountsJson = await cache.get(cacheKey);
  if (allowedAccountsJson === null) {
    // 2. if not in cache, we try to get it from the DB, it should be there unless is the first time they login, then it means we are synchronizing
    const userInDb = await findUserByProviderInternalId(user.providerInternalId, provider);
    if (userInDb.acl) {
      // 3. if it's in the DB but no in cache, we get the value and also set the cache so we can re-use in the next requests
      allowedAccountsJson = userInDb.acl;
      cache.set(cacheKey, allowedAccountsJson, env.ACL_CACHE_EXPIRE_TIME);
    } else {
      // 4. If not in cache, and not in db, then it's first time we're synchronizing and we need to return that for proper handling
      isSynchronizing = true;
    }
  }

  return {
    allowedAccounts: allowedAccountsJson ? JSON.parse(allowedAccountsJson) : {},
    isSynchronizing
  };
};

export const clearAllowedAccountsByUser = async (user: RequestUser) => {
  const { provider, login } = parseUser(user);
  const cache = new Cache(env.CACHE_PROVIDER).getInstance();
  const cacheKey = allowedAccountsCacheKey(provider, login);

  await cache.del(cacheKey);

  const userInDb = await findUserByProviderInternalId(user.providerInternalId, provider);
  await updateUser(userInDb.idUser, { acl: null });
};

export const checkIfUserCanAccessAccountId = async (
  user: RequestUser,
  accountId: number | string
) => {
  const { allowedAccounts } = await getAllowedAccountsByUser(user);
  const allAllowedAccountIds = Object.keys(allowedAccounts).map(Number);

  if (!allAllowedAccountIds.includes(Number(accountId))) {
    throw boom.forbidden('Not authorized to perform the operation');
  }
};

export const getAllowedRepositoriesByUserOnAccount = async (
  user: RequestUser,
  accountId: number
): Promise<{
  allowedAccounts: AllowedAccounts;
  allowedRepositories: AllowedRepositories;
  allAllowedRepositoryIds: number[];
}> => {
  const { allowedAccounts } = await getAllowedAccountsByUser(user);
  const allAllowedAccountIds = Object.keys(allowedAccounts).map(Number);

  if (!allAllowedAccountIds.includes(accountId)) {
    throw boom.forbidden('Not authorized to perform the operation');
  }

  const { allowedRepositories } = allowedAccounts[accountId];
  const allAllowedRepositoryIds = allowedRepositories.read.concat(allowedRepositories.admin);

  return { allowedAccounts, allowedRepositories, allAllowedRepositoryIds };
};
