import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';
import { Schema } from 'bitbucket';
import {
  GitProvider,
  GitAccount,
  GitRepository,
  Repository,
  RequestUser,
  GithubRepository,
  GithubInstallation,
  GitlabGroup,
  GitlabUser,
  BBDCRepository,
  BBDCProject,
  BBDCPersonalProject,
  AllowedAccounts,
  UserRole,
  GitlabRepository,
  UserRoleName,
  BaseAccount,
  Account,
  AccountType,
  AccountWithRepos
} from '../interfaces';
import { gitServiceFactory } from '../helpers/gitServiceFactory';
import { parseUser } from '../helpers/user';
import { getGitlabAcccountsAndRepos, syncGitlabAccounts } from '../helpers/gitlab';
import { getGithubAcccountsAndRepos, syncGithubAccounts } from '../helpers/github';
import { getBitbucketAcccountsAndRepos } from '../helpers/bitbucket';
import { createRepositories, updateRepositories } from '../helpers/core-api/repositories';
import {
  populateGitReposToDBRepos,
  shouldUpdateRepository,
  getProviderSpecificFieldsForUpdate
} from '../helpers/repository';
import {
  getBitbucketDataCenterAcccountsAndRepos,
  syncDefaultBranches,
  syncBitbucketDataCenterAccounts
} from '../helpers/bitbucketDataCenter';
import AccountHelper from '../helpers/account';
import BitbucketDataCenterService from './git/bitbucketDataCenter';
import GitHubService from './git/github';
import GitLabService from './git/gitlab';
import BitbucketService from './git/bitbucket';
import {
  createUserRole,
  createUsers,
  findUsersWithRoleByProviderInternalIds,
  findUserWithRoleByProviderInternalId,
  updateUsersRole
} from '../helpers/core-api/users';
import { findAllRoles } from '../helpers/core-api/roles';
import { updateAccount } from '../helpers/core-api/accounts';
import { isLegacyPlan } from '../helpers/subscription';
import RepositoriesService from './repositories';

type GitlabAccountsResult = { groups: GitlabGroup[]; gitlabUser: GitlabUser };
type BBDCGitAccountsResult = { projects: BBDCProject[]; personalProject: BBDCPersonalProject };

const isSame = (repo: Repository, gitRepo: GitRepository) => {
  return (
    !repo.fkParentRepository && // skip monorepo's sub-repos
    repo.providerInternalId ===
      String((gitRepo as GithubRepository).id || (gitRepo as Schema.Repository).uuid)
  );
};

class SyncService {
  user: RequestUser;

  accessToken: string;

  provider: GitProvider;

  login: string;

  gitService: GitHubService | GitLabService | BitbucketService | BitbucketDataCenterService;

  accountHelper: AccountHelper;

  repositoriesService: RepositoriesService;

  filterReposByWriteAccess: boolean;

  roles: UserRole[] | undefined;

  constructor(user: RequestUser, filterReposByWriteAccess = false) {
    this.user = user;

    const { provider, login, accessToken } = parseUser(this.user);

    this.accessToken = accessToken;
    this.provider = provider.toUpperCase() as GitProvider;
    this.login = login;

    this.gitService = gitServiceFactory(this.user, this.provider);
    this.accountHelper = new AccountHelper(this.provider, this.user);
    this.repositoriesService = new RepositoriesService(this.user);
    this.filterReposByWriteAccess = filterReposByWriteAccess;
  }

  public async synchronize() {
    const allowedAccounts: AllowedAccounts = {};

    // First we synchronize accounts and return git provider accounts, so we don't need to request them
    // again to get the allowed accounts and repositories (+ sync repos as well)
    const gitProviderAccounts = await this.syncAndGetGitProviderAccounts();

    // Now we get our DB accounts and the repositories from the Git Providers using the previous fetched git accounts + the roles from the db
    const [results, roles] = await Promise.all([
      this.getDBAccountsAndGitRepos(gitProviderAccounts),
      findAllRoles()
    ]);

    // Init roles to sync user
    this.roles = roles;

    // after getting account, repos and git repos, we will sync them with our db and create the allowedAccounts object
    await Promise.all(
      results.map(async result => {
        const [account, gitRepos, gitAccount] = result;
        if (account && gitRepos) {
          const repositoryIds = await this.syncRepositories(account, gitRepos);

          allowedAccounts[account.idAccount] = {
            idAccount: account.idAccount,
            login: account.login,
            provider: account.provider,
            allowedRepositories: repositoryIds,
            ...this.accountHelper.getProviderAccountAttrs(gitAccount)
          };

          await this.syncUser(account);
        }
      })
    );

    return allowedAccounts;
  }

