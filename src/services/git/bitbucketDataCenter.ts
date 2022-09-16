import crypto from 'crypto';
import { env, constants } from '../../../config';
import GitService, { GetRepositoriesParams } from './git';
import { linkToScan } from '../../helpers/common';
import {
  Repository,
  BBDCUser,
  BBDCWebhook,
  BBDCBranch,
  BBDCProject,
  BBDCPersonalProject,
  AccountType,
  UserRoleName,
  SystemUserRoleName,
  BaseAccount,
  RepositoryWithAccount
} from '../../interfaces';
import BitbucketDataCenterClientWrapper from './clientWrappers/bitbucketDataCenter';
import BitbucketDataCenterClient from '../../clients/bitbucketDataCenterClient';
import {
  bitbucketDataCenterDefaultErrorHandler,
  bitbucketDataCenterGetDefaultBranchRoleErrorHandler,
  bitbucketDataCenterGetUserRoleErrorHandler
} from '../../errors/handlers/bitbucketDataCenter';

interface GetBranchesResult {
  branches: BBDCBranch[];
  totalCount: number;
}

export default class BitbucketDataCenterService extends GitService {
  WEBHOOK_NAME: string;

  clientWrapper: BitbucketDataCenterClientWrapper;

  constructor(accessToken: string, nickname: string, accessTokenSecret: string) {
    super(accessToken, nickname);
    this.WEBHOOK_NAME = 'Guardrails';

    this.clientWrapper = new BitbucketDataCenterClientWrapper(accessToken, accessTokenSecret);
  }

  async getUser() {
    // The username and user id of the authenticated user can be found in the response headers on any api request made to the Bitbucket data center server.
    // We choose to make a call to "application-properties" because this endpoint never fails and it doesn't put a load on the server.
    // https://community.developer.atlassian.com/t/obtain-authorised-users-username-from-api/24422/2
    const { headers } = await this.clientWrapper.asUser().get('/application-properties', undefined);

    if (!headers['x-ausername']) {
      throw new Error(
        'Expected to find header "x-ausername" on response from Bitbucket data center.'
      );
    }

    if (!headers['x-auserid']) {
      throw new Error(
        'Expected to find header "x-auserid" on response from Bitbucket data center.'
      );
    }

    const username = decodeURIComponent(headers['x-ausername']);
    const userId = headers['x-auserid'];

    let users;
    try {
      users = await this.clientWrapper.asUser().getCollection('/users', {
        filter: username
      });
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getUser');
    }

    const filteredUsers = users.filter((user: BBDCUser) => user.id === Number(userId));

    if (filteredUsers.length === 0) {
      throw new Error(
        `Couldn't find authenticated user with username '${username}' and id '${userId}'.`
      );
    }

    if (filteredUsers.length === 1) {
      return filteredUsers[0];
    }

    throw new Error(`Found more than one user with the id ${userId}.`);
  }

  async getRepositories(params: GetRepositoriesParams) {
    if (!params.projectKey) {
      throw new Error("Can't fetch BBDC repositories without providerMetadata.projectKey.");
    }
    try {
      return await this.clientWrapper
        .asUser()
        .getCollection(`/projects/${params.projectKey}/repos`, undefined);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getRepositories');
    }
  }

  async enableDisableOnBitbucketDataCenter(repo: RepositoryWithAccount, isEnabled: boolean) {
    try {
      if (isEnabled) {
        await this._deleteExistingWebhooks(repo);
        await this._createWebhook(repo);
      } else {
        await this._deleteExistingWebhooks(repo);
      }
    } catch (e) {
      bitbucketDataCenterDefaultErrorHandler(e, 'enableDisableOnBitbucketDataCenter');
    }
  }

  async _createWebhook(repo: RepositoryWithAccount) {
    const version = await this._getServerVersion();
    const events = ['repo:refs_changed', 'pr:opened'];

    if (version.major >= 7) {
      // Receiving events when a new commit has made to a PR was introduced in version 7.0.0 and greater of Bitbucket server.
      // https://confluence.atlassian.com/bitbucketserver/bitbucket-server-7-0-release-notes-990546638.html
      events.push('pr:from_ref_updated');
    }

    const secret = this._createWebhookSecret(repo);

    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    await this.clientWrapper
      .asInstallation()
      .post(
        `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks`,
        null,
        {
          name: this.WEBHOOK_NAME,
          events,
          configuration: { secret },
          url: env.BITBUCKET_DATA_CENTER_WEBHOOKS_ENDPOINT,
          active: true
        }
      );
  }

