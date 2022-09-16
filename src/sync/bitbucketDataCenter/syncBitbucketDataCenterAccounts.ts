import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import AccountHelper from '../../helpers/account';
import {
  AccountType,
  BaseAccount,
  BBDCPersonalProject,
  BBDCProject,
  GitProvider,
  RequestUser
} from '../../interfaces';
import { env } from '../../../config';
import {
  assertAccountsHasMatchingOrgProject,
  assertIsBitbucketOrgProjects,
  assertIsBitbucketOrgProject,
  assertAccountMatchesOrgProject,
  assertIsBitbucketPersonalProject,
  assertAccountMatchesPersonalProject
} from '../../helpers/assertBitbucketDataCenter';
import {
  createAccount,
  updateAccount,
  findBaseAccountByProviderInternalId,
  findBaseAccountsByProviderInternalIds
} from '../../helpers/core-api/accounts';
import { createPolicyForAccounts } from '../../helpers/core-api/permissions';

export default class SyncBitbucketDataCenter {
  user: RequestUser;

  accountHelper: AccountHelper;

  constructor(user: RequestUser) {
    if (!user) {
      throw new Error('User is not defined');
    }

    this.user = user;
    this.accountHelper = new AccountHelper(GitProvider.BITBUCKET_DATA_CENTER, user);
  }

  async sync(projects: BBDCProject[], personalProject: BBDCPersonalProject) {
    await this._syncOrganizationProjects(projects);
    await this._syncPersonalProject(personalProject);
  }

  async _syncPersonalProject(personalProject: BBDCPersonalProject) {
    assertIsBitbucketPersonalProject(personalProject);

    let userAccount = await this._findPersonalProjectAccount(personalProject);

    if (userAccount) {
      // Make sure that the account we got from the database is the same as the Bitbucket data center user project that were looking for, just to be safe.
      assertAccountMatchesPersonalProject(userAccount, personalProject);
      await this._updatePersonalProjectAccountIfNeeded(userAccount, personalProject);
    } else {
      await this._createPersonalProjectAccount(personalProject);
      userAccount = await this._findPersonalProjectAccount(personalProject);
    }

    if (!userAccount) {
      throw new Error(
        `Expected to find one account (of type user) after creation/update, but got none. User project ${personalProject.id}.`
      );
    }

    assertAccountMatchesPersonalProject(userAccount, personalProject);
  }

  async _updatePersonalProjectAccountIfNeeded(
    account: BaseAccount,
    personalProject: BBDCPersonalProject
  ) {
    if (this._hasPersonalProjectDataChanged(account, personalProject)) {
      await this._updatePersonalProjectAccount(account, personalProject);
      return true;
    }

    return false;
  }

  // eslint-disable-next-line class-methods-use-this
  _hasPersonalProjectDataChanged(account: BaseAccount, personalProject: BBDCPersonalProject) {
    return (
      account.login !== personalProject.name ||
      account.providerMetadata.projectKey !== personalProject.key
    );
  }

  // eslint-disable-next-line class-methods-use-this
  _updatePersonalProjectAccount(account: BaseAccount, personalProject: BBDCPersonalProject) {
    // Do a last sanity check so we don't accedentially update the wrong Bitbucket data center account.
    assertIsBitbucketPersonalProject(personalProject);
    assertAccountMatchesPersonalProject(account, personalProject);

    return updateAccount(account.idAccount, {
      login: personalProject.name,
      providerMetadata: {
        projectKey: personalProject.key,
        ownerId: personalProject.owner.id
      }
    });
  }

  async _createPersonalProjectAccount(personalProject: BBDCPersonalProject) {
    // Do a last sanity checks so we don't accedentially create an invalid Bitbucket data center "user project" account by misstake.
    assertIsBitbucketPersonalProject(personalProject);

    // Check so we don't accedentially create duplicate accounts.
    if (
      await this._doesAccountExist(
        personalProject.id,
        AccountType.USER,
        GitProvider.BITBUCKET_DATA_CENTER
      )
    ) {
      throw new Error(
        `Failed to create Bitbucket data center user account (${personalProject.id}), account already exist with providerInternalId ${personalProject.id}.`
      );
    }

    const hmacForCliToken = () => crypto.createHmac('sha256', env.GUARDRAILS_CLI_TOKEN_SECRET);

    const account = await createAccount({
      login: personalProject.name,
      providerMetadata: {
        projectKey: personalProject.key,
        ownerId: personalProject.owner.id
      },
      type: AccountType.USER,
      provider: GitProvider.BITBUCKET_DATA_CENTER,
      providerInternalId: String(personalProject.id),
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      cliToken: hmacForCliToken()
        .update(uuid())
        .digest('hex')
    });

    await this.accountHelper.bulkCreateAccountsSubscriptions([account]);

    await createPolicyForAccounts([account.idAccount]);
  }

