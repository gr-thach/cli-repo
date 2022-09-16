import { Account, RequestUser, PermissionAction, Resource } from '../interfaces';
import PermissionService from '../services/permissions/permission';
import PolicyService from '../services/permissions/policy';
import { getAllowedRepositoriesByUserOnAccount } from './acl';
import { findUserWithRoleByProviderInternalId } from './core-api/users';
import { getAllAccountsRepositoryIds } from './repository';

export const getPolicyByRequestUserAndAccount = async (
  user: RequestUser,
  account: Account
): Promise<PolicyService> => {
  const userInDb = await findUserWithRoleByProviderInternalId(
    user.providerInternalId,
    user.provider,
    account.idAccount
  );

  const {
    allowedRepositories: ACLAllowedRepositories
  } = await getAllowedRepositoriesByUserOnAccount(user, account.idAccount);

  const allAccountRepositoryIds = await getAllAccountsRepositoryIds(account.idAccount);

  return PolicyService.createInstance(account, userInDb, {
    ACLAllowedRepositories,
    allAccountRepositoryIds
  });
};

export const getAccountPermissionForUser = async (user: RequestUser, account: Account) => {
  const policy = await getPolicyByRequestUserAndAccount(user, account);

  const allowedWriteResources = (
    await PermissionService.factory(policy, PermissionAction.WRITE, [
      Resource.ACCOUNTS,
      Resource.JIRA_CONFIG,
      Resource.SUBSCRIPTION,
      Resource.CUSTOM_CONFIG,
      Resource.SAML,
      Resource.USERS,
      Resource.TEAMS,
      Resource.ACTIONS
    ])
  ).getAllowedResources();

  const allowedReadResources = (
    await PermissionService.factory(policy, PermissionAction.READ, [Resource.USER_EVENTS])
  ).getAllowedResources();

  return {
    read: allowedReadResources,
    write: allowedWriteResources
  };
};
