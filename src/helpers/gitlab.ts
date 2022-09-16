import {
  AccountType,
  AccountWithRepos,
  GitlabGroup,
  GitlabRepository,
  GitlabUser,
  GitProvider,
  Repository,
  RepositoryWithAccount,
  RequestUser,
  ScanType
} from '../interfaces';
import GitLabService from '../services/git/gitlab';
import { triggerScan } from './scan';
import { queryScanCountPerRepo } from './core-api/scans';
import { findAccountWithReposByProviderInternalId } from './core-api/accounts';
import { assertHasMatchingGitlabGroup, assertAccountMatchesGitlabUser } from './assertGitlab';
import AccountHelper from './account';

export const checkGitlabGroups = async (
  user: RequestUser
): Promise<{ groups: GitlabGroup[]; gitlabUser: GitlabUser }> => {
  const gitlabUser = await GitLabService.getAuthenticatedUser(user.gitlabAccessToken!);
  gitlabUser.path = gitlabUser.username;
  gitlabUser.kind = 'user';

  const groups = await GitLabService.getGroups(user.gitlabAccessToken!);

  return {
    groups,
    gitlabUser
  };
};

export const enableDisableOnGitlab = async (
  gitlabAccessToken: string,
  repository: RepositoryWithAccount,
  isEnabled: boolean
) => {
  const gitlabService = new GitLabService(gitlabAccessToken, '');
  if (isEnabled === true) {
    await gitlabService.addHooksAndMemberToGitlabProjects({
      account: repository.account,
      repositories: [repository]
    });
    // When a repo is enable, we check if it has been scanned before. If it hasn't, then the repo is automatically scan once
    const scanCount = await queryScanCountPerRepo(repository.idRepository);
    if (scanCount === 0) {
      const sha = await gitlabService.getBranchSha(repository, repository.defaultBranch);
      await triggerScan(
        sha,
        repository.defaultBranch,
        repository.account,
        repository,
        ScanType.BRANCH,
        0
      );
    }
  } else {
    await gitlabService.removeHooksAndMemberFromGitlabProjects({
      repositories: [repository]
    });
  }
};

const getAccountAndRepos = async (
  groupOrUser: GitlabGroup | GitlabUser,
  type: AccountType,
  gitService: GitLabService
): Promise<[AccountWithRepos | undefined, GitlabRepository[], GitlabGroup | GitlabUser]> => {
  return Promise.all([
    findAccountWithReposByProviderInternalId(String(groupOrUser.id), GitProvider.GITLAB, type),
    gitService.getRepositories({ providerInternalId: String(groupOrUser.id), type }),
    Promise.resolve(groupOrUser)
  ]);
};

export const getGitlabAcccountsAndRepos = async (
  groups: GitlabGroup[],
  gitlabUser: GitlabUser,
  gitService: GitLabService
) => {
  // for each group they have access to, get the DB accounts and the git repos
  // plus (for gitlab) get the user account with the user repos
  const results: [
    AccountWithRepos | undefined,
    GitlabRepository[],
    GitlabGroup | GitlabUser
  ][] = await Promise.all([
    ...groups.map(group => getAccountAndRepos(group, AccountType.ORGANIZATION, gitService)),
    getAccountAndRepos(gitlabUser, AccountType.USER, gitService)
  ]);

  // extract the user account to do an assert for org accounts and user separatedly
  const userResults = results.pop();

  // If we haven't created a organization account for the Gitlab group yet then
  // the account will be undefined, so we must filter away those accounts.
  const filteredResults = results.filter(accountWithGitRepo => accountWithGitRepo[0]);
  // Do a sanity check that each account matches a Gitlab group, so we don't accedentially leak accounts.
  assertHasMatchingGitlabGroup(
    filteredResults.map(orgAccount => orgAccount[0]),
    groups
  );

  if (userResults && userResults[0]) {
    assertAccountMatchesGitlabUser(userResults[0], gitlabUser);
  }

  // put it back
  if (userResults) {
    results.push(userResults);
  }

  return results;
};

export const compareRepo = (repo: Repository, gitRepo: GitlabRepository) => {
  return (
    repo.name !== gitRepo.path ||
    repo.isPrivate !== (gitRepo.visibility === 'private') ||
    repo.description !== gitRepo.description ||
    repo.fullName !== gitRepo.path_with_namespace ||
    (gitRepo.default_branch && repo.defaultBranch !== gitRepo.default_branch)
  );
};

export const syncGitlabAccounts = async (user: RequestUser, accountHelper: AccountHelper) => {
  const { groups, gitlabUser } = await checkGitlabGroups(user);

  await Promise.all([
    await accountHelper.syncGitlabGroups(groups),
    await accountHelper.syncGitlabUser(gitlabUser)
  ]);

  return { groups, gitlabUser };
};
