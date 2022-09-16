import Octokit from '@octokit/rest';
import parseLinkHeader from 'parse-link-header';
import {
  AccountType,
  UserRoleName,
  SystemUserRoleName,
  GithubBranch,
  GithubInstallation,
  GithubRepository,
  Repository,
  BaseAccount,
  RepositoryWithAccount,
  GitProviderTeam
} from '../../interfaces';
import { env, constants } from '../../../config';
import GitService, { GetBranchesOptions, GetRepositoriesParams } from './git';
import { linkToScan, base64Decode } from '../../helpers/common';
import GitHubClientWrapper, { GitHubClientWrapperOptions } from './clientWrappers/github';
import { githubDefaultErrorHandler } from '../../errors/handlers/github';

interface GetBranchesResult {
  branches: GithubBranch[];
  totalCount: number;
}

export default class GitHubService extends GitService {
  clientWrapper: GitHubClientWrapper;

  constructor(accessToken: string, nickname: string) {
    super(accessToken, nickname);

    this.clientWrapper = new GitHubClientWrapper(this.accessToken);
  }

  async getUserInstallations(): Promise<GithubInstallation[]> {
    try {
      const { client, options } = this.clientWrapper.asUser();

      const response = await client.paginate('GET /user/installations', options);

      if (env.ENVIRONMENT === 'onpremise') {
        // eslint-disable-next-line no-console
        console.log('paginate -> GET /user/installations', { response: JSON.stringify(response) });
      }

      return response;
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getUserInstallations');
    }
  }

  async getUser() {
    try {
      const { client, options } = this.clientWrapper.asUser();

      const { data } = await client.users.getAuthenticated({
        ...options
      });

      return data;
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getUser');
    }
  }

  async getRepositories(params: GetRepositoriesParams): Promise<GithubRepository[]> {
    if (!params.installationId) {
      throw new Error("Can't fetch Github repositories without installationId.");
    }

    try {
      const { client, options } = this.clientWrapper.asUser();

      const response = await client.paginate(
        `GET /user/installations/${params.installationId}/repositories`,
        {
          ...options,
          per_page: 100
        }
      );

      if (env.ENVIRONMENT === 'onpremise') {
        // eslint-disable-next-line no-console
        console.log(`paginate -> GET /user/installations/${params.installationId}/repositories`, {
          response: JSON.stringify(response)
        });
      }

      return response;
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getRepositories');
    }
  }

  async getRepository(repo: RepositoryWithAccount) {
    if (!repo.account) {
      throw new Error('Internal error: Repo has no retrieved account from the db.');
    }

    try {
      const { client, options } = this.clientWrapper.asUser();

      const { data } = await client.repos.get({
        ...options,
        owner: repo.account.login,
        repo: repo.name
      });

      return data;
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getRepository');
    }
  }

