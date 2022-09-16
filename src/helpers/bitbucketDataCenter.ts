import lodashGet from 'lodash/get';
import {
  Account,
  AccountType,
  BBDCPersonalProject,
  BBDCProject,
  BBDCRepository,
  GitProvider,
  Repository,
  RepositoryWithAccount,
  RequestUser
} from '../interfaces';
import BitbucketDataCenterService from '../services/git/bitbucketDataCenter';
import { findAccountWithReposByProviderInternalId } from './core-api/accounts';
import {
  assertAccountsHasMatchingOrgProject,
  assertAccountMatchesPersonalProject
} from './assertBitbucketDataCenter';
import { updateRepository } from './core-api/repositories';
import reportError from '../../sentry';
import SyncBitbucketDataCenterAccounts from '../sync/bitbucketDataCenter/syncBitbucketDataCenterAccounts';

export const getBitbucketDataCenterAcccountsAndRepos = async (
  projects: BBDCProject[],
  personalProject: BBDCPersonalProject,
  gitService: BitbucketDataCenterService
) => {
  const results = await Promise.all([
    ...projects.map(project =>
      Promise.all([
        findAccountWithReposByProviderInternalId(
          String(project.id),
          GitProvider.BITBUCKET_DATA_CENTER,
          AccountType.ORGANIZATION
        ),
        gitService.getRepositories({ projectKey: project.key }),
        Promise.resolve(project)
      ])
    ),
    Promise.all([
      findAccountWithReposByProviderInternalId(
        String(personalProject.id),
        GitProvider.BITBUCKET_DATA_CENTER,
        AccountType.USER
      ),
      gitService.getRepositories({ projectKey: personalProject.key }),
      Promise.resolve(personalProject)
    ])
  ]);

  // extract the user account to do an assert for org accounts and user separatedly
  const userResults = results.pop();

  // If we haven't created a organization account for the Bitbucket group yet then
  // the account will be undefined, so we must filter away those accounts.
  const filteredResults = results.filter(accountWithGitRepo => accountWithGitRepo[0]);

  // Do a sanity check that each account matches a Bitbucket data center project, so we don't accedentially leak accounts.
  assertAccountsHasMatchingOrgProject(
    filteredResults.map(orgAccount => orgAccount[0]),
    projects
  );

  // If this is the first time the user is logging in into Guardrails then
  // the account will be undefined (as we haven't created it yet), that's why we need this check here.
  if (userResults && userResults[0]) {
    assertAccountMatchesPersonalProject(userResults[0], personalProject);
  }

  // put it back
  if (userResults) {
    results.push(userResults);
  }

  return results;
};

export const compareRepo = (repo: Repository, gitRepo: BBDCRepository) => {
  return (
    repo.name !== gitRepo.slug ||
    repo.isPrivate === gitRepo.public ||
    // repo.description !== gitRepo.description ||
    repo.fullName !== `projects/${gitRepo.project.key}/repos/${gitRepo.slug}`
    // (gitRepo.default_branch && gitRepo.default_branch !== repo.defaultBranch)
  );
};

const syncDefaultBranch = async (
  repo: RepositoryWithAccount,
  gitRepo: BBDCRepository,
  gitService: BitbucketDataCenterService
) => {
  const gitDefaultBranch = lodashGet(gitRepo, 'default_branch', null);

  if (!gitDefaultBranch) {
    const defaultBranch = await gitService.getDefaultBranch(repo);
    if (defaultBranch && defaultBranch !== repo.defaultBranch) {
      try {
        await updateRepository(repo.idRepository, {
          defaultBranch,
          updatedAt: new Date().toJSON()
        });
      } catch (e) {
        reportError(e);
      }
    }
  }
};

export const syncDefaultBranches = async (
  repos: Repository[],
  gitRepos: BBDCRepository[],
  account: Account,
  gitService: BitbucketDataCenterService
) => {
  return Promise.all(
    repos.map(repo => {
      const gitRepo = gitRepos.find(x => repo.providerInternalId === String(x.id));
      return gitRepo ? syncDefaultBranch({ ...repo, account }, gitRepo, gitService) : undefined;
    })
  );
};

export const syncBitbucketDataCenterAccounts = async (
  user: RequestUser,
  gitService: BitbucketDataCenterService
) => {
  const projects = await gitService.getProjects();
  const personalProject = await gitService.getPersonalProject();

  const syncBitbucketDataCenter = new SyncBitbucketDataCenterAccounts(user);
  await syncBitbucketDataCenter.sync(projects, personalProject);

  return { projects, personalProject };
};
