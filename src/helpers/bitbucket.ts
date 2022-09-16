import { Schema } from 'bitbucket';
import { GitProvider } from '../interfaces';
import BitbucketService from '../services/git/bitbucket';
import { findAccountWithReposByProviderInternalId } from './core-api/accounts';

export const getBitbucketAcccountsAndRepos = async (
  workspaces: Schema.Workspace[],
  gitService: BitbucketService
) => {
  const results = await Promise.all(
    workspaces
      .filter(workspace => workspace.uuid)
      .map(workspace =>
        Promise.all([
          findAccountWithReposByProviderInternalId(workspace.uuid!, GitProvider.BITBUCKET),
          gitService.getRepositories({ providerInternalId: workspace.uuid! }),
          Promise.resolve(workspace)
        ])
      )
  );

  return results;
};