  async getBranches(
    repo: RepositoryWithAccount,
    options?: GetBranchesOptions
  ): Promise<GetBranchesResult> {
    const fetchBranches = async (
      client: Octokit,
      clientOptions: GitHubClientWrapperOptions
    ): Promise<GetBranchesResult> => {
      let branches;
      let totalCount;
      // paginated results
      if (options && options.offset !== undefined && options.limit !== undefined) {
        const page = Math.floor(options.offset / options.limit) + 1;
        const response = await client.repos.listBranches({
          ...clientOptions,
          owner: repo.account.login,
          repo: repo.name,
          per_page: options.limit,
          page
        });
        const pagination = parseLinkHeader(response.headers.link);
        branches = response.data;
        const totalPages: number = pagination?.last?.page ? Number(pagination?.last?.page) : page;
        totalCount = totalPages * options.limit;
        // get all
      } else {
        branches = await client.paginate(
          `GET /repos/${repo.account.login}/${repo.name}/branches`,
          clientOptions
        );
        totalCount = branches.length;
      }
      return { branches, totalCount };
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.installationId!,
        fetchBranches
      );
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getBranches');
    }
  }

  async getBranch(repo: RepositoryWithAccount, branchName: string): Promise<GithubBranch> {
    const fetchBranch = async (
      client: Octokit,
      clientOptions: GitHubClientWrapperOptions
    ): Promise<GithubBranch> => {
      const { data } = await client.repos.getBranch({
        ...clientOptions,
        owner: repo.account.login,
        repo: repo.name,
        branch: branchName
      });

      return data;
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.installationId!,
        fetchBranch
      );
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getBranch');
    }
  }

  async getBranchSha(repo: RepositoryWithAccount, branchName: string): Promise<string> {
    const fetchBranchSha = async (
      client: Octokit,
      clientOptions: GitHubClientWrapperOptions
    ): Promise<string> => {
      const {
        data: {
          object: { sha }
        }
      } = await client.git.getRef({
        ...clientOptions,
        owner: repo.account.login,
        repo: repo.name,
        ref: `heads/${branchName}`
      });

      return sha;
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.installationId!,
        fetchBranchSha
      );
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getBranchSha');
    }
  }

  async getUserRole(account: BaseAccount, userProviderInternalId: string) {
    const { type, providerInternalId, login } = account;

    if (type === AccountType.USER && providerInternalId === userProviderInternalId) {
      return SystemUserRoleName.OWNER;
    }

    const { client, options } = this.clientWrapper.asUser();

    try {
      const {
        data: { role }
      } = await client.orgs.getMembershipForAuthenticatedUser({
        ...options,
        org: login
      });

      // eslint-disable-next-line no-console
      console.log(
        `Retrieved role = "${role}" for user with providerInternalId = ${userProviderInternalId} and account with providerInternalId = ${providerInternalId}`
      );

      // so far we know for github it can be "admin" or "member"
      switch (role) {
        case 'admin':
          return UserRoleName.ADMIN;
        default:
          // default is always developer (which is the lowest level role in GR)
          return UserRoleName.DEVELOPER;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(
        `Github Error while trying to retrieve user role for user with providerInternalId = ${userProviderInternalId}`,
        { e }
      );
      return UserRoleName.DEVELOPER;
    }
  }

  async getContent(repo: RepositoryWithAccount, ref: string, path: string) {
    const fetchContent = async (
      client: Octokit,
      clientOptions: GitHubClientWrapperOptions
    ): Promise<string | undefined> => {
      if (!repo.account.login || !repo.account.installationId) {
        return undefined;
      }

      const { data } = await client.repos.getContents({
        ...clientOptions,
        owner: repo.account?.login,
        path,
        ref,
        repo: repo.name
      });

      const { content } = data as { content?: string };

      return content ? base64Decode(content) : undefined;
    };

    try {
      return await this.clientWrapper.installationFallback(
        repo.account.installationId!,
        fetchContent
      );
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getContent');
    }
  }

  async getAllOrgMembers(account: BaseAccount): Promise<Octokit.OrgsListMembersResponseItem[]> {
    if (!account.installationId) {
      throw new Error('Account has no installationId to fetch the organization members.');
    }
    if (account.type !== AccountType.ORGANIZATION) {
      throw new Error('Only Organization Accounts can fetch members.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);

      return await client.paginate(`GET /orgs/${account.login}/members`, {
        ...options,
        per_page: 100
      });
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getAllOrgMembers');
    }
  }

  async getAllOrgTeams(
    account: BaseAccount
  ): Promise<
    Array<
      Omit<Octokit.TeamsListResponseItem, 'parent'> & {
        parent: null | Octokit.TeamsListChildResponseItemParent;
      }
    >
  > {
    if (!account.installationId) {
      throw new Error('Account has no installationId to fetch the organization teams.');
    }
    if (account.type !== AccountType.ORGANIZATION) {
      throw new Error('Only Organization Accounts can fetch teams.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);

      return await client.paginate(`GET /orgs/${account.login}/teams`, {
        ...options,
        per_page: 100
      });
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getAllOrgTeams');
    }
  }

  async getATeamBySlug(
    account: BaseAccount,
    teamSlug: string
  ): Promise<
    Omit<Octokit.TeamsGetByNameResponse, 'parent'> & {
      parent: null | Octokit.TeamsListChildResponseItemParent;
    }
  > {
    if (!account.installationId) {
      throw new Error('Account has no installationId to fetch the organization team.');
    }
    if (account.type !== AccountType.ORGANIZATION) {
      throw new Error('Only Organization Accounts can fetch a team.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);

      const response = await client.teams.getByName({
        ...options,
        team_slug: teamSlug,
        org: account.login
      });

      return response.data;
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getATeamBySlug');
    }
  }

  async getTeamMembers({
    account,
    team,
    role
  }: {
    account: BaseAccount;
    role: 'member' | 'maintainer' | 'all' | undefined;
    team: GitProviderTeam;
  }): Promise<Array<Octokit.TeamsListMembersResponseItem & { teamId: number }>> {
    if (!account.installationId) {
      throw new Error('Account has no installationId to fetch the team members.');
    }
    if (account.type !== AccountType.ORGANIZATION) {
      throw new Error('Only Organization Accounts can fetch the team members.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);

      const response = await client.paginate(
        `GET /orgs/${account.login}/teams/${team.slug}/members`,
        {
          ...options,
          role
        }
      );
      return response.map(member => ({ ...member, teamId: team.id }));
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getTeamMembers');
    }
  }

  async getTeamRepositories(
    account: BaseAccount,
    team: GitProviderTeam
  ): Promise<Array<Octokit.TeamsListReposResponseItem & { teamId: number }>> {
    if (!account.installationId) {
      throw new Error('Account has no installationId to fetch the team repositories.');
    }
    if (account.type !== AccountType.ORGANIZATION) {
      throw new Error('Only Organization Accounts can fetch the team repositories.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
      const response = await client.paginate(
        `GET /orgs/${account.login}/teams/${team.slug}/repos`,
        options
      );
      return response.map(repo => ({ ...repo, teamId: team.id }));
    } catch (e) {
      return githubDefaultErrorHandler(e, 'getTeamRepositories');
    }
  }

  async deleteApp(account: BaseAccount) {
    if (!account.installationId) {
      throw new Error('Account has no installationId to properly uninstall the Github App.');
    }

    try {
      const { client, options } = this.clientWrapper.asApplication();

      return await client.apps.deleteInstallation({
        ...options,
        installation_id: account.installationId
      });
    } catch (e) {
      return githubDefaultErrorHandler(e, 'deleteApp');
    }
  }

  async setQueuedStatus(account: BaseAccount, repository: Repository, sha: string) {
    if (env.DISABLE_COMMIT_STATUS) {
      return;
    }

    if (!account.installationId) {
      throw new Error('Account has no installationId to properly set the Status.');
    }

    try {
      const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
      await client.repos.createStatus({
        ...options,
        owner: account.login,
        repo: repository.name,
        sha,
        state: 'pending',
        context: `${constants.botDisplayName}/scan`,
        description: 'task queued for processing',
        target_url: linkToScan(account, repository.idRepository, sha)
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        `GithubService.setQueuedStatus: Failed to set queued status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`,
        { error: e }
      );
    }
  }
}
