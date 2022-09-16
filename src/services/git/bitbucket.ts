import axios from 'axios';
import lodashGet from 'lodash/get';
import { URLSearchParams } from 'url';
import { Schema, APIClient } from 'bitbucket';
import { env, constants } from '../../../config';
import GitService, { GetBranchesOptions, GetRepositoriesParams } from './git';
import { linkToScan } from '../../helpers/common';
import { assertIsValidPaginationResponse } from '../../helpers/assertBitbucket';
import {
  AccountType,
  UserRoleName,
  SystemUserRoleName,
  Repository,
  BaseAccount,
  RepositoryWithAccount
} from '../../interfaces';
import BitbucketClientWrapper from './clientWrappers/bitbucket';
import {
  bitbucketDefaultErrorHandler,
  bitbucketGetUserRoleErrorHandler
} from '../../errors/handlers/bitbucket';

interface GetBranchesResult {
  branches: Schema.Branch[];
  totalCount: number;
}

export default class BitbucketService extends GitService {
  clientWrapper: BitbucketClientWrapper;

  constructor(accessToken: string, nickname: string) {
    super(accessToken, nickname);

    this.clientWrapper = new BitbucketClientWrapper(this.accessToken);
  }

  async getUser() {
    try {
      const { data } = await this.clientWrapper.asUser().user.get({});
      return data;
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getUser');
    }
  }

  async getRepositories(params: GetRepositoriesParams) {
    if (!params.providerInternalId) {
      throw new Error("Can't fetch Bitbucket repositories without providerInternalId.");
    }
    try {
      return await this._getAll(
        this.clientWrapper.asUser().repositories.list({ workspace: params.providerInternalId })
      );
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getRepositories');
    }
  }

