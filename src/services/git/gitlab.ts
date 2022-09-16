import axios from 'axios';
import bluebird from 'bluebird';
import {
  AccountType,
  UserRoleName,
  SystemUserRoleName,
  GitlabBranch,
  GitlabGroup,
  GitlabMember,
  GitlabUser,
  GitlabWebhook,
  Repository,
  BaseAccount,
  RepositoryWithAccount
} from '../../interfaces';
import { env, constants } from '../../../config';
import GitService, { GetBranchesOptions, GetRepositoriesParams } from './git';
import { base64Decode } from '../../helpers/common';
import Cache from '../cache';
import GitLabClientWrapper from './clientWrappers/gitlab';
import {
  gitlabDefaultErrorHandler,
  gitlabGetUserRoleErrorHandler
} from '../../errors/handlers/gitlab';

interface FetchGitlabGroupsParams {
  groups?: any[];
  header: any;
  nextPage?: number;
}

interface GetBranchesResult {
  branches: GitlabBranch[];
  totalCount: number;
}

const fetchGitlabGroups = async ({
  groups = [],
  header,
  nextPage = 1
}: FetchGitlabGroupsParams): Promise<GitlabGroup[]> => {
  if (!nextPage) return groups;
  const { headers, data } = await axios.get(`${env.GITLAB_URL}/api/v4/groups`, {
    headers: header,
    params: { per_page: 100, page: nextPage, min_access_level: 30 }
  });
  return fetchGitlabGroups({
    groups: [...data, ...groups],
    header,
    nextPage: Number(headers['x-next-page'])
  });
};

export default class GitLabService extends GitService {
  clientWrapper: GitLabClientWrapper;

  GITLAB_ACCESS_LEVEL = {
    NO_ACCESS: 0,
    GUEST: 10,
    REPORTER: 20,
    DEVELOPER: 30,
    MAINTAINER: 40,
    OWNER: 50
  };

  constructor(accessToken: string, nickname: string) {
    super(accessToken, nickname);

    this.clientWrapper = new GitLabClientWrapper(this.accessToken);
  }

  // TODO: this should be requested through the gitlab client
  static async getAuthenticatedUser(accessToken: string): Promise<GitlabUser> {
    try {
      const { data } = await axios.get(`${env.GITLAB_URL}/api/v4/user`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return data;
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getAuthenticatedUser');
    }
  }

  // TODO: this should be requested through the gitlab client
  static async getGroups(accessToken: string) {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      return await fetchGitlabGroups({ header: headers });
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getGroups');
    }
  }

  async getUser() {
    return this.clientWrapper.asUser().Users.current();
  }

  async getRepositories(params: GetRepositoriesParams) {
    if (!params.providerInternalId) {
      throw new Error("Can't fetch Gitlab repositories without providerInternalId.");
    }
    try {
      if (params.type === AccountType.USER) {
        return await this.clientWrapper.asUser().Users.projects(Number(params.providerInternalId));
      }
      return await this.clientWrapper
        .asUser()
        .GroupProjects.all(Number(params.providerInternalId), {
          // In Gitlab it is possible to share a single Gitlab project (i.e. Git repository ) with multiple Gitlab groups (https://docs.gitlab.com/ee/user/project/members/share_project_with_groups.html).
          // We don't want to fetch shared projects, we only want projects that are actually owned by the Gitlab group.
          // This is because otherwise we will create duplicate repositories in the database because the repository (i.e. Gitlab project) will be returned for multiple groups.
          with_shared: false
        });
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getRepositories');
    }
  }

  async getRepository(repo: RepositoryWithAccount) {
    try {
      return await this.clientWrapper.asUser().Projects.show(Number(repo.providerInternalId));
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getRepository');
    }
  }

  async getBranches(
    repo: RepositoryWithAccount,
    options?: GetBranchesOptions
  ): Promise<GetBranchesResult> {
    const fetchBranches = async (client: any): Promise<GetBranchesResult> => {
      let branches;
      let totalCount;
      // paginated results
      if (options && options.offset !== undefined && options.limit !== undefined) {
        const cache = new Cache(env.CACHE_PROVIDER).getInstance();
        const cacheKey = `branches-totalCount-${repo.idRepository}`;
        totalCount = (await cache.get(cacheKey)) || options.totalCount;
        totalCount = typeof totalCount === 'string' ? Number(totalCount) : totalCount;

        const showExpanded = totalCount === undefined || totalCount === null;
        const page = Math.floor(options.offset / options.limit) + 1;
        const response = await client.Branches.all(Number(repo.providerInternalId), {
          maxPages: 1,
          perPage: options.limit,
          page,
          showExpanded
        });

        if (showExpanded) {
          branches = response.data;
          totalCount = response.paginationInfo.total;

          if (!Number.isNaN(totalCount)) {
            cache.set(cacheKey, totalCount, 60 * 20); // 20 min cache should be enough
          }
        } else {
          branches = response;
        }
        // get all
      } else {
        branches = await client.Branches.all(Number(repo.providerInternalId));
        totalCount = branches.length;
      }
      return { branches, totalCount };
    };

    try {
      return await this.clientWrapper.installationFallback(fetchBranches);
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getBranches');
    }
  }

  async getBranch(repo: RepositoryWithAccount, branchName: string): Promise<GitlabBranch> {
    const fetchBranch = async (client: any): Promise<GitlabBranch> => {
      return client.Branches.show(Number(repo.providerInternalId), branchName);
    };

    try {
      return await this.clientWrapper.installationFallback(fetchBranch);
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getBranch');
    }
  }