  public async synchronizeUsers(account: Account) {
    if (
      account &&
      account.provider === GitProvider.GITHUB &&
      account.type === AccountType.ORGANIZATION &&
      account.installationId
    ) {
      const members = await (this.gitService as GitHubService).getAllOrgMembers(account);

      const usersInDb = await findUsersWithRoleByProviderInternalIds(
        members.map(u => String(u.id)),
        this.user.provider,
        account.idAccount
      );

      const ids = usersInDb.map(u => u.providerInternalId);
      const membersNotInDb = members.filter(member => !ids.includes(String(member.id)));

      if (membersNotInDb.length) {
        const roles = await findAllRoles();
        const defaultRole = roles.find(r => r.name === UserRoleName.DEVELOPER)!;

        await createUsers(
          membersNotInDb.map(memberNotInDb => ({
            idUser: uuid(),
            login: memberNotInDb.login,
            provider: GitProvider.GITHUB,
            providerInternalId: String(memberNotInDb.id),
            avatarUrl: memberNotInDb.avatar_url
          })),
          account.idAccount,
          defaultRole.idRole
        );
      }

      await updateAccount(account.idAccount, { usersSynchronized: true });

      return true;
    }
    return false;
  }

  private async getDBAccountsAndGitRepos(
    gitProviderAccounts:
      | GithubInstallation[]
      | GitlabAccountsResult
      | Schema.Workspace[]
      | BBDCGitAccountsResult
  ): Promise<[AccountWithRepos | undefined, GitRepository[], GitAccount][]> {
    let results: [AccountWithRepos | undefined, GitRepository[], GitAccount][] = [];
    switch (this.provider) {
      case GitProvider.GITHUB:
        results = await getGithubAcccountsAndRepos(
          gitProviderAccounts as GithubInstallation[],
          this.gitService as GitHubService
        );
        break;
      case GitProvider.GITLAB:
        // eslint-disable-next-line no-case-declarations
        const { groups, gitlabUser } = gitProviderAccounts as GitlabAccountsResult;
        results = await getGitlabAcccountsAndRepos(
          groups,
          gitlabUser,
          this.gitService as GitLabService
        );
        break;
      case GitProvider.BITBUCKET:
        results = await getBitbucketAcccountsAndRepos(
          gitProviderAccounts as Schema.Workspace[],
          this.gitService as BitbucketService
        );
        break;
      case GitProvider.BITBUCKET_DATA_CENTER:
        // eslint-disable-next-line no-case-declarations
        const { projects, personalProject } = gitProviderAccounts as BBDCGitAccountsResult;
        results = await getBitbucketDataCenterAcccountsAndRepos(
          projects,
          personalProject,
          this.gitService as BitbucketDataCenterService
        );
        break;
      default:
        throw boom.badRequest(
          'provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]'
        );
    }

    return results;
  }

  private async syncAndGetGitProviderAccounts(): Promise<
    GithubInstallation[] | GitlabAccountsResult | Schema.Workspace[] | BBDCGitAccountsResult
  > {
    switch (this.provider) {
      case GitProvider.GITHUB:
        return syncGithubAccounts(this.accountHelper, this.gitService as GitHubService);
      case GitProvider.GITLAB:
        return syncGitlabAccounts(this.user, this.accountHelper);
      case GitProvider.BITBUCKET:
        // Bitbucket has no Sync of accounts on api, only managed on webhooks, so we just return the workspaces
        return (this.gitService as BitbucketService).getWorkspaces();
      case GitProvider.BITBUCKET_DATA_CENTER:
        return syncBitbucketDataCenterAccounts(
          this.user,
          this.gitService as BitbucketDataCenterService
        );
      default:
        throw boom.badRequest(
          'provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]'
        );
    }
  }

  private filterGitReposByAccessLevel(gitRepos: GitRepository[], account: BaseAccount) {
    const filterByWriteAccess = this.filterReposByWriteAccess || !!account.filterReposByWriteAccess;

    if (!filterByWriteAccess) {
      return gitRepos;
    }

    switch (this.provider) {
      case GitProvider.GITHUB:
        return gitRepos.filter(gitRepo => (gitRepo as GithubRepository).permissions?.push);
      case GitProvider.GITLAB:
        return gitRepos.filter(gitRepo => {
          const { permissions } = gitRepo as GitlabRepository;

          const projectAccessLevel = permissions.project_access.access_level;
          const groupAccessLevel = permissions.group_access?.access_level || 0;

          const pushMinLevel = (this.gitService as GitLabService).GITLAB_ACCESS_LEVEL.DEVELOPER;

          return projectAccessLevel >= pushMinLevel || groupAccessLevel >= pushMinLevel;
        });
      default:
        return gitRepos;
    }
  }

