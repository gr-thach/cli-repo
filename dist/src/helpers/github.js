"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncGithubAccounts = exports.getGithubAcccountsAndRepos = void 0;
const get_1 = __importDefault(require("lodash/get"));
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const interfaces_1 = require("../interfaces");
const accounts_1 = require("./core-api/accounts");
const getGithubAcccountsAndRepos = async (installations, gitService) => {
    // for each installation they have access to, get the DB accounts and the git repos
    const results = await Promise.all(installations.map((installation) => Promise.all([
        (0, accounts_1.findAccountWithReposByProviderInternalId)(String(installation.account.id), interfaces_1.GitProvider.GITHUB),
        gitService.getRepositories({ installationId: installation.id }),
        Promise.resolve(installation)
    ])));
    return results.map(result => {
        const [account, gitRepos, installation] = result;
        const filteredRepos = gitRepos.filter(r => {
            if (!(0, get_1.default)(r, 'full_name')) {
                // eslint-disable-next-line no-console
                console.warn('Skipping repository with no full_name', { repository: JSON.stringify(r) });
                return false;
            }
            return true;
        });
        return [account, filteredRepos, installation];
    });
};
exports.getGithubAcccountsAndRepos = getGithubAcccountsAndRepos;
const syncGithubAccounts = async (accountHelper, gitService) => {
    const _installations = await gitService.getUserInstallations();
    // filter out accounts without login and type for now (Enterprise accounts)
    const installations = _installations.filter(i => {
        if (!(0, get_1.default)(i, 'account.login') || !(0, get_1.default)(i, 'account.type')) {
            // eslint-disable-next-line no-console
            console.warn('Skipping installation with no login and/or type', {
                installation: JSON.stringify(i)
            });
            return false;
        }
        return true;
    });
    // group installations by type to query them separatedly with the type filter in case there
    // is an account of type User with the same id as an account of type Organization
    const groupedInstallations = (0, groupBy_1.default)(installations, 'account.type');
    const promises = Object.keys(groupedInstallations).map(type => {
        const accountIds = groupedInstallations[type].map(i => (0, get_1.default)(i, 'account.id'));
        return (0, accounts_1.findBaseAccountsByProviderInternalIds)(accountIds, interfaces_1.GitProvider.GITHUB, type.toUpperCase());
    });
    const accounts = (await Promise.all(promises)).flat();
    const installationsNotInDb = installations.filter(installation => !accounts.find(acc => acc.installationId === installation.id));
    if (installationsNotInDb.length) {
        await accountHelper.bulkCreateFromGithubInstallations(installationsNotInDb);
    }
    return installations;
};
exports.syncGithubAccounts = syncGithubAccounts;
//# sourceMappingURL=github.js.map