"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../../config");
const git_1 = __importDefault(require("./git"));
const common_1 = require("../../helpers/common");
const interfaces_1 = require("../../interfaces");
const bitbucketDataCenter_1 = __importDefault(require("./clientWrappers/bitbucketDataCenter"));
const bitbucketDataCenter_2 = require("../../errors/handlers/bitbucketDataCenter");
class BitbucketDataCenterService extends git_1.default {
    WEBHOOK_NAME;
    clientWrapper;
    constructor(accessToken, nickname, accessTokenSecret) {
        super(accessToken, nickname);
        this.WEBHOOK_NAME = 'Guardrails';
        this.clientWrapper = new bitbucketDataCenter_1.default(accessToken, accessTokenSecret);
    }
    async getUser() {
        // The username and user id of the authenticated user can be found in the response headers on any api request made to the Bitbucket data center server.
        // We choose to make a call to "application-properties" because this endpoint never fails and it doesn't put a load on the server.
        // https://community.developer.atlassian.com/t/obtain-authorised-users-username-from-api/24422/2
        const { headers } = await this.clientWrapper.asUser().get('/application-properties', undefined);
        if (!headers['x-ausername']) {
            throw new Error('Expected to find header "x-ausername" on response from Bitbucket data center.');
        }
        if (!headers['x-auserid']) {
            throw new Error('Expected to find header "x-auserid" on response from Bitbucket data center.');
        }
        const username = decodeURIComponent(headers['x-ausername']);
        const userId = headers['x-auserid'];
        let users;
        try {
            users = await this.clientWrapper.asUser().getCollection('/users', {
                filter: username
            });
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getUser');
        }
        const filteredUsers = users.filter((user) => user.id === Number(userId));
        if (filteredUsers.length === 0) {
            throw new Error(`Couldn't find authenticated user with username '${username}' and id '${userId}'.`);
        }
        if (filteredUsers.length === 1) {
            return filteredUsers[0];
        }
        throw new Error(`Found more than one user with the id ${userId}.`);
    }
    async getRepositories(params) {
        if (!params.projectKey) {
            throw new Error("Can't fetch BBDC repositories without providerMetadata.projectKey.");
        }
        try {
            return await this.clientWrapper
                .asUser()
                .getCollection(`/projects/${params.projectKey}/repos`, undefined);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getRepositories');
        }
    }
    async enableDisableOnBitbucketDataCenter(repo, isEnabled) {
        try {
            if (isEnabled) {
                await this._deleteExistingWebhooks(repo);
                await this._createWebhook(repo);
            }
            else {
                await this._deleteExistingWebhooks(repo);
            }
        }
        catch (e) {
            (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'enableDisableOnBitbucketDataCenter');
        }
    }
    async _createWebhook(repo) {
        const version = await this._getServerVersion();
        const events = ['repo:refs_changed', 'pr:opened'];
        if (version.major >= 7) {
            // Receiving events when a new commit has made to a PR was introduced in version 7.0.0 and greater of Bitbucket server.
            // https://confluence.atlassian.com/bitbucketserver/bitbucket-server-7-0-release-notes-990546638.html
            events.push('pr:from_ref_updated');
        }
        const secret = this._createWebhookSecret(repo);
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        await this.clientWrapper
            .asInstallation()
            .post(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks`, null, {
            name: this.WEBHOOK_NAME,
            events,
            configuration: { secret },
            url: config_1.env.BITBUCKET_DATA_CENTER_WEBHOOKS_ENDPOINT,
            active: true
        });
    }
    async _deleteExistingWebhooks(repo) {
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        const webhooks = await this.findWebhooksByName(repo, this.WEBHOOK_NAME);
        // eslint-disable-next-line no-restricted-syntax
        for (const webhook of webhooks) {
            // eslint-disable-next-line no-await-in-loop
            await this.clientWrapper
                .asInstallation()
                .delete(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks/${webhook.id}`, undefined);
        }
    }
    // eslint-disable-next-line class-methods-use-this
    _createWebhookSecret(repo) {
        if (!repo.providerInternalId) {
            throw new Error("Failed to create webhook secret. Repository doesn't have a providerInternalId defined.");
        }
        const hmac = () => crypto_1.default.createHmac('sha256', config_1.env.BITBUCKET_DATA_CENTER_WEBHOOKS_SECRET);
        return hmac()
            .update(repo.providerInternalId)
            .digest('hex');
    }
    async findWebhooksByName(repo, name) {
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        try {
            const webhooks = await this.clientWrapper
                .asInstallation()
                .getCollection(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/webhooks`, undefined);
            return webhooks.filter((webhook) => webhook.name === name);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'findWebhooksByName');
        }
    }
    async getRepository(repo) {
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        try {
            const { data } = await this.clientWrapper
                .asUser()
                .get(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}`, undefined);
            return data;
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getRepository');
        }
    }
    async getBranches(repo
    // options?: GetBranchesOptions
    ) {
        const fetchBranches = async (client) => {
            // let branches;
            // let totalCount;
            // paginated results
            // if (options && options.offset !== undefined && options.limit !== undefined) {
            //   const {
            //     data
            //   } = await this.clientWrapper.asUser().get(
            //     `/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`,
            //     { start: options.offset, limit: options.limit }
            //   );
            //   branches = data.values;
            //   totalCount = data.size;
            //   // get all
            // } else {
            const branches = await client.getCollection(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`, undefined);
            // totalCount = branches.length;
            // }
            return {
                branches: branches.map((branch) => ({ ...branch, name: branch.displayId })),
                totalCount: 1 // this will basically disable pagination
            };
        };
        try {
            return await this.clientWrapper.installationFallback(fetchBranches);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getBranches');
        }
    }
    async getDefaultBranch(repo) {
        if (!repo.account) {
            throw new Error('Internal error: Repo has no retrieved account from the db.');
        }
        try {
            const version = await this._getServerVersion();
            let branchPath = 'default-branch';
            if (version.major < 7 || (version.major === 7 && version.minor < 5)) {
                branchPath = 'branches/default';
            }
            const { data: { displayId } } = await this.clientWrapper
                .asUser()
                .get(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/${branchPath}`, undefined);
            return displayId;
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterGetDefaultBranchRoleErrorHandler)(e);
        }
    }
    async getUserRole(account, userProviderInternalId) {
        const { type, providerInternalId, providerMetadata } = account;
        if (type === interfaces_1.AccountType.USER && providerInternalId === userProviderInternalId) {
            return interfaces_1.SystemUserRoleName.OWNER;
        }
        let usersWithPermission;
        try {
            usersWithPermission = await this.clientWrapper
                .asUser()
                .getCollection(`/projects/${providerMetadata.projectKey}/permissions/users`, {
                filter: this.nickname
            });
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterGetUserRoleErrorHandler)(e);
        }
        const filteredUsersWithPermission = usersWithPermission.filter((userWithPermission) => String(userWithPermission.user.id) === userProviderInternalId);
        if (filteredUsersWithPermission.length === 1 &&
            filteredUsersWithPermission[0].permission === 'PROJECT_ADMIN') {
            return interfaces_1.UserRoleName.ADMIN;
        }
        // throw new Error(`Found more than one user with the id ${userProviderInternalId}`);
        return false; // no access?
    }
    async getBranch(repo, branchName) {
        const fetchBranch = async (client) => {
            const branches = await client.getCollection(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/branches`, { filterText: branchName });
            const matchingBranch = branches.find((branch) => branch.displayId === branchName);
            if (!matchingBranch) {
                throw new Error(`No branch was found with the name ${branchName}.`);
            }
            return { ...matchingBranch, name: matchingBranch.displayId };
        };
        try {
            return await this.clientWrapper.installationFallback(fetchBranch);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getBranch');
        }
    }
    async getBranchSha(repo, branchName) {
        const branch = await this.getBranch(repo, branchName);
        return branch.latestCommit;
    }
    async getProjects() {
        try {
            return await this.clientWrapper.asUser().getCollection('/projects', undefined);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getProjects');
        }
    }
    async getPersonalProject() {
        const user = await this.getUser();
        if (!user || !user.slug) {
            throw new Error(`Failed to get user slug on user ${JSON.stringify(user)}.`);
        }
        try {
            const { data } = await this.clientWrapper.asUser().get(`/projects/~${user.slug}`, undefined);
            return data;
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getPersonalProject');
        }
    }
    async getContent(repo, ref, path) {
        const fetchContent = async (client) => {
            if (!repo.account.providerMetadata.projectKey || !repo.name) {
                return undefined;
            }
            const { data } = await client.get(`/projects/${repo.account.providerMetadata.projectKey}/repos/${repo.name}/raw/${path}`, {
                at: ref
            });
            return data || undefined;
        };
        try {
            return await this.clientWrapper.installationFallback(fetchContent);
        }
        catch (e) {
            return (0, bitbucketDataCenter_2.bitbucketDataCenterDefaultErrorHandler)(e, 'getContent');
        }
    }
    // eslint-disable-next-line
    async deleteApp(account) {
        throw new Error('Deleting app for Bitbucket data center is not supported.');
    }
    static async refreshAccessToken() {
        throw new Error('refreshAccessToken is not supported');
    }
    async setQueuedStatus(account, repository, sha) {
        if (config_1.env.DISABLE_COMMIT_STATUS) {
            return;
        }
        try {
            const version = await this._getServerVersion();
            // Creating build status is only available on version 7.4 and greater of Bitbucket server.
            if (version.major < 7 || (version.major === 7 && version.minor < 4)) {
                // eslint-disable-next-line no-console
                console.log(`Creating queued status (i.e. build status) is not supported on this version of Bitbucket server (${version.major}.${version.minor}.${version.patch}), skipping...`);
                return;
            }
            await this.clientWrapper.asUser().post(`/projects/${account.providerMetadata.projectKey}/repos/${repository.name}/commits/${sha}/builds`, {
                state: 'INPROGRESS',
                key: `${config_1.constants.botDisplayName}/scan`,
                url: (0, common_1.linkToScan)(account, repository.idRepository, sha),
                description: 'task queued for processing'
            }, undefined);
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log(`BitbucketDataCenterService.setQueuedStatus: Failed to set commit status to ${repository.name}@${sha} (Account ID: ${account.idAccount})`, { error: e });
        }
    }
    async _getServerVersion() {
        const { data } = await this.clientWrapper.asUser().get('/application-properties', undefined);
        const { version } = data;
        if (!version) {
            throw new Error(`Failed to get server version, got ${JSON.stringify(data, null, 2)}.`);
        }
        const parts = version.split('.');
        const major = Number(parts[0]);
        let minor = 0;
        let patch = 0;
        if (parts.length > 1) {
            minor = Number(parts[1]);
        }
        if (parts.length > 2) {
            patch = Number(parts[2]);
        }
        return {
            major,
            minor,
            patch
        };
    }
}
exports.default = BitbucketDataCenterService;
//# sourceMappingURL=bitbucketDataCenter.js.map