  private isAdminOfGitRepo(gitRepo: GitRepository) {
    switch (this.provider) {
      case GitProvider.GITHUB:
        return (gitRepo as GithubRepository).permissions?.admin;
      case GitProvider.GITLAB: {
        const { permissions } = gitRepo as GitlabRepository;

        // This should always come, but in case something happens and we don't get this object, we just return false
        if (!permissions) {
          return false;
        }

        const gitlabService = this.gitService as GitLabService;

        const projectAccessLevel = permissions.project_access.access_level;
        const groupAccessLevel = permissions.group_access?.access_level || 0;

        const projectRole = gitlabService.convertAccessLevelToGuardRailsRole(projectAccessLevel);
        const groupRole = gitlabService.convertAccessLevelToGuardRailsRole(groupAccessLevel);

        return projectRole === UserRoleName.ADMIN || groupRole === UserRoleName.ADMIN;
      }
      default:
        return false;
    }
  }

  /**
   * This check for new git repos not in our DB and for repos that could have change to create/update those
   * @param Account account
   * @param GitRepository gitRepos
   *
   * @returns array of idRepository of existing and new repos
   */
  private async syncRepositories(
    account: AccountWithRepos,
    gitRepos: GitRepository[]
  ): Promise<{ read: number[]; admin: number[] }> {
    let { repositories } = account;

    if (!repositories) {
      throw new Error('Internal error: Invalid repositories on account');
    }

    // To sync repos, we want to ignore all monorepo's subrepos, since these are not synchronized here.
    repositories = repositories.filter(r => !r.fkParentRepository);
    repositories = await this.repositoriesService.deduplicateRepositories(repositories, account);

    const repositoryIds: { read: number[]; admin: number[] } = { read: [], admin: [] };
    const updatesBatch: { idRepository: number; patch: any }[] = [];
    const gitReposToCreate: GitRepository[] = [];

    const filteredGitRepos = this.filterGitReposByAccessLevel(gitRepos, account);

    const accountIsOnLegacyPlan = isLegacyPlan(account.subscription.plan.code);

    filteredGitRepos.forEach(gitRepo => {
      const existingRepo = repositories.find(repo => isSame(repo, gitRepo));

      // the normal behavior is that repos should exist
      if (existingRepo) {
        if (this.isAdminOfGitRepo(gitRepo)) {
          repositoryIds.admin.push(existingRepo.idRepository);
        } else {
          repositoryIds.read.push(existingRepo.idRepository);
        }

        // check for update behavior, only for GL and BBDC
        if (shouldUpdateRepository(existingRepo, gitRepo, this.provider, accountIsOnLegacyPlan)) {
          updatesBatch.push({
            idRepository: existingRepo.idRepository,
            patch: getProviderSpecificFieldsForUpdate(
              this.provider,
              gitRepo,
              accountIsOnLegacyPlan,
              existingRepo
            )
          });
        }
        // if not, we create them, but this should be normally covered by probot
      } else {
        gitReposToCreate.push(gitRepo);
      }
    });

    const [newRepos] = await Promise.all<Repository[]>([
      createRepositories(
        populateGitReposToDBRepos(account, gitReposToCreate, accountIsOnLegacyPlan)
      ),
      updateRepositories(updatesBatch)
    ]);

    // extra sync for BBDC to get the default branch
    if (this.provider === GitProvider.BITBUCKET_DATA_CENTER) {
      const gitService = gitServiceFactory(this.user, this.provider);
      syncDefaultBranches(
        [...repositories, ...newRepos],
        gitRepos as BBDCRepository[],
        account,
        gitService as BitbucketDataCenterService
      );
    }

    // add the new repos ids to the repositoryIds arrays
    if (newRepos && newRepos.length) {
      newRepos.forEach(newRepo => {
        const gitRepo = filteredGitRepos.find(filteredGitRepo => isSame(newRepo, filteredGitRepo));
        if (gitRepo && this.isAdminOfGitRepo(gitRepo)) {
          repositoryIds.admin.push(newRepo.idRepository);
        } else {
          repositoryIds.read.push(newRepo.idRepository);
        }
      });
    }

    return repositoryIds;
  }

  private async syncUser(account: BaseAccount) {
    const { idAccount } = account;

    const userInDb = await findUserWithRoleByProviderInternalId(
      this.user.providerInternalId,
      this.user.provider,
      idAccount
    );
    if (!userInDb) {
      throw boom.notFound('User not found.');
    }
    const { idUser, providerInternalId, role: currentUserRole, roleOverwrittenAt } = userInDb;

    const defaultRole = this.roles!.find(r => r.name === UserRoleName.DEVELOPER)!;
    const gitRole = await this.gitService.getUserRole(account, providerInternalId!);

    if (gitRole !== false) {
      const { idRole } = this.roles!.find(r => r.name === gitRole) || defaultRole;

      // if the user has no role yet, we create the record, if not we will update if it's different to the current one
      if (!currentUserRole) {
        await createUserRole(idUser, idAccount, idRole);
      } else if (!roleOverwrittenAt && currentUserRole.idRole !== idRole) {
        await updateUsersRole([idUser], idAccount, idRole);
      }
    }
  }
}

export default SyncService;
