import boom from '@hapi/boom';
import crypto from 'crypto';
import { Schema } from 'bitbucket';
import { env } from '../../config';
import {
  createAccounts,
  createAccount,
  updateAccount,
  findBaseAccountsByProviderInternalIds,
  findBaseAccountByProviderInternalId
} from './core-api/accounts';
import { createSubscriptions } from './core-api/subscriptions';
import { createSubscriptionChangelogs } from './core-api/subscriptionChangelogs';
import { findPlanByCode } from './core-api/plans';
import { findUserByProviderInternalId } from './core-api/users';
import {
  assertIsGitlabUser,
  assertIsGitlabGroup,
  assertHasMatchingGitlabGroup,
  assertAccountMatchesGitlabUser,
  assertAccountMatchesGitlabGroup
} from './assertGitlab';
import {
  AccountType,
  BaseAccount,
  GitAccount,
  GithubInstallation,
  GitlabGroup,
  GitlabUser,
  GitProvider,
  PlanCode,
  RequestUser,
  SubscriptionInterval
} from '../interfaces';
import { createPolicyForAccounts } from './core-api/permissions';

const gitlabAvatarUrl = (group: GitlabGroup | GitlabUser) => {
  let avatar_url = group.avatar_url || '';
  if (avatar_url && !avatar_url.match(/https:\/\//)) {
    avatar_url = `${env.GITLAB_URL}${avatar_url}`;
  }
  return avatar_url;
};

export default class AccountHelper {
  provider: GitProvider;

  user: RequestUser;

  constructor(provider: GitProvider, user: RequestUser) {
    if (!provider) {
      throw new Error(`Invalid provider ${provider}`);
    }
    if (!user) {
      throw new Error('Invalid user');
    }
    this.provider = provider;
    this.user = user;
  }

  async bulkCreateFromGithubInstallations(installations: GithubInstallation[]) {
    if (this.provider !== GitProvider.GITHUB) {
      throw new Error('bulkCreateFromGithubInstallations only works for provider = GITHUB');
    }

    const hmacForCliToken = () => crypto.createHmac('sha256', env.GUARDRAILS_CLI_TOKEN_SECRET);

    const accounts = await createAccounts(
      installations.map(({ id, account }) => ({
        login: account.login,
        type: account.type.toUpperCase() as AccountType,
        provider: GitProvider.GITHUB,
        installationId: id,
        providerInternalId: String(account.id),
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON(),
        cliToken: hmacForCliToken()
          .update(String(account.id))
          .digest('hex')
      }))
    );

    await this.bulkCreateAccountsSubscriptions(accounts);

    await createPolicyForAccounts(accounts.map(a => a.idAccount));
  }

  async syncGitlabGroups(groups: GitlabGroup[]) {
    groups.forEach(group => assertIsGitlabGroup(group));

    const groupIds = groups.map(group => group.id);
    let accounts = await this.getGitlabOrganizationAccountsForSync(groupIds);

    // Check that the list of accounts actually matches the Gitlab groups that we were looking for.
    // So we didn't accidentally retrieved the wrong accounts from the database.
    assertHasMatchingGitlabGroup(accounts, groups);

    const groupsInDb: GitlabGroup[] = [];
    const groupsNotInDb: GitlabGroup[] = [];
    groups.forEach(group => {
      if (accounts.find(acc => acc.providerInternalId === String(group.id))) {
        groupsInDb.push(group);
      } else {
        groupsNotInDb.push(group);
      }
    });

    if (groupsNotInDb.length) {
      await this._bulkCreateFromGitlabGroups(groupsNotInDb);
    }

    if (groupsInDb.length) {
      await this._bulkUpdateIfNeededFromGitlabGroups(groupsInDb, accounts);
    }

    // Get the new/updated list of accounts and set the fkParentAccount
    accounts = await this.getGitlabOrganizationAccountsForSync(groupIds);
    assertHasMatchingGitlabGroup(accounts, groups);

    await this._bulkUpdateAccountsFkParentAccount(groups, accounts);
  }

  // eslint-disable-next-line class-methods-use-this
  async getGitlabOrganizationAccountsForSync(providerInternalIds: number[]) {
    const providerInternalIdStrings = providerInternalIds.map(providerInternalId => {
      if (typeof providerInternalId !== 'number') {
        throw new Error(`providerInternalId should be a number, got ${typeof providerInternalId}.`);
      }

      return String(providerInternalId);
    });

    // we get accounts without subscription when synchronizing because their parent account id is not yet set
    return findBaseAccountsByProviderInternalIds(
      providerInternalIdStrings,
      GitProvider.GITLAB,
      AccountType.ORGANIZATION
    );
  }

  async _bulkCreateFromGitlabGroups(groups: GitlabGroup[]) {
    return Promise.all(groups.map(group => this._createGitlabGroupAccount(group)));
  }

  async _createGitlabGroupAccount(group: GitlabGroup) {
    // Do a last sanity check so we don't accedentially create an invalid Gitlab group account by misstake.
    assertIsGitlabGroup(group);

    if (this.provider !== GitProvider.GITLAB) {
      throw new Error('_createGitlabGroupAccount only works for provider = GITLAB');
    }

    // This is just an extra fail-safe so we don't accidentally create duplicate accounts,
    if (await this._doesAccountExist(group.id, AccountType.ORGANIZATION, GitProvider.GITLAB)) {
      throw new Error(
        `Failed to create Gitlab group account, account already exist with providerInternalId ${group.id}.`
      );
    }

    const hmacForCliToken = () => crypto.createHmac('sha256', env.GUARDRAILS_CLI_TOKEN_SECRET);

    const account = await createAccount({
      login: this._getLoginFromGitlabGroup(group),
      type: AccountType.ORGANIZATION,
      provider: GitProvider.GITLAB,
      providerInternalId: String(group.id),
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      cliToken: hmacForCliToken()
        .update(String(group.id))
        .digest('hex')
    });

    // When a GitLab Group has a parent group, the subscription will be created only on the root group
    if (!group.parent_id) {
      await this.bulkCreateAccountsSubscriptions([account]);
    }

    await createPolicyForAccounts([account.idAccount]);

    return account;
  }

  // eslint-disable-next-line class-methods-use-this
  _getLoginFromGitlabGroup(group: GitlabGroup) {
    if (!group || (!group.full_path && !group.path)) {
      throw new Error(
        `Couldn't get login based on Gitlab group. Gitlab group didn't contain full_path nor path. Gitlab group was ${JSON.stringify(
          group,
          null,
          2
        )}`
      );
    }

    // full_path is only available on groups and not on user accounts.
    // We need to encode the full_path in case it is a sub-group because then the full_path is 'root-group/my-sub-group'.
    return group.full_path ? encodeURIComponent(group.full_path) : group.path;
  }

  async _bulkUpdateIfNeededFromGitlabGroups(groups: GitlabGroup[], accounts: BaseAccount[]) {
    const updates: Promise<BaseAccount>[] = [];

    groups.forEach(group => {
      const account = accounts.find(acc => acc.providerInternalId === String(group.id));

      if (!account) {
        throw new Error(`Found no matching account for Gitlab group with id '${group.id}'.`);
      }

      if (this._hasGitlabGroupDataChanged(group, account)) {
        updates.push(this._updateGitlabGroupAccount(group, account));
      }
    });

    await Promise.all(updates);
    return updates.length > 0;
  }

  _updateGitlabGroupAccount(group: GitlabGroup, account: BaseAccount): Promise<BaseAccount> {
    // Do a last sanity checks so we don't accedentially update the wrong Gitlab group account.
    assertIsGitlabGroup(group);
    assertAccountMatchesGitlabGroup(account, group);

    if (this.provider !== GitProvider.GITLAB) {
      throw new Error('updateGitlabGroupAccount only works for provider = GITLAB');
    }

    return updateAccount(account.idAccount, {
      login: this._getLoginFromGitlabGroup(group)
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async _bulkUpdateAccountsFkParentAccount(groups: GitlabGroup[], accounts: BaseAccount[]) {
    const updates: Promise<BaseAccount>[] = [];

    const groupIdsParentIds = new Map(groups.map(group => [group.id, group.parent_id]));
    const accountIdsProviderInternalIds = new Map(
      // We use Number() here because this is for GitLab, and GitLab ids are numeric
      accounts.map(account => [Number(account.providerInternalId), account.idAccount])
    );

    accounts.forEach(account => {
      const gitlabGroupParentId = groupIdsParentIds.get(Number(account.providerInternalId));
      if (gitlabGroupParentId) {
        const fkParentAccount = accountIdsProviderInternalIds.get(gitlabGroupParentId);
        if (fkParentAccount && account.fkParentAccount !== fkParentAccount) {
          updates.push(updateAccount(account.idAccount, { fkParentAccount }));
        }
      }
    });

    await Promise.all(updates);
    return updates.length > 0;
  }

  // eslint-disable-next-line class-methods-use-this
  async _doesAccountExist(providerInternalId: number, type: AccountType, provider: GitProvider) {
    if (typeof providerInternalId !== 'number') {
      throw new Error(
        `Expected providerInternalId to be of type number, got ${typeof providerInternalId}.`
      );
    }

    const account = await findBaseAccountByProviderInternalId(
      String(providerInternalId),
      provider,
      type
    );

    return !!account;
  }

  _hasGitlabGroupDataChanged(group: GitlabGroup, account: BaseAccount) {
    return account.login !== this._getLoginFromGitlabGroup(group);
  }

  async _createGitlabUserAccount(gitlabUser: GitlabUser) {
    // Do a last sanity checks so we don't accedentially create an invalid Gitlab user account by misstake.
    assertIsGitlabUser(gitlabUser);

    if (this.provider !== GitProvider.GITLAB) {
      throw new Error('BulkCreateFromGitlabGroups only works for provider = GITLAB');
    }

    // Check so we don't accedentially create duplicate accounts.
    if (await this._doesAccountExist(gitlabUser.id, AccountType.USER, GitProvider.GITLAB)) {
      throw new Error(
        `Failed to create Gitlab user account (${gitlabUser.id}), account already exist with providerInternalId ${gitlabUser.id}.`
      );
    }

    const hmacForCliToken = () => crypto.createHmac('sha256', env.GUARDRAILS_CLI_TOKEN_SECRET);

    const account = await createAccount({
      login: gitlabUser.username,
      type: AccountType.USER,
      provider: GitProvider.GITLAB,
      providerInternalId: String(gitlabUser.id),
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      cliToken: hmacForCliToken()
        .update(String(gitlabUser.id))
        .digest('hex')
    });

    await this.bulkCreateAccountsSubscriptions([account]);

    await createPolicyForAccounts([account.idAccount]);

    return account;
  }

  async syncGitlabUser(gitlabUser: GitlabUser) {
    assertIsGitlabUser(gitlabUser);

    let userAccount = await this._findGitlabUserAccount(gitlabUser.id);

    if (userAccount) {
      // Make sure that the account we got from the database is the same as the Gitlab user that were looking for, just to be safe.
      assertAccountMatchesGitlabUser(userAccount, gitlabUser);
      await this._updateGitlabUserAccountIfNeeded(gitlabUser, userAccount);
    } else {
      await this._createGitlabUserAccount(gitlabUser);
      userAccount = await this._findGitlabUserAccount(gitlabUser.id);
    }

    if (!userAccount) {
      throw new Error(
        `Expected to find one account (of type user) after creation/update, but got none. Gitlab user ${gitlabUser.id}.`
      );
    }

    assertAccountMatchesGitlabUser(userAccount, gitlabUser);
  }

  // eslint-disable-next-line class-methods-use-this
  async _findGitlabUserAccount(providerInternalId: number) {
    if (!providerInternalId) {
      throw new Error('providerInternalId is not defined');
    }

    return findBaseAccountByProviderInternalId(
      String(providerInternalId),
      GitProvider.GITLAB,
      AccountType.USER
    );
  }

  async _updateGitlabUserAccountIfNeeded(gitlabUser: GitlabUser, account: BaseAccount) {
    if (this._hasGitlabUserDataChanged(gitlabUser, account)) {
      await this._updateGitlabUserAccount(gitlabUser, account);
      return true;
    }

    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  _hasGitlabUserDataChanged(gitlabUser: GitlabUser, account: BaseAccount) {
    return account.login !== gitlabUser.username;
  }

  _updateGitlabUserAccount(gitlabUser: GitlabUser, account: BaseAccount) {
    // Do a last sanity check so we don't accedentially update the wrong Gitlab user account.
    assertIsGitlabUser(gitlabUser);
    assertAccountMatchesGitlabUser(account, gitlabUser);

    if (this.provider !== GitProvider.GITLAB) {
      throw new Error('updateGitlabUserAccount only works for provider = GITLAB');
    }

    return updateAccount(account.idAccount, {
      login: gitlabUser.username
    });
  }

  async bulkCreateAccountsSubscriptions(accounts: BaseAccount[]) {
    const userInDb = await findUserByProviderInternalId(
      this.user.providerInternalId,
      this.user.provider
    );
    const freePlan = await findPlanByCode(PlanCode.FREE);
    const interval = SubscriptionInterval.YEARLY;
    await createSubscriptions(
      accounts.map(a => ({
        fkAccount: a.idAccount,
        fkPlan: freePlan.idPlan,
        interval,
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON()
      }))
    );

    await createSubscriptionChangelogs(
      accounts.map(a => ({
        fkAccount: a.idAccount,
        fkPlan: freePlan.idPlan,
        fkUser: userInDb ? userInDb.idUser : undefined,
        subscriptionStatus: 'active',
        subscriptionEvent: 'created',
        subscriptionInterval: interval,
        createdAt: new Date().toJSON()
      }))
    );
  }

  getProviderAccountAttrs(gitAccount: GitAccount) {
    switch (this.provider) {
      case GitProvider.GITHUB:
        return {
          avatar_url: (gitAccount as GithubInstallation).account.avatar_url,
          url: (gitAccount as GithubInstallation).html_url
        };
      case GitProvider.GITLAB:
        return {
          avatar_url: gitlabAvatarUrl(gitAccount as GitlabGroup | GitlabUser),
          url: (gitAccount as GitlabGroup).web_url
        };
      case GitProvider.BITBUCKET:
        return {
          avatar_url: (gitAccount as Schema.Workspace).links?.avatar?.href || '',
          url: (gitAccount as Schema.Workspace).links?.html?.href || ''
        };
      case GitProvider.BITBUCKET_DATA_CENTER:
        return {
          avatar_url: '',
          url: ''
          // avatar_url: gitMetadata.links.avatar.href,
          // url: gitMetadata.links.html.href
        };
      default:
        throw boom.badRequest(
          'provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]'
        );
    }
  }
}
