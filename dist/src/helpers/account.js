"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../config");
const accounts_1 = require("./core-api/accounts");
const subscriptions_1 = require("./core-api/subscriptions");
const subscriptionChangelogs_1 = require("./core-api/subscriptionChangelogs");
const plans_1 = require("./core-api/plans");
const users_1 = require("./core-api/users");
const assertGitlab_1 = require("./assertGitlab");
const interfaces_1 = require("../interfaces");
const permissions_1 = require("./core-api/permissions");
const gitlabAvatarUrl = (group) => {
    let avatar_url = group.avatar_url || '';
    if (avatar_url && !avatar_url.match(/https:\/\//)) {
        avatar_url = `${config_1.env.GITLAB_URL}${avatar_url}`;
    }
    return avatar_url;
};
class AccountHelper {
    provider;
    user;
    constructor(provider, user) {
        if (!provider) {
            throw new Error(`Invalid provider ${provider}`);
        }
        if (!user) {
            throw new Error('Invalid user');
        }
        this.provider = provider;
        this.user = user;
    }
    async bulkCreateFromGithubInstallations(installations) {
        if (this.provider !== interfaces_1.GitProvider.GITHUB) {
            throw new Error('bulkCreateFromGithubInstallations only works for provider = GITHUB');
        }
        const hmacForCliToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_CLI_TOKEN_SECRET);
        const accounts = await (0, accounts_1.createAccounts)(installations.map(({ id, account }) => ({
            login: account.login,
            type: account.type.toUpperCase(),
            provider: interfaces_1.GitProvider.GITHUB,
            installationId: id,
            providerInternalId: String(account.id),
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON(),
            cliToken: hmacForCliToken()
                .update(String(account.id))
                .digest('hex')
        })));
        await this.bulkCreateAccountsSubscriptions(accounts);
        await (0, permissions_1.createPolicyForAccounts)(accounts.map(a => a.idAccount));
    }
    async syncGitlabGroups(groups) {
        groups.forEach(group => (0, assertGitlab_1.assertIsGitlabGroup)(group));
        const groupIds = groups.map(group => group.id);
        let accounts = await this.getGitlabOrganizationAccountsForSync(groupIds);
        // Check that the list of accounts actually matches the Gitlab groups that we were looking for.
        // So we didn't accidentally retrieved the wrong accounts from the database.
        (0, assertGitlab_1.assertHasMatchingGitlabGroup)(accounts, groups);
        const groupsInDb = [];
        const groupsNotInDb = [];
        groups.forEach(group => {
            if (accounts.find(acc => acc.providerInternalId === String(group.id))) {
                groupsInDb.push(group);
            }
            else {
                groupsNotInDb.push(group);
            }
        });
        if (groupsNotInDb.length) {
            await this._bulkCreateFromGitlabGroups(groupsNotInDb);
        }
        if (groupsInDb.length) {
            await this._bulkUpdateIfNeededFromGitlabGroups(groupsInDb, accounts);
        }
        // Get the new/updated list of accounts and set the fkParentAccount
        accounts = await this.getGitlabOrganizationAccountsForSync(groupIds);
        (0, assertGitlab_1.assertHasMatchingGitlabGroup)(accounts, groups);
        await this._bulkUpdateAccountsFkParentAccount(groups, accounts);
    }
    // eslint-disable-next-line class-methods-use-this
    async getGitlabOrganizationAccountsForSync(providerInternalIds) {
        const providerInternalIdStrings = providerInternalIds.map(providerInternalId => {
            if (typeof providerInternalId !== 'number') {
                throw new Error(`providerInternalId should be a number, got ${typeof providerInternalId}.`);
            }
            return String(providerInternalId);
        });
        // we get accounts without subscription when synchronizing because their parent account id is not yet set
        return (0, accounts_1.findBaseAccountsByProviderInternalIds)(providerInternalIdStrings, interfaces_1.GitProvider.GITLAB, interfaces_1.AccountType.ORGANIZATION);
    }
    async _bulkCreateFromGitlabGroups(groups) {
        return Promise.all(groups.map(group => this._createGitlabGroupAccount(group)));
    }
    async _createGitlabGroupAccount(group) {
        // Do a last sanity check so we don't accedentially create an invalid Gitlab group account by misstake.
        (0, assertGitlab_1.assertIsGitlabGroup)(group);
        if (this.provider !== interfaces_1.GitProvider.GITLAB) {
            throw new Error('_createGitlabGroupAccount only works for provider = GITLAB');
        }
        // This is just an extra fail-safe so we don't accidentally create duplicate accounts,
        if (await this._doesAccountExist(group.id, interfaces_1.AccountType.ORGANIZATION, interfaces_1.GitProvider.GITLAB)) {
            throw new Error(`Failed to create Gitlab group account, account already exist with providerInternalId ${group.id}.`);
        }
        const hmacForCliToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_CLI_TOKEN_SECRET);
        const account = await (0, accounts_1.createAccount)({
            login: this._getLoginFromGitlabGroup(group),
            type: interfaces_1.AccountType.ORGANIZATION,
            provider: interfaces_1.GitProvider.GITLAB,
            providerInternalId: String(group.id),
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON(),
            cliToken: hmacForCliToken()
                .update(String(group.id))
                .digest('hex')
        });
        // When a GitLab Group has a parent group, the subscription will be created only on the root group
        if (!group.parent_id) {
            await this.bulkCreateAccountsSubscriptions([account]);
        }
        await (0, permissions_1.createPolicyForAccounts)([account.idAccount]);
        return account;
    }
    // eslint-disable-next-line class-methods-use-this
    _getLoginFromGitlabGroup(group) {
        if (!group || (!group.full_path && !group.path)) {
            throw new Error(`Couldn't get login based on Gitlab group. Gitlab group didn't contain full_path nor path. Gitlab group was ${JSON.stringify(group, null, 2)}`);
        }
        // full_path is only available on groups and not on user accounts.
        // We need to encode the full_path in case it is a sub-group because then the full_path is 'root-group/my-sub-group'.
        return group.full_path ? encodeURIComponent(group.full_path) : group.path;
    }
    async _bulkUpdateIfNeededFromGitlabGroups(groups, accounts) {
        const updates = [];
        groups.forEach(group => {
            const account = accounts.find(acc => acc.providerInternalId === String(group.id));
            if (!account) {
                throw new Error(`Found no matching account for Gitlab group with id '${group.id}'.`);
            }
            if (this._hasGitlabGroupDataChanged(group, account)) {
                updates.push(this._updateGitlabGroupAccount(group, account));
            }
        });
        await Promise.all(updates);
        return updates.length > 0;
    }
    _updateGitlabGroupAccount(group, account) {
        // Do a last sanity checks so we don't accedentially update the wrong Gitlab group account.
        (0, assertGitlab_1.assertIsGitlabGroup)(group);
        (0, assertGitlab_1.assertAccountMatchesGitlabGroup)(account, group);
        if (this.provider !== interfaces_1.GitProvider.GITLAB) {
            throw new Error('updateGitlabGroupAccount only works for provider = GITLAB');
        }
        return (0, accounts_1.updateAccount)(account.idAccount, {
            login: this._getLoginFromGitlabGroup(group)
        });
    }
    // eslint-disable-next-line class-methods-use-this
    async _bulkUpdateAccountsFkParentAccount(groups, accounts) {
        const updates = [];
        const groupIdsParentIds = new Map(groups.map(group => [group.id, group.parent_id]));
        const accountIdsProviderInternalIds = new Map(
        // We use Number() here because this is for GitLab, and GitLab ids are numeric
        accounts.map(account => [Number(account.providerInternalId), account.idAccount]));
        accounts.forEach(account => {
            const gitlabGroupParentId = groupIdsParentIds.get(Number(account.providerInternalId));
            if (gitlabGroupParentId) {
                const fkParentAccount = accountIdsProviderInternalIds.get(gitlabGroupParentId);
                if (fkParentAccount && account.fkParentAccount !== fkParentAccount) {
                    updates.push((0, accounts_1.updateAccount)(account.idAccount, { fkParentAccount }));
                }
            }
        });
        await Promise.all(updates);
        return updates.length > 0;
    }
    // eslint-disable-next-line class-methods-use-this
    async _doesAccountExist(providerInternalId, type, provider) {
        if (typeof providerInternalId !== 'number') {
            throw new Error(`Expected providerInternalId to be of type number, got ${typeof providerInternalId}.`);
        }
        const account = await (0, accounts_1.findBaseAccountByProviderInternalId)(String(providerInternalId), provider, type);
        return !!account;
    }
    _hasGitlabGroupDataChanged(group, account) {
        return account.login !== this._getLoginFromGitlabGroup(group);
    }
    async _createGitlabUserAccount(gitlabUser) {
        // Do a last sanity checks so we don't accedentially create an invalid Gitlab user account by misstake.
        (0, assertGitlab_1.assertIsGitlabUser)(gitlabUser);
        if (this.provider !== interfaces_1.GitProvider.GITLAB) {
            throw new Error('BulkCreateFromGitlabGroups only works for provider = GITLAB');
        }
        // Check so we don't accedentially create duplicate accounts.
        if (await this._doesAccountExist(gitlabUser.id, interfaces_1.AccountType.USER, interfaces_1.GitProvider.GITLAB)) {
            throw new Error(`Failed to create Gitlab user account (${gitlabUser.id}), account already exist with providerInternalId ${gitlabUser.id}.`);
        }
        const hmacForCliToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_CLI_TOKEN_SECRET);
        const account = await (0, accounts_1.createAccount)({
            login: gitlabUser.username,
            type: interfaces_1.AccountType.USER,
            provider: interfaces_1.GitProvider.GITLAB,
            providerInternalId: String(gitlabUser.id),
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON(),
            cliToken: hmacForCliToken()
                .update(String(gitlabUser.id))
                .digest('hex')
        });
        await this.bulkCreateAccountsSubscriptions([account]);
        await (0, permissions_1.createPolicyForAccounts)([account.idAccount]);
        return account;
    }
    async syncGitlabUser(gitlabUser) {
        (0, assertGitlab_1.assertIsGitlabUser)(gitlabUser);
        let userAccount = await this._findGitlabUserAccount(gitlabUser.id);
        if (userAccount) {
            // Make sure that the account we got from the database is the same as the Gitlab user that were looking for, just to be safe.
            (0, assertGitlab_1.assertAccountMatchesGitlabUser)(userAccount, gitlabUser);
            await this._updateGitlabUserAccountIfNeeded(gitlabUser, userAccount);
        }
        else {
            await this._createGitlabUserAccount(gitlabUser);
            userAccount = await this._findGitlabUserAccount(gitlabUser.id);
        }
        if (!userAccount) {
            throw new Error(`Expected to find one account (of type user) after creation/update, but got none. Gitlab user ${gitlabUser.id}.`);
        }
        (0, assertGitlab_1.assertAccountMatchesGitlabUser)(userAccount, gitlabUser);
    }
    // eslint-disable-next-line class-methods-use-this
    async _findGitlabUserAccount(providerInternalId) {
        if (!providerInternalId) {
            throw new Error('providerInternalId is not defined');
        }
        return (0, accounts_1.findBaseAccountByProviderInternalId)(String(providerInternalId), interfaces_1.GitProvider.GITLAB, interfaces_1.AccountType.USER);
    }
    async _updateGitlabUserAccountIfNeeded(gitlabUser, account) {
        if (this._hasGitlabUserDataChanged(gitlabUser, account)) {
            await this._updateGitlabUserAccount(gitlabUser, account);
            return true;
        }
        return false;
    }
    // eslint-disable-next-line class-methods-use-this
    _hasGitlabUserDataChanged(gitlabUser, account) {
        return account.login !== gitlabUser.username;
    }
    _updateGitlabUserAccount(gitlabUser, account) {
        // Do a last sanity check so we don't accedentially update the wrong Gitlab user account.
        (0, assertGitlab_1.assertIsGitlabUser)(gitlabUser);
        (0, assertGitlab_1.assertAccountMatchesGitlabUser)(account, gitlabUser);
        if (this.provider !== interfaces_1.GitProvider.GITLAB) {
            throw new Error('updateGitlabUserAccount only works for provider = GITLAB');
        }
        return (0, accounts_1.updateAccount)(account.idAccount, {
            login: gitlabUser.username
        });
    }
    async bulkCreateAccountsSubscriptions(accounts) {
        const userInDb = await (0, users_1.findUserByProviderInternalId)(this.user.providerInternalId, this.user.provider);
        const freePlan = await (0, plans_1.findPlanByCode)(interfaces_1.PlanCode.FREE);
        const interval = interfaces_1.SubscriptionInterval.YEARLY;
        await (0, subscriptions_1.createSubscriptions)(accounts.map(a => ({
            fkAccount: a.idAccount,
            fkPlan: freePlan.idPlan,
            interval,
            createdAt: new Date().toJSON(),
            updatedAt: new Date().toJSON()
        })));
        await (0, subscriptionChangelogs_1.createSubscriptionChangelogs)(accounts.map(a => ({
            fkAccount: a.idAccount,
            fkPlan: freePlan.idPlan,
            fkUser: userInDb ? userInDb.idUser : undefined,
            subscriptionStatus: 'active',
            subscriptionEvent: 'created',
            subscriptionInterval: interval,
            createdAt: new Date().toJSON()
        })));
    }
    getProviderAccountAttrs(gitAccount) {
        switch (this.provider) {
            case interfaces_1.GitProvider.GITHUB:
                return {
                    avatar_url: gitAccount.account.avatar_url,
                    url: gitAccount.html_url
                };
            case interfaces_1.GitProvider.GITLAB:
                return {
                    avatar_url: gitlabAvatarUrl(gitAccount),
                    url: gitAccount.web_url
                };
            case interfaces_1.GitProvider.BITBUCKET:
                return {
                    avatar_url: gitAccount.links?.avatar?.href || '',
                    url: gitAccount.links?.html?.href || ''
                };
            case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
                return {
                    avatar_url: '',
                    url: ''
                    // avatar_url: gitMetadata.links.avatar.href,
                    // url: gitMetadata.links.html.href
                };
            default:
                throw boom_1.default.badRequest('provider should be one of [github, gitlab, bitbucket, bitbucket_data_center]');
        }
    }
}
exports.default = AccountHelper;
//# sourceMappingURL=account.js.map