  async getRepository(repo: RepositoryWithAccount) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    try {
      const { data } = await this.clientWrapper.asUser().repositories.get({
        repo_slug: repo.providerInternalId,
        workspace: repo.account.providerInternalId
      });
      return data;
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getRepository');
    }
  }

  async getBranches(
    repo: RepositoryWithAccount,
    options?: GetBranchesOptions
  ): Promise<GetBranchesResult> {
    const fetchBranches = async (client: APIClient): Promise<GetBranchesResult> => {
      let branches;
      let totalCount;
      // paginated results
      if (options && options.offset !== undefined && options.limit !== undefined) {
        const page = Math.floor(options.offset / options.limit) + 1;
        const {
          data: { values, size }
        } = await client.refs.listBranches({
          repo_slug: repo.providerInternalId,
          workspace: repo.account.providerInternalId,
          page: String(page),
          pagelen: options.limit
        });
        branches = values;
        totalCount = size;
        // get all
      } else {
        branches = await this._getAll(
          client.refs.listBranches({
            repo_slug: repo.providerInternalId,
            workspace: repo.account.providerInternalId
          })
        );
        totalCount = branches.length;
      }
      return { branches, totalCount };
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.providerInternalId,
        fetchBranches
      );
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getBranches');
    }
  }

  async getUserRole(account: BaseAccount, userProviderInternalId: string) {
    const { type, providerInternalId } = account;

    if (type === AccountType.USER && providerInternalId === userProviderInternalId) {
      return SystemUserRoleName.OWNER;
    }

    // TODO: Review if we need this "if", what happens if the account is type "User" but the logged in user is not the same? Can that happen
    if (type === AccountType.ORGANIZATION) {
      let permissions;
      try {
        const { data } = await axios.get(`${env.BITBUCKET_API_URL}/user/permissions/workspaces`, {
          headers: { Authorization: `Bearer ${this.accessToken}` },
          params: {
            q: `workspace.uuid="${providerInternalId}"`
          }
        });
        permissions = data;
      } catch (e) {
        return bitbucketGetUserRoleErrorHandler(e);
      }

      if (!permissions || !permissions.values || permissions.values.length === 0) {
        throw new Error(`Got no bitbucket permission for workspace ${providerInternalId}.`);
      }

      if (permissions.values.length > 1) {
        throw new Error(
          `Expected to get one result from bitbucket when filtering on one workspace but got ${permissions.values.length} results for workspace ${providerInternalId}.`
        );
      }

      const permission = permissions.values[0];

      if (permission.workspace.uuid !== providerInternalId) {
        throw new Error(
          `Got permission for another bitbucket account than the one we filtered on ${providerInternalId}.`
        );
      }

      if (!permission.permission) {
        throw new Error(
          `Found no permission attr on permission object for bitbucket workspace ${providerInternalId}.`
        );
      }

      // Permission can be either owner, collaborator or member
      // https://developer.atlassian.com/bitbucket/api/2/reference/resource/workspaces/%7Bworkspace%7D/permissions
      switch (permission.permission) {
        case 'owner':
          return UserRoleName.ADMIN;
        default:
          return UserRoleName.DEVELOPER;
      }
    }

    return UserRoleName.DEVELOPER;
  }

  async getBranch(repo: RepositoryWithAccount, branchName: string) {
    const fetchBranch = async (client: APIClient): Promise<Schema.Branch> => {
      const { data } = await client.refs.getBranch({
        name: branchName,
        repo_slug: repo.providerInternalId,
        workspace: repo.account.providerInternalId
      });

      return data;
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.providerInternalId,
        fetchBranch
      );
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getBranch');
    }
  }

  async getBranchSha(repo: RepositoryWithAccount, branchName: string) {
    try {
      const branch = await this.getBranch(repo, branchName);
      return branch?.target?.hash || ''; // TODO: what happens if we don't find the hash?
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getBranchSha');
    }
  }

  async getWorkspaces(): Promise<Schema.Workspace[]> {
    try {
      return await this._getAll(this.clientWrapper.asUser().workspaces.getWorkspaces({}));
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getWorkspaces');
    }
  }

  async getContent(
    repo: RepositoryWithAccount,
    ref: string,
    path: string
  ): Promise<string | undefined> {
    const fetchContent = async (client: APIClient): Promise<string | undefined> => {
      if (!repo.account.providerInternalId || !repo.providerInternalId) {
        return undefined;
      }

      const { data } = await client.source.read({
        node: ref,
        path,
        workspace: repo.account.providerInternalId,
        repo_slug: repo.providerInternalId
      });

      return (data as string) || undefined;
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.providerInternalId,
        fetchContent
      );
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'getContent');
    }
  }

  async deleteApp(account: BaseAccount) {
    // eslint-disable-next-line no-console
    console.log("Bitbucket can't delete the App.", {
      nickname: this.nickname,
      accountId: account.idAccount
    });
  }

  static async refreshAccessToken(refreshToken: string) {
    let accessToken;
    try {
      const bodyFormData = new URLSearchParams();
      bodyFormData.append('refresh_token', refreshToken);
      bodyFormData.append('grant_type', 'refresh_token');

      const response = await axios({
        method: 'post',
        url: `${env.BITBUCKET_SITE_URL}/site/oauth2/access_token`,
        auth: {
          username: env.BITBUCKET_OAUTH_CLIENT_ID,
          password: env.BITBUCKET_OAUTH_CLIENT_SECRET
        },
        data: bodyFormData,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      accessToken = lodashGet(response, 'data.access_token');
    } catch (e) {
      return bitbucketDefaultErrorHandler(e, 'refreshAccessToken');
    }

    if (!accessToken) {
      throw new Error(
        "Didn't receive a new access token when calling Bitbucket to refresh access token."
      );
    }

    return accessToken;
  }

  async setQueuedStatus(account: BaseAccount, repository: Repository, sha: string) {
    if (env.DISABLE_COMMIT_STATUS) {
      return;
    }
    try {
      await this.clientWrapper.asUser().repositories.createCommitBuildStatus({
        _body: {
          type: '', // TODO: Test what should be this string value
          state: 'INPROGRESS',
          key: `${constants.botDisplayName}/scan`,
          url: linkToScan(account, repository.idRepository, sha),
          description: 'task queued for processing'
        },
        node: sha,
        repo_slug: repository.providerInternalId,
        workspace: account.providerInternalId
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        `Failed to set queued status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`,
        { error: e }
      );
    }
  }

  async _getAll(req: any) {
    const { data } = await req;
    const { values } = data;

    assertIsValidPaginationResponse(data);

    if (!this.clientWrapper.asUser().hasNextPage(data)) {
      return values;
    }

    // Get data for the rest of the pages.
    const nextPageValues: any = await this._getAll(this.clientWrapper.asUser().getNextPage(data));

    return values.concat(nextPageValues);
  }
}
