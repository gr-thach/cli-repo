"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const bluebird_1 = __importDefault(require("bluebird"));
const interfaces_1 = require("../../interfaces");
const config_1 = require("../../../config");
const git_1 = __importDefault(require("./git"));
const common_1 = require("../../helpers/common");
const cache_1 = __importDefault(require("../cache"));
const gitlab_1 = __importDefault(require("./clientWrappers/gitlab"));
const gitlab_2 = require("../../errors/handlers/gitlab");
const fetchGitlabGroups = async ({ groups = [], header, nextPage = 1 }) => {
    if (!nextPage)
        return groups;
    const { headers, data } = await axios_1.default.get(`${config_1.env.GITLAB_URL}/api/v4/groups`, {
        headers: header,
        params: { per_page: 100, page: nextPage, min_access_level: 30 }
    });
    return fetchGitlabGroups({
        groups: [...data, ...groups],
        header,
        nextPage: Number(headers['x-next-page'])
    });
};
class GitLabService extends git_1.default {
    clientWrapper;
    GITLAB_ACCESS_LEVEL = {
        NO_ACCESS: 0,
        GUEST: 10,
        REPORTER: 20,
        DEVELOPER: 30,
        MAINTAINER: 40,
        OWNER: 50
    };
    constructor(accessToken, nickname) {
        super(accessToken, nickname);
        this.clientWrapper = new gitlab_1.default(this.accessToken);
    }
    // TODO: this should be requested through the gitlab client
    static async getAuthenticatedUser(accessToken) {
        try {
            const { data } = await axios_1.default.get(`${config_1.env.GITLAB_URL}/api/v4/user`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            return data;
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getAuthenticatedUser');
        }
    }
    // TODO: this should be requested through the gitlab client
    static async getGroups(accessToken) {
        try {
            const headers = { Authorization: `Bearer ${accessToken}` };
            return await fetchGitlabGroups({ header: headers });
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getGroups');
        }
    }
    async getUser() {
        return this.clientWrapper.asUser().Users.current();
    }
    async getRepositories(params) {
        if (!params.providerInternalId) {
            throw new Error("Can't fetch Gitlab repositories without providerInternalId.");
        }
        try {
            if (params.type === interfaces_1.AccountType.USER) {
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
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getRepositories');
        }
    }
    async getRepository(repo) {
        try {
            return await this.clientWrapper.asUser().Projects.show(Number(repo.providerInternalId));
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getRepository');
        }
    }
    async getBranches(repo, options) {
        const fetchBranches = async (client) => {
            let branches;
            let totalCount;
            // paginated results
            if (options && options.offset !== undefined && options.limit !== undefined) {
                const cache = new cache_1.default(config_1.env.CACHE_PROVIDER).getInstance();
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
                }
                else {
                    branches = response;
                }
                // get all
            }
            else {
                branches = await client.Branches.all(Number(repo.providerInternalId));
                totalCount = branches.length;
            }
            return { branches, totalCount };
        };
        try {
            return await this.clientWrapper.installationFallback(fetchBranches);
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getBranches');
        }
    }
    async getBranch(repo, branchName) {
        const fetchBranch = async (client) => {
            return client.Branches.show(Number(repo.providerInternalId), branchName);
        };
        try {
            return await this.clientWrapper.installationFallback(fetchBranch);
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getBranch');
        }
    }
    async getBranchSha(repo, branch) {
        const fetchBranchSha = async (client) => {
            const { commit: { id: sha } } = await client.Branches.show(Number(repo.providerInternalId), branch);
            return sha;
        };
        try {
            return await this.clientWrapper.installationFallback(fetchBranchSha);
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getBranchSha');
        }
    }
    convertAccessLevelToGuardRailsRole(accessLevel) {
        switch (accessLevel) {
            case this.GITLAB_ACCESS_LEVEL.OWNER:
            case this.GITLAB_ACCESS_LEVEL.MAINTAINER:
                return interfaces_1.UserRoleName.ADMIN;
            case this.GITLAB_ACCESS_LEVEL.NO_ACCESS:
                return false;
            default:
                return interfaces_1.UserRoleName.DEVELOPER;
        }
    }
    async getUserRole(account, userProviderInternalId) {
        const { type, providerInternalId } = account;
        if (type === interfaces_1.AccountType.USER && providerInternalId === userProviderInternalId) {
            return interfaces_1.SystemUserRoleName.OWNER;
        }
        try {
            const member = await this.clientWrapper
                .asUser()
                .GroupMembers.show(Number(providerInternalId), Number(userProviderInternalId));
            // eslint-disable-next-line no-console
            console.log(`Retrieved access_level = "${member.access_level}" for user with providerInternalId = ${userProviderInternalId} and account with providerInternalId = ${providerInternalId}`);
            return this.convertAccessLevelToGuardRailsRole(member.access_level);
        }
        catch (e) {
            return (0, gitlab_2.gitlabGetUserRoleErrorHandler)(e);
        }
    }
    async getContent(repo, ref, path) {
        const fetchContent = async (client) => {
            if (!repo.account.login || !repo.providerInternalId) {
                return undefined;
            }
            const { content } = await client.RepositoryFiles.show(repo.providerInternalId, path, ref);
            return content ? (0, common_1.base64Decode)(content) : undefined;
        };
        try {
            return await this.clientWrapper.installationFallback(fetchContent);
        }
        catch (e) {
            return (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'getContent');
        }
    }
    async deleteApp(account) {
        // eslint-disable-next-line no-console
        console.log("Gitlab can't delete the App.", {
            nickname: this.nickname,
            accountId: account.idAccount
        });
    }
    async setQueuedStatus(account, repository, sha) {
        if (config_1.env.DISABLE_COMMIT_STATUS) {
            return;
        }
        const context = `${config_1.constants.botDisplayName}/scan`;
        try {
            await this.clientWrapper.asUser().Commits.editStatus(repository.providerInternalId, sha, {
                state: 'pending',
                description: 'task queued for processing',
                context
            });
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(`GitlabService.setQueuedStatus: Failed to set commit status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`, { error: e });
        }
    }
    async addHooksAndMemberToGitlabProjects({ account, repositories }) {
        try {
            const installationClient = await this.clientWrapper.asInstallation();
            const guardRailsUser = await installationClient.Users.current();
            await Promise.all(repositories.map(async (repository) => {
                const currentHooks = await this.clientWrapper
                    .asUser()
                    .ProjectHooks.all(Number(repository.providerInternalId));
                const grHook = currentHooks.find(x => x.url === config_1.env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT);
                if (!grHook) {
                    await this.clientWrapper
                        .asUser()
                        .ProjectHooks.add(Number(repository.providerInternalId), config_1.env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT, {
                        token: account.cliToken,
                        push_events: true,
                        merge_requests_events: true
                    });
                }
                const members = await this.clientWrapper
                    .asUser()
                    .ProjectMembers.all(Number(repository.providerInternalId));
                if (account.type === interfaces_1.AccountType.ORGANIZATION) {
                    members.push(...(await this.clientWrapper
                        .asUser()
                        .GroupMembers.all(Number(account.providerInternalId))));
                }
                const grMember = members.find(x => guardRailsUser ? x.username === guardRailsUser.username : x.username === 'guardrailsio');
                if (!grMember) {
                    await this.clientWrapper
                        .asUser()
                        .ProjectMembers.add(Number(repository.providerInternalId), guardRailsUser.id, 30);
                }
            }));
        }
        catch (e) {
            (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'addHooksAndMemberToGitlabProjects');
        }
    }
    async removeHooksAndMemberFromGitlabProjects({ repositories }) {
        try {
            // We need to create another instance to try to get the "Own user" id (used for on-premise)
            const installationClient = await this.clientWrapper.asInstallation();
            const guardRailsUser = await installationClient.Users.current();
            await bluebird_1.default.map(repositories, async (repository) => {
                const currentHooks = await this.clientWrapper
                    .asUser()
                    .ProjectHooks.all(Number(repository.providerInternalId));
                const grHook = currentHooks.find((x) => x.url === config_1.env.GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT);
                if (grHook) {
                    await this.clientWrapper
                        .asUser()
                        .ProjectHooks.remove(Number(repository.providerInternalId), grHook.id);
                }
                const currentMembers = await this.clientWrapper
                    .asUser()
                    .ProjectMembers.all(Number(repository.providerInternalId));
                const grMember = currentMembers.find((x) => x.id === guardRailsUser.id);
                if (grMember) {
                    await this.clientWrapper
                        .asUser()
                        .ProjectMembers.remove(Number(repository.providerInternalId), grMember.id);
                }
            }, { concurrency: 5 });
        }
        catch (e) {
            (0, gitlab_2.gitlabDefaultErrorHandler)(e, 'removeHooksAndMemberFromGitlabProjects');
        }
    }
}
exports.default = GitLabService;
//# sourceMappingURL=gitlab.js.map