  async _deleteExistingWebhooks(repo: RepositoryWithAccount) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    const webhooks = await this.findWebhooksByName(repo, this.WEBHOOK_NAME);

    // eslint-disable-next-line no-restricted-syntax
    for (const webhook of webhooks) {
      // eslint-disable-next-line no-await-in-loop
      await this.clientWrapper
        .asInstallation()
        .delete(
          `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks/${webhook.id}`,
          undefined
        );
    }
  }

  // eslint-disable-next-line class-methods-use-this
  _createWebhookSecret(repo: Repository) {
    if (!repo.providerInternalId) {
      throw new Error(
        "Failed to create webhook secret. Repository doesn't have a providerInternalId defined."
      );
    }

    const hmac = () => crypto.createHmac('sha256', env.BITBUCKET_DATA_CENTER_WEBHOOKS_SECRET);
    return hmac()
      .update(repo.providerInternalId)
      .digest('hex');
  }

  async findWebhooksByName(repo: RepositoryWithAccount, name: string) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    try {
      const webhooks = await this.clientWrapper
        .asInstallation()
        .getCollection(
          `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks`,
          undefined
        );

      return webhooks.filter((webhook: BBDCWebhook) => webhook.name === name);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'findWebhooksByName');
    }
  }

  async getRepository(repo: RepositoryWithAccount) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    try {
      const { data } = await this.clientWrapper
        .asUser()
        .get(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}`, undefined);
      return data;
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getRepository');
    }
  }

  async getBranches(
    repo: RepositoryWithAccount
    // options?: GetBranchesOptions
  ): Promise<GetBranchesResult> {
    const fetchBranches = async (client: BitbucketDataCenterClient): Promise<GetBranchesResult> => {
      // let branches;
      // let totalCount;
      // paginated results
      // if (options && options.offset !== undefined && options.limit !== undefined) {
      //   const {
      //     data
      //   } = await this.clientWrapper.asUser().get(
      //     `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`,
      //     { start: options.offset, limit: options.limit }
      //   );
      //   branches = data.values;
      //   totalCount = data.size;
      //   // get all
      // } else {
      const branches = await client.getCollection(
        `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`,
        undefined
      );
      // totalCount = branches.length;
      // }
      return {
        branches: branches.map((branch: BBDCBranch) => ({ ...branch, name: branch.displayId })),
        totalCount: 1 // this will basically disable pagination
      };
    };

    try {
      return await this.clientWrapper.installationFallback(fetchBranches);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getBranches');
    }
  }

  async getDefaultBranch(repo: RepositoryWithAccount) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    try {
      const version = await this._getServerVersion();
      let branchPath = 'default-branch';
      if (version.major < 7 || (version.major === 7 && version.minor < 5)) {
        branchPath = 'branches/default';
      }

      const {
        data: { displayId }
      } = await this.clientWrapper
        .asUser()
        .get(
          `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/${branchPath}`,
          undefined
        );
      return displayId;
    } catch (e) {
      return bitbucketDataCenterGetDefaultBranchRoleErrorHandler(e);
    }
  }

  async getUserRole(account: BaseAccount, userProviderInternalId: string) {
    const { type, providerInternalId, providerMetadata } = account;

    if (type === AccountType.USER && providerInternalId === userProviderInternalId) {
      return SystemUserRoleName.OWNER;
    }

    let usersWithPermission;
    try {
      usersWithPermission = await this.clientWrapper
        .asUser()
        .getCollection(`/projects/${providerMetadata.projectKey}/permissions/users`, {
          filter: this.nickname
        });
    } catch (e) {
      return bitbucketDataCenterGetUserRoleErrorHandler(e);
    }

    const filteredUsersWithPermission = usersWithPermission.filter(
      (userWithPermission: { user: BBDCUser }) =>
        String(userWithPermission.user.id) === userProviderInternalId
    );

    if (
      filteredUsersWithPermission.length === 1 &&
      filteredUsersWithPermission[0].permission === 'PROJECT_ADMIN'
    ) {
      return UserRoleName.ADMIN;
    }

    // throw new Error(`Found more than one user with the id ${userProviderInternalId}`);
    return false; // no access?
  }

  async getBranch(repo: RepositoryWithAccount, branchName: string): Promise<BBDCBranch> {
    const fetchBranch = async (client: BitbucketDataCenterClient): Promise<BBDCBranch> => {
      const branches = await client.getCollection(
        `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`,
        { filterText: branchName }
      );

      const matchingBranch = branches.find((branch: BBDCBranch) => branch.displayId === branchName);

      if (!matchingBranch) {
        throw new Error(`No branch was found with the name ${branchName}.`);
      }

      return { ...matchingBranch, name: matchingBranch.displayId };
    };

    try {
      return await this.clientWrapper.installationFallback(fetchBranch);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getBranch');
    }
  }

  async getBranchSha(repo: RepositoryWithAccount, branchName: string): Promise<string> {
    const branch = await this.getBranch(repo, branchName);
    return branch.latestCommit;
  }

  async getProjects(): Promise<BBDCProject[]> {
    try {
      return await this.clientWrapper.asUser().getCollection('/projects', undefined);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getProjects');
    }
  }

  async getPersonalProject(): Promise<BBDCPersonalProject> {
    const user = await this.getUser();

    if (!user || !user.slug) {
      throw new Error(`Failed to get user slug on user ${JSON.stringify(user)}.`);
    }

    try {
      const { data } = await this.clientWrapper.asUser().get(`/projects/~${user.slug}`, undefined);
      return data;
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getPersonalProject');
    }
  }

  async getContent(
    repo: RepositoryWithAccount,
    ref: string,
    path: string
  ): Promise<string | undefined> {
    const fetchContent = async (client: BitbucketDataCenterClient): Promise<string | undefined> => {
      if (!repo.account.providerMetadata.projectKey || !repo.name) {
        return undefined;
      }

      const { data } = await client.get(
        `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/raw/${path}`,
        {
          at: ref
        }
      );

      return (data as string) || undefined;
    };

    try {
      return await this.clientWrapper.installationFallback(fetchContent);
    } catch (e) {
      return bitbucketDataCenterDefaultErrorHandler(e, 'getContent');
    }
  }

  // eslint-disable-next-line
  async deleteApp(account: BaseAccount) {
    throw new Error('Deleting app for Bitbucket data center is not supported.');
  }

  static async refreshAccessToken() {
    throw new Error('refreshAccessToken is not supported');
  }

  async setQueuedStatus(account: BaseAccount, repository: Repository, sha: string) {
    if (env.DISABLE_COMMIT_STATUS) {
      return;
    }
    try {
      const version = await this._getServerVersion();

      // Creating build status is only available on version 7.4 and greater of Bitbucket server.
      if (version.major < 7 || (version.major === 7 && version.minor < 4)) {
        // eslint-disable-next-line no-console
        console.log(
          `Creating queued status (i.e. build status) is not supported on this version of Bitbucket server (${version.major}.${version.minor}.${version.patch}), skipping...`
        );
        return;
      }

      await this.clientWrapper.asUser().post(
        `/projects/${account.providerMetadata.projectKey}/repos/${repository.name}/commits/${sha}/builds`,
        {
          state: 'INPROGRESS',
          key: `${constants.botDisplayName}/scan`,
          url: linkToScan(account, repository.idRepository, sha),
          description: 'task queued for processing'
        },
        undefined
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        `BitbucketDataCenterService.setQueuedStatus: Failed to set commit status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`,
        { error: e }
      );
    }
  }

  async _getServerVersion() {
    const { data } = await this.clientWrapper.asUser().get('/application-properties', undefined);

    const { version } = data;

    if (!version) {
      throw new Error(`Failed to get server version, got ${JSON.stringify(data, null, 2)}.`);
    }

    const parts = version.split('.');

    const major = Number(parts[0]);
    let minor = 0;
    let patch = 0;

    if (parts.length > 1) {
      minor = Number(parts[1]);
    }

    if (parts.length > 2) {
      patch = Number(parts[2]);
    }

    return {
      major,
      minor,
      patch
    };
  }
}
