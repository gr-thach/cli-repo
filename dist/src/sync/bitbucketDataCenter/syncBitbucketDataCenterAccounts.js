"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const account_1 = __importDefault(require("../../helpers/account"));
const interfaces_1 = require("../../interfaces");
const config_1 = require("../../../config");
const assertBitbucketDataCenter_1 = require("../../helpers/assertBitbucketDataCenter");
const accounts_1 = require("../../helpers/core-api/accounts");
const permissions_1 = require("../../helpers/core-api/permissions");
class SyncBitbucketDataCenter {
    user;
    accountHelper;
    constructor(user) {
        if (!user) {
            throw new Error('User is not defined');
        }
        this.user = user;
        this.accountHelper = new account_1.default(interfaces_1.GitProvider.BITBUCKET_DATA_CENTER, user);
    }
    async sync(projects, personalProject) {
        await this._syncOrganizationProjects(projects);
        await this._syncPersonalProject(personalProject);
    }
    async _syncPersonalProject(personalProject) {
        (0, assertBitbucketDataCenter_1.assertIsBitbucketPersonalProject)(personalProject);
        let userAccount = await this._findPersonalProjectAccount(personalProject);
        if (userAccount) {
            // Make sure that the account we got from the database is the same as the Bitbucket data center user project that were looking for, just to be safe.
            (0, assertBitbucketDataCenter_1.assertAccountMatchesPersonalProject)(userAccount, personalProject);
            await this._updatePersonalProjectAccountIfNeeded(userAccount, personalProject);
        }
        else {
            await this._createPersonalProjectAccount(personalProject);
            userAccount = await this._findPersonalProjectAccount(personalProject);
        }
        if (!userAccount) {
            throw new Error(`Expected to find one account (of type user) after creation/update, but got none. User project ${personalProject.id}.`);
        }
        (0, assertBitbucketDataCenter_1.assertAccountMatchesPersonalProject)(userAccount, personalProject);
    }
    async _updatePersonalProjectAccountIfNeeded(account, personalProject) {
        if (this._hasPersonalProjectDataChanged(account, personalProject)) {
            await this._updatePersonalProjectAccount(account, personalProject);
            return true;
        }
        return false;
    }
    // eslint-disable-next-line class-methods-use-this
    _hasPersonalProjectDataChanged(account, personalProject) {
        return (account.login !== personalProject.name ||
            account.providerMetadata.projectKey !== personalProject.key);
    }
    // eslint-disable-next-line class-methods-use-this
    _updatePersonalProjectAccount(account, personalProject) {
        // Do a last sanity check so we don't accedentially update the wrong Bitbucket data center account.
        (0, assertBitbucketDataCenter_1.assertIsBitbucketPersonalProject)(personalProject);
        (0, assertBitbucketDataCenter_1.assertAccountMatchesPersonalProject)(account, personalProject);
        return (0, accounts_1.updateAccount)(account.idAccount, {
            login: personalProject.name,
            providerMetadata: {
                projectKey: personalProject.key,
                ownerId: personalProject.owner.id
            }
        });
    }
    async _createPersonalProjectAccount(personalProject) {
        // Do a last sanity checks so we don't accedentially create an invalid Bitbucket data center "user project" account by misstake.
        (0, assertBitbucketDataCenter_1.assertIsBitbucketPersonalProject)(personalProject);
        // Check so we don't accedentially create duplicate accounts.
        if (await this._doesAccountExist(personalProject.id, interfaces_1.AccountType.USER, interfaces_1.GitProvider.BITBUCKET_DATA_CENTER)) {
            throw new Error(`Failed to create Bitbucket data center user account (${personalProject.id}), account already exist with providerInternalId ${personalProject.id}.`);
        }
        const hmacForCliToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_CLI_TOKEN_SECRET);
        const account = await (0, accounts_1.createAccount)({
            login: personalProject.name,
            providerMetadata: {
                projectKey: personalProject.key,
                ownerId: personalProject.owner.id
            },
            type: interfaces_1.AccountType.USER,
            provider: interfaces_1.GitProvider.BITBUCKET_DATA_CENTER,
            providerInternalId: String(personalProject.id),
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON(),
            cliToken: hmacForCliToken()
                .update((0, uuid_1.v4)())
                .digest('hex')
        });
        await this.accountHelper.bulkCreateAccountsSubscriptions([account]);
        await (0, permissions_1.createPolicyForAccounts)([account.idAccount]);
    }
    // eslint-disable-next-line class-methods-use-this
    async _findPersonalProjectAccount(personalProject) {
        const providerInternalId = String(personalProject.id);
        return (0, accounts_1.findBaseAccountByProviderInternalId)(providerInternalId, interfaces_1.GitProvider.BITBUCKET_DATA_CENTER, interfaces_1.AccountType.USER);
    }
    async _syncOrganizationProjects(projects) {
        (0, assertBitbucketDataCenter_1.assertIsBitbucketOrgProjects)(projects);
        const accounts = await this._getAccountsFromProjects(projects);
        await this._bulkCreateIfNeededFromProjects(projects, accounts);
        await this._bulkUpdateIfNeededFromProjects(projects, accounts);
    }
    async _bulkUpdateIfNeededFromProjects(projects, accounts) {
        const updates = [];
        projects.forEach(project => {
            const account = accounts.find(acc => acc.providerInternalId === String(project.id));
            if (account && this._hasProjectDataChanged(project, account)) {
                updates.push(this._updateProjectAccount(project, account));
            }
        });
        await Promise.all(updates);
    }
    // eslint-disable-next-line class-methods-use-this
    _hasProjectDataChanged(project, account) {
        return account.login !== project.name || account.providerMetadata.projectKey !== project.key;
    }
    // eslint-disable-next-line class-methods-use-this
    _updateProjectAccount(project, account) {
        // Do a sanity checks so we don't accedentially update the wrong Bitbucket data center account.
        (0, assertBitbucketDataCenter_1.assertIsBitbucketOrgProject)(project);
        (0, assertBitbucketDataCenter_1.assertAccountMatchesOrgProject)(account, project);
        return (0, accounts_1.updateAccount)(account.idAccount, {
            login: project.name,
            providerMetadata: {
                projectKey: project.key
            }
        });
    }
    // eslint-disable-next-line class-methods-use-this
    async _getAccountsFromProjects(projects) {
        const providerInternalIds = projects.map(project => String(project.id));
        const accounts = await (0, accounts_1.findBaseAccountsByProviderInternalIds)(providerInternalIds, interfaces_1.GitProvider.BITBUCKET_DATA_CENTER, interfaces_1.AccountType.ORGANIZATION);
        // Check that the list of accounts actually matches the projects that we were looking for.
        // So we didn't accidentally retrieved the wrong accounts from the database.
        (0, assertBitbucketDataCenter_1.assertAccountsHasMatchingOrgProject)(accounts, projects);
        return accounts;
    }
    async _bulkCreateIfNeededFromProjects(projects, accounts) {
        // eslint-disable-next-line no-restricted-syntax
        for (const project of projects) {
            const account = accounts.find(acc => acc.providerInternalId === String(project.id));
            if (!account) {
                // eslint-disable-next-line no-await-in-loop
                await this._createProjectAccount(project);
            }
        }
    }
    async _createProjectAccount(project) {
        // Do a last sanity check so we don't accedentially create an invalid project account by misstake.
        (0, assertBitbucketDataCenter_1.assertIsBitbucketOrgProject)(project);
        // This is just an extra fail-safe so we don't accidentally create duplicate accounts,
        if (await this._doesAccountExist(project.id, interfaces_1.AccountType.ORGANIZATION, interfaces_1.GitProvider.BITBUCKET_DATA_CENTER)) {
            throw new Error(`Failed to create Bitbucket account, account already exist with providerInternalId ${project.id}.`);
        }
        const hmacForCliToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_CLI_TOKEN_SECRET);
        const account = await (0, accounts_1.createAccount)({
            login: project.name,
            providerMetadata: {
                projectKey: project.key
            },
            type: interfaces_1.AccountType.ORGANIZATION,
            provider: interfaces_1.GitProvider.BITBUCKET_DATA_CENTER,
            providerInternalId: String(project.id),
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON(),
            cliToken: hmacForCliToken()
                .update((0, uuid_1.v4)())
                .digest('hex')
        });
        await this.accountHelper.bulkCreateAccountsSubscriptions([account]);
        await (0, permissions_1.createPolicyForAccounts)([account.idAccount]);
    }
    // eslint-disable-next-line class-methods-use-this
    async _doesAccountExist(projectId, type, provider) {
        const account = await (0, accounts_1.findBaseAccountByProviderInternalId)(String(projectId), provider, type);
        return !!account;
    }
}
exports.default = SyncBitbucketDataCenter;
//# sourceMappingURL=syncBitbucketDataCenterAccounts.js.map