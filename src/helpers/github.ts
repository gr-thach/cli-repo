import lodashGet from 'lodash/get';
import lodashGroupBy from 'lodash/groupBy';
import {
  AccountType,
  AccountWithRepos,
  BaseAccount,
  GithubInstallation,
  GithubRepository,
  GitProvider
} from '../interfaces';
import GitHubService from '../services/git/github';
import AccountHelper from './account';
import {
  findBaseAccountsByProviderInternalIds,
  findAccountWithReposByProviderInternalId
} from './core-api/accounts';

export const getGithubAcccountsAndRepos = async (
  installations: GithubInstallation[],
  gitService: GitHubService
) => {
  // for each installation they have access to, get the DB accounts and the git repos
  const results = await Promise.all(
    installations.map((installation: GithubInstallation) =>
      Promise.all([
        findAccountWithReposByProviderInternalId(
          String(installation.account.id),
          GitProvider.GITHUB
        ),
        gitService.getRepositories({ installationId: installation.id }),
        Promise.resolve(installation)
      ])
    )
  );

  return results.map(result => {
    const [account, gitRepos, installation] = result;
    const filteredRepos = gitRepos.filter(r => {
      if (!lodashGet(r, 'full_name')) {
        // eslint-disable-next-line no-console
        console.warn('Skipping repository with no full_name', { repository: JSON.stringify(r) });
        return false;
      }
      return true;
    });

    return [account, filteredRepos, installation] as [
      AccountWithRepos | undefined,
      GithubRepository[],
      GithubInstallation
    ];
  });
};

export const syncGithubAccounts = async (
  accountHelper: AccountHelper,
  gitService: GitHubService
) => {
  const _installations = await gitService.getUserInstallations();

  // filter out accounts without login and type for now (Enterprise accounts)
  const installations = _installations.filter(i => {
    if (!lodashGet(i, 'account.login') || !lodashGet(i, 'account.type')) {
      // eslint-disable-next-line no-console
      console.warn('Skipping installation with no login and/or type', {
        installation: JSON.stringify(i)
      });
      return false;
    }
    return true;
  });

  // group installations by type to query them separatedly with the type filter in case there
  // is an account of type User with the same id as an account of type Organization
  const groupedInstallations = lodashGroupBy(installations, 'account.type');

  const promises: Promise<BaseAccount[]>[] = Object.keys(groupedInstallations).map(type => {
    const accountIds = groupedInstallations[type].map(i => lodashGet(i, 'account.id'));
    return findBaseAccountsByProviderInternalIds(
      accountIds,
      GitProvider.GITHUB,
      type.toUpperCase() as AccountType
    );
  });
  const accounts = (await Promise.all(promises)).flat();

  const installationsNotInDb = installations.filter(
    installation => !accounts.find(acc => acc.installationId === installation.id)
  );
  if (installationsNotInDb.length) {
    await accountHelper.bulkCreateFromGithubInstallations(installationsNotInDb);
  }

  return installations;
};