  // eslint-disable-next-line class-methods-use-this
  async _findPersonalProjectAccount(personalProject: BBDCPersonalProject) {
    const providerInternalId = String(personalProject.id);

    return findBaseAccountByProviderInternalId(
      providerInternalId,
      GitProvider.BITBUCKET_DATA_CENTER,
      AccountType.USER
    );
  }

  async _syncOrganizationProjects(projects: BBDCProject[]) {
    assertIsBitbucketOrgProjects(projects);

    const accounts = await this._getAccountsFromProjects(projects);

    await this._bulkCreateIfNeededFromProjects(projects, accounts);
    await this._bulkUpdateIfNeededFromProjects(projects, accounts);
  }

  async _bulkUpdateIfNeededFromProjects(projects: BBDCProject[], accounts: BaseAccount[]) {
    const updates: Promise<BaseAccount>[] = [];

    projects.forEach(project => {
      const account = accounts.find(acc => acc.providerInternalId === String(project.id));

      if (account && this._hasProjectDataChanged(project, account)) {
        updates.push(this._updateProjectAccount(project, account));
      }
    });

    await Promise.all(updates);
  }

  // eslint-disable-next-line class-methods-use-this
  _hasProjectDataChanged(project: BBDCProject, account: BaseAccount) {
    return account.login !== project.name || account.providerMetadata.projectKey !== project.key;
  }

  // eslint-disable-next-line class-methods-use-this
  _updateProjectAccount(project: BBDCProject, account: BaseAccount): Promise<BaseAccount> {
    // Do a sanity checks so we don't accedentially update the wrong Bitbucket data center account.
    assertIsBitbucketOrgProject(project);
    assertAccountMatchesOrgProject(account, project);

    return updateAccount(account.idAccount, {
      login: project.name,
      providerMetadata: {
        projectKey: project.key
      }
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async _getAccountsFromProjects(projects: BBDCProject[]) {
    const providerInternalIds = projects.map(project => String(project.id));

    const accounts = await findBaseAccountsByProviderInternalIds(
      providerInternalIds,
      GitProvider.BITBUCKET_DATA_CENTER,
      AccountType.ORGANIZATION
    );

    // Check that the list of accounts actually matches the projects that we were looking for.
    // So we didn't accidentally retrieved the wrong accounts from the database.
    assertAccountsHasMatchingOrgProject(accounts, projects);
    return accounts;
  }

  async _bulkCreateIfNeededFromProjects(projects: BBDCProject[], accounts: BaseAccount[]) {
    // eslint-disable-next-line no-restricted-syntax
    for (const project of projects) {
      const account = accounts.find(acc => acc.providerInternalId === String(project.id));

      if (!account) {
        // eslint-disable-next-line no-await-in-loop
        await this._createProjectAccount(project);
      }
    }
  }

  async _createProjectAccount(project: BBDCProject) {
    // Do a last sanity check so we don't accedentially create an invalid project account by misstake.
    assertIsBitbucketOrgProject(project);

    // This is just an extra fail-safe so we don't accidentally create duplicate accounts,
    if (
      await this._doesAccountExist(
        project.id,
        AccountType.ORGANIZATION,
        GitProvider.BITBUCKET_DATA_CENTER
      )
    ) {
      throw new Error(
        `Failed to create Bitbucket account, account already exist with providerInternalId ${project.id}.`
      );
    }

    const hmacForCliToken = () => crypto.createHmac('sha256', env.GUARDRAILS_CLI_TOKEN_SECRET);

    const account = await createAccount({
      login: project.name,
      providerMetadata: {
        projectKey: project.key
      },
      type: AccountType.ORGANIZATION,
      provider: GitProvider.BITBUCKET_DATA_CENTER,
      providerInternalId: String(project.id),
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      cliToken: hmacForCliToken()
        .update(uuid())
        .digest('hex')
    });

    await this.accountHelper.bulkCreateAccountsSubscriptions([account]);

    await createPolicyForAccounts([account.idAccount]);
  }

  // eslint-disable-next-line class-methods-use-this
  async _doesAccountExist(projectId: number, type: AccountType, provider: GitProvider) {
    const account = await findBaseAccountByProviderInternalId(String(projectId), provider, type);
    return !!account;
  }
}
