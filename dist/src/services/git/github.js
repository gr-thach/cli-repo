"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_link_header_1 = __importDefault(require("parse-link-header"));
const interfaces_1 = require("../../interfaces");
const config_1 = require("../../../config");
const git_1 = __importDefault(require("./git"));
const common_1 = require("../../helpers/common");
const github_1 = __importDefault(require("./clientWrappers/github"));
const github_2 = require("../../errors/handlers/github");
class GitHubService extends git_1.default {
    clientWrapper;
    constructor(accessToken, nickname) {
        super(accessToken, nickname);
        this.clientWrapper = new github_1.default(this.accessToken);
    }
    async getUserInstallations() {
        try {
            const { client, options } = this.clientWrapper.asUser();
            const response = await client.paginate('GET /user/installations', options);
            if (config_1.env.ENVIRONMENT === 'onpremise') {
                // eslint-disable-next-line no-console
                console.log('paginate -> GET /user/installations', { response: JSON.stringify(response) });
            }
            return response;
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getUserInstallations');
        }
    }
    async getUser() {
        try {
            const { client, options } = this.clientWrapper.asUser();
            const { data } = await client.users.getAuthenticated({
                ...options
            });
            return data;
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getUser');
        }
    }
    async getRepositories(params) {
        if (!params.installationId) {
            throw new Error("Can't fetch Github repositories without installationId.");
        }
        try {
            const { client, options } = this.clientWrapper.asUser();
            const response = await client.paginate(`GET /user/installations/${params.installationId}/repositories`, {
                ...options,
                per_page: 100
            });
            if (config_1.env.ENVIRONMENT === 'onpremise') {
                // eslint-disable-next-line no-console
                console.log(`paginate -> GET /user/installations/${params.installationId}/repositories`, {
                    response: JSON.stringify(response)
                });
            }
            return response;
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getRepositories');
        }
    }
    async getRepository(repo) {
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
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getRepository');
        }
    }
    async getBranches(repo, options) {
        const fetchBranches = async (client, clientOptions) => {
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
                const pagination = (0, parse_link_header_1.default)(response.headers.link);
                branches = response.data;
                const totalPages = pagination?.last?.page ? Number(pagination?.last?.page) : page;
                totalCount = totalPages * options.limit;
                // get all
            }
            else {
                branches = await client.paginate(`GET /repos/${repo.account.login}/${repo.name}/branches`, clientOptions);
                totalCount = branches.length;
            }
            return { branches, totalCount };
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.installationId, fetchBranches);
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getBranches');
        }
    }
    async getBranch(repo, branchName) {
        const fetchBranch = async (client, clientOptions) => {
            const { data } = await client.repos.getBranch({
                ...clientOptions,
                owner: repo.account.login,
                repo: repo.name,
                branch: branchName
            });
            return data;
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.installationId, fetchBranch);
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getBranch');
        }
    }
    async getBranchSha(repo, branchName) {
        const fetchBranchSha = async (client, clientOptions) => {
            const { data: { object: { sha } } } = await client.git.getRef({
                ...clientOptions,
                owner: repo.account.login,
                repo: repo.name,
                ref: `heads/${branchName}`
            });
            return sha;
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.installationId, fetchBranchSha);
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getBranchSha');
        }
    }
    async getUserRole(account, userProviderInternalId) {
        const { type, providerInternalId, login } = account;
        if (type === interfaces_1.AccountType.USER && providerInternalId === userProviderInternalId) {
            return interfaces_1.SystemUserRoleName.OWNER;
        }
        const { client, options } = this.clientWrapper.asUser();
        try {
            const { data: { role } } = await client.orgs.getMembershipForAuthenticatedUser({
                ...options,
                org: login
            });
            // eslint-disable-next-line no-console
            console.log(`Retrieved role = "${role}" for user with providerInternalId = ${userProviderInternalId} and account with providerInternalId = ${providerInternalId}`);
            // so far we know for github it can be "admin" or "member"
            switch (role) {
                case 'admin':
                    return interfaces_1.UserRoleName.ADMIN;
                default:
                    // default is always developer (which is the lowest level role in GR)
                    return interfaces_1.UserRoleName.DEVELOPER;
            }
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.error(`Github Error while trying to retrieve user role for user with providerInternalId = ${userProviderInternalId}`, { e });
            return interfaces_1.UserRoleName.DEVELOPER;
        }
    }
    async getContent(repo, ref, path) {
        const fetchContent = async (client, clientOptions) => {
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
            const { content } = data;
            return content ? (0, common_1.base64Decode)(content) : undefined;
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.installationId, fetchContent);
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getContent');
        }
    }
    async getAllOrgMembers(account) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to fetch the organization members.');
        }
        if (account.type !== interfaces_1.AccountType.ORGANIZATION) {
            throw new Error('Only Organization Accounts can fetch members.');
        }
        try {
            const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
            return await client.paginate(`GET /orgs/${account.login}/members`, {
                ...options,
                per_page: 100
            });
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getAllOrgMembers');
        }
    }
    async getAllOrgTeams(account) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to fetch the organization teams.');
        }
        if (account.type !== interfaces_1.AccountType.ORGANIZATION) {
            throw new Error('Only Organization Accounts can fetch teams.');
        }
        try {
            const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
            return await client.paginate(`GET /orgs/${account.login}/teams`, {
                ...options,
                per_page: 100
            });
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getAllOrgTeams');
        }
    }
    async getATeamBySlug(account, teamSlug) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to fetch the organization team.');
        }
        if (account.type !== interfaces_1.AccountType.ORGANIZATION) {
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
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getATeamBySlug');
        }
    }
    async getTeamMembers({ account, team, role }) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to fetch the team members.');
        }
        if (account.type !== interfaces_1.AccountType.ORGANIZATION) {
            throw new Error('Only Organization Accounts can fetch the team members.');
        }
        try {
            const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
            const response = await client.paginate(`GET /orgs/${account.login}/teams/${team.slug}/members`, {
                ...options,
                role
            });
            return response.map(member => ({ ...member, teamId: team.id }));
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getTeamMembers');
        }
    }
    async getTeamRepositories(account, team) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to fetch the team repositories.');
        }
        if (account.type !== interfaces_1.AccountType.ORGANIZATION) {
            throw new Error('Only Organization Accounts can fetch the team repositories.');
        }
        try {
            const { client, options } = await this.clientWrapper.asInstallation(account.installationId);
            const response = await client.paginate(`GET /orgs/${account.login}/teams/${team.slug}/repos`, options);
            return response.map(repo => ({ ...repo, teamId: team.id }));
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'getTeamRepositories');
        }
    }
    async deleteApp(account) {
        if (!account.installationId) {
            throw new Error('Account has no installationId to properly uninstall the Github App.');
        }
        try {
            const { client, options } = this.clientWrapper.asApplication();
            return await client.apps.deleteInstallation({
                ...options,
                installation_id: account.installationId
            });
        }
        catch (e) {
            return (0, github_2.githubDefaultErrorHandler)(e, 'deleteApp');
        }
    }
    async setQueuedStatus(account, repository, sha) {
        if (config_1.env.DISABLE_COMMIT_STATUS) {
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
                context: `${config_1.constants.botDisplayName}/scan`,
                description: 'task queued for processing',
                target_url: (0, common_1.linkToScan)(account, repository.idRepository, sha)
            });
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(`GithubService.setQueuedStatus: Failed to set queued status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`, { error: e });
        }
    }
}
exports.default = GitHubService;
//# sourceMappingURL=github.js.map