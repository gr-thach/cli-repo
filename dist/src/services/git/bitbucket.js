"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const get_1 = __importDefault(require("lodash/get"));
const url_1 = require("url");
const config_1 = require("../../../config");
const git_1 = __importDefault(require("./git"));
const common_1 = require("../../helpers/common");
const assertBitbucket_1 = require("../../helpers/assertBitbucket");
const interfaces_1 = require("../../interfaces");
const bitbucket_1 = __importDefault(require("./clientWrappers/bitbucket"));
const bitbucket_2 = require("../../errors/handlers/bitbucket");
class BitbucketService extends git_1.default {
    clientWrapper;
    constructor(accessToken, nickname) {
        super(accessToken, nickname);
        this.clientWrapper = new bitbucket_1.default(this.accessToken);
    }
    async getUser() {
        try {
            const { data } = await this.clientWrapper.asUser().user.get({});
            return data;
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getUser');
        }
    }
    async getRepositories(params) {
        if (!params.providerInternalId) {
            throw new Error("Can't fetch Bitbucket repositories without providerInternalId.");
        }
        try {
            return await this._getAll(this.clientWrapper.asUser().repositories.list({ workspace: params.providerInternalId }));
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getRepositories');
        }
    }
    async getRepository(repo) {
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        try {
            const { data } = await this.clientWrapper.asUser().repositories.get({
                repo_slug: repo.providerInternalId,
                workspace: repo.account.providerInternalId
            });
            return data;
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getRepository');
        }
    }
    async getBranches(repo, options) {
        const fetchBranches = async (client) => {
            let branches;
            let totalCount;
            // paginated results
            if (options && options.offset !== undefined && options.limit !== undefined) {
                const page = Math.floor(options.offset / options.limit) + 1;
                const { data: { values, size } } = await client.refs.listBranches({
                    repo_slug: repo.providerInternalId,
                    workspace: repo.account.providerInternalId,
                    page: String(page),
                    pagelen: options.limit
                });
                branches = values;
                totalCount = size;
                // get all
            }
            else {
                branches = await this._getAll(client.refs.listBranches({
                    repo_slug: repo.providerInternalId,
                    workspace: repo.account.providerInternalId
                }));
                totalCount = branches.length;
            }
            return { branches, totalCount };
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.providerInternalId, fetchBranches);
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getBranches');
        }
    }
    async getUserRole(account, userProviderInternalId) {
        const { type, providerInternalId } = account;
        if (type === interfaces_1.AccountType.USER && providerInternalId === userProviderInternalId) {
            return interfaces_1.SystemUserRoleName.OWNER;
        }
        // TODO: Review if we need this "if", what happens if the account is type "User" but the logged in user is not the same? Can that happen
        if (type === interfaces_1.AccountType.ORGANIZATION) {
            let permissions;
            try {
                const { data } = await axios_1.default.get(`${config_1.env.BITBUCKET_API_URL}/user/permissions/workspaces`, {
                    headers: { Authorization: `Bearer ${this.accessToken}` },
                    params: {
                        q: `workspace.uuid="${providerInternalId}"`
                    }
                });
                permissions = data;
            }
            catch (e) {
                return (0, bitbucket_2.bitbucketGetUserRoleErrorHandler)(e);
            }
            if (!permissions || !permissions.values || permissions.values.length === 0) {
                throw new Error(`Got no bitbucket permission for workspace ${providerInternalId}.`);
            }
            if (permissions.values.length > 1) {
                throw new Error(`Expected to get one result from bitbucket when filtering on one workspace but got ${permissions.values.length} results for workspace ${providerInternalId}.`);
            }
            const permission = permissions.values[0];
            if (permission.workspace.uuid !== providerInternalId) {
                throw new Error(`Got permission for another bitbucket account than the one we filtered on ${providerInternalId}.`);
            }
            if (!permission.permission) {
                throw new Error(`Found no permission attr on permission object for bitbucket workspace ${providerInternalId}.`);
            }
            // Permission can be either owner, collaborator or member
            // https://developer.atlassian.com/bitbucket/api/2/reference/resource/workspaces/%7Bworkspace%7D/permissions
            switch (permission.permission) {
                case 'owner':
                    return interfaces_1.UserRoleName.ADMIN;
                default:
                    return interfaces_1.UserRoleName.DEVELOPER;
            }
        }
        return interfaces_1.UserRoleName.DEVELOPER;
    }
    async getBranch(repo, branchName) {
        const fetchBranch = async (client) => {
            const { data } = await client.refs.getBranch({
                name: branchName,
                repo_slug: repo.providerInternalId,
                workspace: repo.account.providerInternalId
            });
            return data;
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.providerInternalId, fetchBranch);
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getBranch');
        }
    }
    async getBranchSha(repo, branchName) {
        try {
            const branch = await this.getBranch(repo, branchName);
            return branch?.target?.hash || ''; // TODO: what happens if we don't find the hash?
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getBranchSha');
        }
    }
    async getWorkspaces() {
        try {
            return await this._getAll(this.clientWrapper.asUser().workspaces.getWorkspaces({}));
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getWorkspaces');
        }
    }
    async getContent(repo, ref, path) {
        const fetchContent = async (client) => {
            if (!repo.account.providerInternalId || !repo.providerInternalId) {
                return undefined;
            }
            const { data } = await client.source.read({
                node: ref,
                path,
                workspace: repo.account.providerInternalId,
                repo_slug: repo.providerInternalId
            });
            return data || undefined;
        };
        try {
            return await this.clientWrapper.installationFallback(repo.account.providerInternalId, fetchContent);
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'getContent');
        }
    }
    async deleteApp(account) {
        // eslint-disable-next-line no-console
        console.log("Bitbucket can't delete the App.", {
            nickname: this.nickname,
            accountId: account.idAccount
        });
    }
    static async refreshAccessToken(refreshToken) {
        let accessToken;
        try {
            const bodyFormData = new url_1.URLSearchParams();
            bodyFormData.append('refresh_token', refreshToken);
            bodyFormData.append('grant_type', 'refresh_token');
            const response = await (0, axios_1.default)({
                method: 'post',
                url: `${config_1.env.BITBUCKET_SITE_URL}/site/oauth2/access_token`,
                auth: {
                    username: config_1.env.BITBUCKET_OAUTH_CLIENT_ID,
                    password: config_1.env.BITBUCKET_OAUTH_CLIENT_SECRET
                },
                data: bodyFormData,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            accessToken = (0, get_1.default)(response, 'data.access_token');
        }
        catch (e) {
            return (0, bitbucket_2.bitbucketDefaultErrorHandler)(e, 'refreshAccessToken');
        }
        if (!accessToken) {
            throw new Error("Didn't receive a new access token when calling Bitbucket to refresh access token.");
        }
        return accessToken;
    }
    async setQueuedStatus(account, repository, sha) {
        if (config_1.env.DISABLE_COMMIT_STATUS) {
            return;
        }
        try {
            await this.clientWrapper.asUser().repositories.createCommitBuildStatus({
                _body: {
                    type: '',
                    state: 'INPROGRESS',
                    key: `${config_1.constants.botDisplayName}/scan`,
                    url: (0, common_1.linkToScan)(account, repository.idRepository, sha),
                    description: 'task queued for processing'
                },
                node: sha,
                repo_slug: repository.providerInternalId,
                workspace: account.providerInternalId
            });
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(`Failed to set queued status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`, { error: e });
        }
    }
    async _getAll(req) {
        const { data } = await req;
        const { values } = data;
        (0, assertBitbucket_1.assertIsValidPaginationResponse)(data);
        if (!this.clientWrapper.asUser().hasNextPage(data)) {
            return values;
        }
        // Get data for the rest of the pages.
        const nextPageValues = await this._getAll(this.clientWrapper.asUser().getNextPage(data));
        return values.concat(nextPageValues);
    }
}
exports.default = BitbucketService;
//# sourceMappingURL=bitbucket.js.map