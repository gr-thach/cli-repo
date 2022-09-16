import boom from '@hapi/boom';
import lodashGet from 'lodash/get';
import lodashGroupBy from 'lodash/groupBy';
import lodashOrderBy from 'lodash/orderBy';
import {
  deleteRepositoriesByIds,
  hasRepositoryData,
  updateRepository
} from '../helpers/core-api/repositories';
import { enableDisableOnGitlab } from '../helpers/gitlab';
import { gitServiceFactory } from '../helpers/gitServiceFactory';
import {
  isPrivateReposLimitReached,
  privateRepositoriesLimitReachedError
} from '../helpers/repository';
import {
  Account,
  GitProvider,
  Repository,
  RepositoryWithAccount,
  RequestUser
} from '../interfaces';
import BitbucketDataCenterService from './git/bitbucketDataCenter';

class RepositoriesService {
  user: RequestUser;

  constructor(user: RequestUser) {
    this.user = user;
  }

  enableRepository = async (
    repository: RepositoryWithAccount,
    isEnabled: boolean,
    onError: 'raise' | 'log' = 'raise'
  ) => {
    try {
      if (repository.isPrivate && isEnabled) {
        const limitResult = await isPrivateReposLimitReached(repository);
        if (limitResult !== false) {
          await privateRepositoriesLimitReachedError({
            ...limitResult,
            user: this.user,
            repositoryId: repository.idRepository
          });
        }
      }

      if (repository.provider === GitProvider.GITLAB) {
        try {
          await enableDisableOnGitlab(this.user.gitlabAccessToken!, repository, isEnabled);
        } catch (e) {
          const baseMsg = `Failed to enable repository ${repository.name} on GitLab.`;
          if ((e as any).message.includes('403')) {
            throw boom.forbidden(
              `${baseMsg} You do not have sufficient permissions to perform this operation.`
            );
          }
          // eslint-disable-next-line no-console
          console.error(e);
          throw boom.badGateway(`${baseMsg} Please try again or contact GuardRails support.`);
        }
      }

      if (repository.provider === GitProvider.BITBUCKET_DATA_CENTER) {
        try {
          const gitService = gitServiceFactory(this.user, repository.provider);
          await (gitService as BitbucketDataCenterService).enableDisableOnBitbucketDataCenter(
            repository,
            isEnabled
          );
        } catch (e) {
          throw boom.notFound(`Failed to enable repository ${repository.name} on Bitbucket.`);
        }
      }

      const updatedRepo = await updateRepository(repository.idRepository, {
        isEnabled: isEnabled,
        updatedAt: new Date().toJSON()
      });

      return updatedRepo;
    } catch (e) {
      if (onError === 'raise') {
        throw e;
      } else {
        // eslint-disable-next-line no-console
        console.error(e);
        return repository;
      }
    }
  };

  deduplicateRepositories = async (
    repositories: Repository[],
    account: Account
  ): Promise<Repository[]> => {
    if (!repositories.length) {
      return repositories;
    }

    const deduplicatedRepositories: Repository[] = [];
    const repositoriesToDelete: Repository[] = [];

    const groupedRepositories = lodashGroupBy(repositories, 'providerInternalId');

    const keys = Object.keys(groupedRepositories);
    for (let i = 0; i < keys.length; i++) {
      const providerInternalId = keys[i];
      const duplicatedRepositories = groupedRepositories[providerInternalId];

      // if more than 1, then we have duplicated
      if (duplicatedRepositories.length > 1) {
        // eslint-disable-next-line no-await-in-loop
        const hasDataResults = await Promise.all(
          duplicatedRepositories.map(r => hasRepositoryData(r.idRepository))
        );

        const repoWithDataIndex = hasDataResults.indexOf(true);
        // if no repo has data, we will prioritize enabled repositories and then older repositories
        if (repoWithDataIndex === -1) {
          const sortedRepositories = lodashOrderBy(
            duplicatedRepositories,
            ['isEnabled', 'createdAt'],
            ['desc', 'asc']
          );
          const repoToKeep = lodashGet(sortedRepositories, '[0]');
          deduplicatedRepositories.push(repoToKeep);
          repositoriesToDelete.push(...sortedRepositories.slice(1));

          // if there is only one repository with data, we will keep this repository and delete the rest
        } else if (repoWithDataIndex === hasDataResults.lastIndexOf(true)) {
          const repoWithData = duplicatedRepositories[repoWithDataIndex];
          const rest = duplicatedRepositories.filter((r, index) => index !== repoWithDataIndex);

          if (!repoWithData.isEnabled && rest.some(r => r.isEnabled)) {
            this.enableRepository({ ...repoWithData, account }, true, 'log');

            // We also set it here, we don't need to wait for the above response
            deduplicatedRepositories.push({ ...repoWithData, isEnabled: true });
          } else {
            deduplicatedRepositories.push(repoWithData);
          }

          repositoriesToDelete.push(...rest);
        } else {
          // TODO: this is when more than one repo has data and we need to merge it
          // for now, we just keep them all:
          deduplicatedRepositories.push(...duplicatedRepositories);
        }
      } else {
        deduplicatedRepositories.push(duplicatedRepositories[0]);
      }
    }

    // we can do this async
    deleteRepositoriesByIds(repositoriesToDelete.map(r => r.idRepository));

    return deduplicatedRepositories;
  };
}

export default RepositoriesService;
