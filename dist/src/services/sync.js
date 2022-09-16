"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const uuid_1 = require("uuid");
const interfaces_1 = require("../interfaces");
const gitServiceFactory_1 = require("../helpers/gitServiceFactory");
const user_1 = require("../helpers/user");
const gitlab_1 = require("../helpers/gitlab");
const github_1 = require("../helpers/github");
const bitbucket_1 = require("../helpers/bitbucket");
const repositories_1 = require("../helpers/core-api/repositories");
const repository_1 = require("../helpers/repository");
const bitbucketDataCenter_1 = require("../helpers/bitbucketDataCenter");
const account_1 = __importDefault(require("../helpers/account"));
const users_1 = require("../helpers/core-api/users");
const roles_1 = require("../helpers/core-api/roles");
const accounts_1 = require("../helpers/core-api/accounts");
const subscription_1 = require("../helpers/subscription");
const repositories_2 = __importDefault(require("./repositories"));
const isSame = (repo, gitRepo) => {
    return (!repo.fkParentRepository && // skip monorepo's sub-repos
        repo.providerInternalId ===
            String(gitRepo.id || gitRepo.uuid));
};
class SyncService {
    user;
    accessToken;
    provider;
    login;
    gitService;
    accountHelper;
    repositoriesService;
    filterReposByWriteAccess;
    roles;
    constructor(user, filterReposByWriteAccess = false) {
        this.user = user;
        const { provider, login, accessToken } = (0, user_1.parseUser)(this.user);
        this.accessToken = accessToken;
        this.provider = provider.toUpperCase();
        this.login = login;
        this.gitService = (0, gitServiceFactory_1.gitServiceFactory)(this.user, this.provider);
        this.accountHelper = new account_1.default(this.provider, this.user);
        this.repositoriesService = new repositories_2.default(this.user);
        this.filterReposByWriteAccess = filterReposByWriteAccess;
    }
    async synchronize() {
        const allowedAccounts = {};
        // First we synchronize accounts and return git provider accounts, so we don't need to request them
        // again to get the allowed accounts and repositories (+ sync repos as well)
        const gitProviderAccounts = await this.syncAndGetGitProviderAccounts();
        // Now we get our DB accounts and the repositories from the Git Providers using the previous fetched git accounts + the roles from the db
        const [results, roles] = await Promise.all([
            this.getDBAccountsAndGitRepos(gitProviderAccounts),
            (0, roles_1.findAllRoles)()
        ]);
        // Init roles to sync user
        this.roles = roles;
        // after getting account, repos and git repos, we will sync them with our db and create the allowedAccounts object
        await Promise.all(results.map(async (result) => {
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
        }));
        return allowedAccounts;
    }
    async synchronizeUsers(account) {
        if (account &&
            account.provider === interfaces_1.GitProvider.GITHUB &&
            account.type === interfaces_1.AccountType.ORGANIZATION &&
            account.installationId) {
            const members = await this.gitService.getAllOrgMembers(account);
            const usersInDb = await (0, users_1.findUsersWithRoleByProviderInternalIds)(members.map(u => String(u.id)), this.user.provider, account.idAccount);
            const ids = usersInDb.map(u => u.providerInternalId);
            const membersNotInDb = members.filter(member => !ids.includes(String(member.id)));
            if (membersNotInDb.length) {
                const roles = await (0, roles_1.findAllRoles)();
                const defaultRole = roles.find(r => r.name === interfaces_1.UserRoleName.DEVELOPER);
                await (0, users_1.createUsers)(membersNotInDb.map(memberNotInDb => ({
                    idUser: (0, uuid_1.v4)(),
                    login: memberNotInDb.login,
                    provider: interfaces_1.GitProvider.GITHUB,
                    providerInternalId: String(memberNotInDb.id),
                    avatarUrl: memberNotInDb.avatar_url
                })), account.idAccount, defaultRole.idRole);
            }
            await (0, accounts_1.updateAccount)(account.idAccount, { usersSynchronized: true });
            return true;
        }
        return false;
    }
    async getDBAccountsAndGitRepos(gitProviderAccounts) {
        let results = [];
        switch (this.provider) {
            case interfaces_1.GitProvider.GITHUB:
                results = await (0, github_1.getGithubAcccountsAndRepos)(gitProviderAccounts, this.gitService);
                break;
            case interfaces_1.GitProvider.GITLAB:
                // eslint-disable-next-line no-case-declarations
                const { groups, gitlabUser } = gitProviderAccounts;
                results = await (0, gitlab_1.getGitlabAcccountsAndRepos)(groups, gitlabUser, this.gitService);
                break;
            case interfaces_1.GitProvider.BITBUCKET:
                results = await (0, bitbucket_1.getBitbucketAcccountsAndRepos)(gitProviderAccounts, this.gitService);
                break;
            case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
                // eslint-disable-next-line no-case-declarations
                const { projects, personalProject } = gitProviderAccounts;
                results = await (0, bitbucketDataCenter_1.getBitbucketDataCenterAcccountsAndRepos)(projects, personalProject, this.gitService);
                break;
            default:
                throw boom_1.default.badRequest('provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]');
        }
        return results;
    }
    async syncAndGetGitProviderAccounts() {
        switch (this.provider) {
            case interfaces_1.GitProvider.GITHUB:
                return (0, github_1.syncGithubAccounts)(this.accountHelper, this.gitService);
            case interfaces_1.GitProvider.GITLAB:
                return (0, gitlab_1.syncGitlabAccounts)(this.user, this.accountHelper);
            case interfaces_1.GitProvider.BITBUCKET:
                // Bitbucket has no Sync of accounts on api, only managed on webhooks, so we just return the workspaces
                return this.gitService.getWorkspaces();
            case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
                return (0, bitbucketDataCenter_1.syncBitbucketDataCenterAccounts)(this.user, this.gitService);
            default:
                throw boom_1.default.badRequest('provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]');
        }
    }
    filterGitReposByAccessLevel(gitRepos, account) {
        const filterByWriteAccess = this.filterReposByWriteAccess || !!account.filterReposByWriteAccess;
        if (!filterByWriteAccess) {
            return gitRepos;
        }
        switch (this.provider) {
            case interfaces_1.GitProvider.GITHUB:
                return gitRepos.filter(gitRepo => gitRepo.permissions?.push);
            case interfaces_1.GitProvider.GITLAB:
                return gitRepos.filter(gitRepo => {
                    const { permissions } = gitRepo;
                    const projectAccessLevel = permissions.project_access.access_level;
                    const groupAccessLevel = permissions.group_access?.access_level || 0;
                    const pushMinLevel = this.gitService.GITLAB_ACCESS_LEVEL.DEVELOPER;
                    return projectAccessLevel >= pushMinLevel || groupAccessLevel >= pushMinLevel;
                });
            default:
                return gitRepos;
        }
    }
    isAdminOfGitRepo(gitRepo) {
        switch (this.provider) {
            case interfaces_1.GitProvider.GITHUB:
                return gitRepo.permissions?.admin;
            case interfaces_1.GitProvider.GITLAB: {
                const { permissions } = gitRepo;
                // This should always come, but in case something happens and we don't get this object, we just return false
                if (!permissions) {
                    return false;
                }
                const gitlabService = this.gitService;
                const projectAccessLevel = permissions.project_access.access_level;
                const groupAccessLevel = permissions.group_access?.access_level || 0;
                const projectRole = gitlabService.convertAccessLevelToGuardRailsRole(projectAccessLevel);
                const groupRole = gitlabService.convertAccessLevelToGuardRailsRole(groupAccessLevel);
                return projectRole === interfaces_1.UserRoleName.ADMIN || groupRole === interfaces_1.UserRoleName.ADMIN;
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
    async syncRepositories(account, gitRepos) {
        let { repositories } = account;
        if (!repositories) {
            throw new Error('Internal error: Invalid repositories on account');
        }
        // To sync repos, we want to ignore all monorepo's subrepos, since these are not synchronized here.
        repositories = repositories.filter(r => !r.fkParentRepository);
        repositories = await this.repositoriesService.deduplicateRepositories(repositories, account);
        const repositoryIds = { read: [], admin: [] };
        const updatesBatch = [];
        const gitReposToCreate = [];
        const filteredGitRepos = this.filterGitReposByAccessLevel(gitRepos, account);
        const accountIsOnLegacyPlan = (0, subscription_1.isLegacyPlan)(account.subscription.plan.code);
        filteredGitRepos.forEach(gitRepo => {
            const existingRepo = repositories.find(repo => isSame(repo, gitRepo));
            // the normal behavior is that repos should exist
            if (existingRepo) {
                if (this.isAdminOfGitRepo(gitRepo)) {
                    repositoryIds.admin.push(existingRepo.idRepository);
                }
                else {
                    repositoryIds.read.push(existingRepo.idRepository);
                }
                // check for update behavior, only for GL and BBDC
                if ((0, repository_1.shouldUpdateRepository)(existingRepo, gitRepo, this.provider, accountIsOnLegacyPlan)) {
                    updatesBatch.push({
                        idRepository: existingRepo.idRepository,
                        patch: (0, repository_1.getProviderSpecificFieldsForUpdate)(this.provider, gitRepo, accountIsOnLegacyPlan, existingRepo)
                    });
                }
                // if not, we create them, but this should be normally covered by probot
            }
            else {
                gitReposToCreate.push(gitRepo);
            }
        });
        const [newRepos] = await Promise.all([
            (0, repositories_1.createRepositories)((0, repository_1.populateGitReposToDBRepos)(account, gitReposToCreate, accountIsOnLegacyPlan)),
            (0, repositories_1.updateRepositories)(updatesBatch)
        ]);
        // extra sync for BBDC to get the default branch
        if (this.provider === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
            const gitService = (0, gitServiceFactory_1.gitServiceFactory)(this.user, this.provider);
            (0, bitbucketDataCenter_1.syncDefaultBranches)([...repositories, ...newRepos], gitRepos, account, gitService);
        }
        // add the new repos ids to the repositoryIds arrays
        if (newRepos && newRepos.length) {
            newRepos.forEach(newRepo => {
                const gitRepo = filteredGitRepos.find(filteredGitRepo => isSame(newRepo, filteredGitRepo));
                if (gitRepo && this.isAdminOfGitRepo(gitRepo)) {
                    repositoryIds.admin.push(newRepo.idRepository);
                }
                else {
                    repositoryIds.read.push(newRepo.idRepository);
                }
            });
        }
        return repositoryIds;
    }
    async syncUser(account) {
        const { idAccount } = account;
        const userInDb = await (0, users_1.findUserWithRoleByProviderInternalId)(this.user.providerInternalId, this.user.provider, idAccount);
        if (!userInDb) {
            throw boom_1.default.notFound('User not found.');
        }
        const { idUser, providerInternalId, role: currentUserRole, roleOverwrittenAt } = userInDb;
        const defaultRole = this.roles.find(r => r.name === interfaces_1.UserRoleName.DEVELOPER);
        const gitRole = await this.gitService.getUserRole(account, providerInternalId);
        if (gitRole !== false) {
            const { idRole } = this.roles.find(r => r.name === gitRole) || defaultRole;
            // if the user has no role yet, we create the record, if not we will update if it's different to the current one
            if (!currentUserRole) {
                await (0, users_1.createUserRole)(idUser, idAccount, idRole);
            }
            else if (!roleOverwrittenAt && currentUserRole.idRole !== idRole) {
                await (0, users_1.updateUsersRole)([idUser], idAccount, idRole);
            }
        }
    }
}
exports.default = SyncService;
//# sourceMappingURL=sync.js.map