  async getBranchSha(repo: RepositoryWithAccount, branch: string): Promise<string> {
    const fetchBranchSha = async (client: any): Promise<string> => {
      const {
        commit: { id: sha }
      } = await client.Branches.show(Number(repo.providerInternalId), branch);

      return sha;
    };

    try {
      return await this.clientWrapper.installationFallback(fetchBranchSha);
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getBranchSha');
    }
  }

  convertAccessLevelToGuardRailsRole(accessLevel: number) {
    switch (accessLevel) {
      case this.GITLAB_ACCESS_LEVEL.OWNER:
      case this.GITLAB_ACCESS_LEVEL.MAINTAINER:
        return UserRoleName.ADMIN;
      case this.GITLAB_ACCESS_LEVEL.NO_ACCESS:
        return false;
      default:
        return UserRoleName.DEVELOPER;
    }
  }

  async getUserRole(account: BaseAccount, userProviderInternalId: string) {
    const { type, providerInternalId } = account;

    if (type === AccountType.USER && providerInternalId === userProviderInternalId) {
      return SystemUserRoleName.OWNER;
    }

    try {
      const member = await this.clientWrapper
        .asUser()
        .GroupMembers.show(Number(providerInternalId), Number(userProviderInternalId));

      // eslint-disable-next-line no-console
      console.log(
        `Retrieved access_level = "${member.access_level}" for user with providerInternalId = ${userProviderInternalId} and account with providerInternalId = ${providerInternalId}`
      );

      return this.convertAccessLevelToGuardRailsRole(member.access_level);
    } catch (e) {
      return gitlabGetUserRoleErrorHandler(e);
    }
  }

  async getContent(
    repo: RepositoryWithAccount,
    ref: string,
    path: string
  ): Promise<string | undefined> {
    const fetchContent = async (client: any) => {
      if (!repo.account.login || !repo.providerInternalId) {
        return undefined;
      }

      const { content } = await client.RepositoryFiles.show(repo.providerInternalId, path, ref);

      return content ? base64Decode(content) : undefined;
    };

    try {
      return await this.clientWrapper.installationFallback(fetchContent);
    } catch (e) {
      return gitlabDefaultErrorHandler(e, 'getContent');
    }
  }

  async deleteApp(account: BaseAccount) {
    // eslint-disable-next-line no-console
    console.log("Gitlab can't delete the App.", {
      nickname: this.nickname,
      accountId: account.idAccount
    });
  }

  async setQueuedStatus(account: BaseAccount, repository: Repository, sha: string) {
    if (env.DISABLE_COMMIT_STATUS) {
      return;
    }
    const context = `${constants.botDisplayName}/scan`;
    try {
      await this.clientWrapper.asUser().Commits.editStatus(repository.providerInternalId, sha, {
        state: 'pending',
        description: 'task queued for processing',
        context
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        `GitlabService.setQueuedStatus: Failed to set commit status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`,
        { error: e }
      );
    }
  }

  async addHooksAndMemberToGitlabProjects({
    account,
    repositories
  }: {
    account: BaseAccount;
    repositories: Repository[];
  }) {
    try {
      const installationClient = await this.clientWrapper.asInstallation();
      const guardRailsUser: GitlabUser = await installationClient.Users.current();

      await Promise.all(
        repositories.map(async repository => {
          const currentHooks: GitlabWebhook[] = await this.clientWrapper
            .asUser()
            .ProjectHooks.all(Number(repository.providerInternalId));
          const grHook = currentHooks.find(x => x.url === env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT);
          if (!grHook) {
            await this.clientWrapper
              .asUser()
              .ProjectHooks.add(
                Number(repository.providerInternalId),
                env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT,
                {
                  token: account.cliToken,
                  push_events: true,
                  merge_requests_events: true
                }
              );
          }

          const members: GitlabMember[] = await this.clientWrapper
            .asUser()
            .ProjectMembers.all(Number(repository.providerInternalId));
          if (account.type === AccountType.ORGANIZATION) {
            members.push(
              ...(await this.clientWrapper
                .asUser()
                .GroupMembers.all(Number(account.providerInternalId)))
            );
          }
          const grMember = members.find(x =>
            guardRailsUser ? x.username === guardRailsUser.username : x.username === 'guardrailsio'
          );

          if (!grMember) {
            await this.clientWrapper
              .asUser()
              .ProjectMembers.add(Number(repository.providerInternalId), guardRailsUser.id, 30);
          }
        })
      );
    } catch (e) {
      gitlabDefaultErrorHandler(e, 'addHooksAndMemberToGitlabProjects');
    }
  }

  async removeHooksAndMemberFromGitlabProjects({ repositories }: { repositories: Repository[] }) {
    try {
      // We need to create another instance to try to get the "Own user" id (used for on-premise)
      const installationClient = await this.clientWrapper.asInstallation();
      const guardRailsUser: GitlabUser = await installationClient.Users.current();

      await bluebird.map(
        repositories,
        async (repository: Repository) => {
          const currentHooks = await this.clientWrapper
            .asUser()
            .ProjectHooks.all(Number(repository.providerInternalId));
          const grHook = currentHooks.find(
            (x: GitlabWebhook) => x.url === env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT
          );
          if (grHook) {
            await this.clientWrapper
              .asUser()
              .ProjectHooks.remove(Number(repository.providerInternalId), grHook.id);
          }

          const currentMembers = await this.clientWrapper
            .asUser()
            .ProjectMembers.all(Number(repository.providerInternalId));
          const grMember = currentMembers.find((x: GitlabMember) => x.id === guardRailsUser.id);

          if (grMember) {
            await this.clientWrapper
              .asUser()
              .ProjectMembers.remove(Number(repository.providerInternalId), grMember.id);
          }
        },
        { concurrency: 5 }
      );
    } catch (e) {
      gitlabDefaultErrorHandler(e, 'removeHooksAndMemberFromGitlabProjects');
    }
  }
}
