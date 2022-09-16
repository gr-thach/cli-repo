"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.update = exports.config = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const config_1 = require("../../config");
const stripe_1 = __importDefault(require("../services/stripe"));
const acl_1 = require("../helpers/acl");
const yml_1 = require("../helpers/yml");
const accounts_1 = require("../helpers/core-api/accounts");
const gitServiceFactory_1 = require("../helpers/gitServiceFactory");
const permissions_1 = require("../helpers/permissions");
const user_1 = require("../helpers/user");
// temporal log to find out what's going on with accounts on onpremise customers
const _log = (...args) => {
    if (config_1.env.ENVIRONMENT === 'onpremise') {
        // eslint-disable-next-line no-console
        console.log(...args);
    }
};
const list = async (req, res) => {
    const { user } = req;
    _log('Accounts controller: getting allowed accounts for user');
    const { allowedAccounts, isSynchronizing } = await (0, acl_1.getAllowedAccountsByUser)(user);
    _log('Accounts controller: allowed accounts result is', { allowedAccounts, isSynchronizing });
    if (isSynchronizing) {
        return res.status(202).send({ isSynchronizing });
    }
    const accountIds = Object.keys(allowedAccounts).map(id => Number(id));
    _log('Accounts controller: Preparing to get accounts with ids ', { accountIds });
    const accounts = await (0, accounts_1.findAccountsByIds)(accountIds);
    _log(`Accounts controller: ${accounts.length} accounts retrieved`);
    return res.status(200).send({
        [user.provider.toLowerCase()]: await Promise.all(accounts
            .filter(account => allowedAccounts[account.idAccount])
            .map(async (account) => ({
            ...account,
            avatar_url: allowedAccounts[account.idAccount].avatar_url,
            url: allowedAccounts[account.idAccount].url,
            hasAccessTo: await (0, permissions_1.getAccountPermissionForUser)(user, account),
            user: await (0, user_1.getUserInDbForAccount)(user, account.idAccount)
        })))
    });
};
exports.list = list;
const config = async (req, res) => {
    const { body: { configuration }, account } = req;
    let parsedConfiguration;
    try {
        parsedConfiguration = (0, yml_1.validateInstallationConfig)(configuration);
    }
    catch (e) {
        const err = e;
        if (err.name === 'ValidationError') {
            throw boom_1.default.badRequest("Some fields didn't pass validation", {
                details: err.details.map((detail) => ({
                    message: detail.message,
                    path: detail.path
                }))
            });
        }
        else if (err.name === 'YAMLException' || err.name === 'SyntaxError') {
            throw boom_1.default.badData(err.message);
        }
        else {
            throw e;
        }
    }
    await (0, accounts_1.updateAccount)(account.idAccount, { configuration: parsedConfiguration });
    return res.sendStatus(200);
};
exports.config = config;
const update = async (req, res) => {
    const { body: { filterReposByWriteAccess, findingConfiguration }, account } = req;
    const updatedAccount = await (0, accounts_1.updateAccount)(account.idAccount, {
        filterReposByWriteAccess,
        findingConfiguration
    });
    return res.status(200).send(updatedAccount);
};
exports.update = update;
const destroy = async (req, res) => {
    const { account, user } = req;
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, account.provider);
    await gitService.deleteApp(account);
    if (config_1.env.ENVIRONMENT !== 'onpremise' &&
        !account.fkParentAccount &&
        account.subscription.stripeSubscriptionId) {
        const stripeService = new stripe_1.default();
        await stripeService.cancelSubscription(account.subscription.stripeSubscriptionId);
    }
    await (0, accounts_1.destroyAccount)(account.idAccount);
    await (0, acl_1.clearAllowedAccountsByUser)(user);
    return res.status(204).send();
};
exports.destroy = destroy;
//# sourceMappingURL=accounts.js.map