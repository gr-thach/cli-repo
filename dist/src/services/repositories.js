"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const get_1 = __importDefault(require("lodash/get"));
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const orderBy_1 = __importDefault(require("lodash/orderBy"));
const repositories_1 = require("../helpers/core-api/repositories");
const gitlab_1 = require("../helpers/gitlab");
const gitServiceFactory_1 = require("../helpers/gitServiceFactory");
const repository_1 = require("../helpers/repository");
const interfaces_1 = require("../interfaces");
class RepositoriesService {
    user;
    constructor(user) {
        this.user = user;
    }
    enableRepository = async (repository, isEnabled, onError = 'raise') => {
        try {
            if (repository.isPrivate && isEnabled) {
                const limitResult = await (0, repository_1.isPrivateReposLimitReached)(repository);
                if (limitResult !== false) {
                    await (0, repository_1.privateRepositoriesLimitReachedError)({
                        ...limitResult,
                        user: this.user,
                        repositoryId: repository.idRepository
                    });
                }
            }
            if (repository.provider === interfaces_1.GitProvider.GITLAB) {
                try {
                    await (0, gitlab_1.enableDisableOnGitlab)(this.user.gitlabAccessToken, repository, isEnabled);
                }
                catch (e) {
                    const baseMsg = `Failed to enable repository ${repository.name} on GitLab.`;
                    if (e.message.includes('403')) {
                        throw boom_1.default.forbidden(`${baseMsg} You do not have sufficient permissions to perform this operation.`);
                    }
                    // eslint-disable-next-line no-console
                    console.error(e);
                    throw boom_1.default.badGateway(`${baseMsg} Please try again or contact GuardRails support.`);
                }
            }
            if (repository.provider === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
                try {
                    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(this.user, repository.provider);
                    await gitService.enableDisableOnBitbucketDataCenter(repository, isEnabled);
                }
                catch (e) {
                    throw boom_1.default.notFound(`Failed to enable repository ${repository.name} on Bitbucket.`);
                }
            }
            const updatedRepo = await (0, repositories_1.updateRepository)(repository.idRepository, {
                isEnabled: isEnabled,
                updatedAt: new Date().toJSON()
            });
            return updatedRepo;
        }
        catch (e) {
            if (onError === 'raise') {
                throw e;
            }
            else {
                // eslint-disable-next-line no-console
                console.error(e);
                return repository;
            }
        }
    };
    deduplicateRepositories = async (repositories, account) => {
        if (!repositories.length) {
            return repositories;
        }
        const deduplicatedRepositories = [];
        const repositoriesToDelete = [];
        const groupedRepositories = (0, groupBy_1.default)(repositories, 'providerInternalId');
        const keys = Object.keys(groupedRepositories);
        for (let i = 0; i < keys.length; i++) {
            const providerInternalId = keys[i];
            const duplicatedRepositories = groupedRepositories[providerInternalId];
            // if more than 1, then we have duplicated
            if (duplicatedRepositories.length > 1) {
                // eslint-disable-next-line no-await-in-loop
                const hasDataResults = await Promise.all(duplicatedRepositories.map(r => (0, repositories_1.hasRepositoryData)(r.idRepository)));
                const repoWithDataIndex = hasDataResults.indexOf(true);
                // if no repo has data, we will prioritize enabled repositories and then older repositories
                if (repoWithDataIndex === -1) {
                    const sortedRepositories = (0, orderBy_1.default)(duplicatedRepositories, ['isEnabled', 'createdAt'], ['desc', 'asc']);
                    const repoToKeep = (0, get_1.default)(sortedRepositories, '[0]');
                    deduplicatedRepositories.push(repoToKeep);
                    repositoriesToDelete.push(...sortedRepositories.slice(1));
                    // if there is only one repository with data, we will keep this repository and delete the rest
                }
                else if (repoWithDataIndex === hasDataResults.lastIndexOf(true)) {
                    const repoWithData = duplicatedRepositories[repoWithDataIndex];
                    const rest = duplicatedRepositories.filter((r, index) => index !== repoWithDataIndex);
                    if (!repoWithData.isEnabled && rest.some(r => r.isEnabled)) {
                        this.enableRepository({ ...repoWithData, account }, true, 'log');
                        // We also set it here, we don't need to wait for the above response
                        deduplicatedRepositories.push({ ...repoWithData, isEnabled: true });
                    }
                    else {
                        deduplicatedRepositories.push(repoWithData);
                    }
                    repositoriesToDelete.push(...rest);
                }
                else {
                    // TODO: this is when more than one repo has data and we need to merge it
                    // for now, we just keep them all:
                    deduplicatedRepositories.push(...duplicatedRepositories);
                }
            }
            else {
                deduplicatedRepositories.push(duplicatedRepositories[0]);
            }
        }
        // we can do this async
        (0, repositories_1.deleteRepositoriesByIds)(repositoriesToDelete.map(r => r.idRepository));
        return deduplicatedRepositories;
    };
}
exports.default = RepositoriesService;
//# sourceMappingURL=repositories.js.map