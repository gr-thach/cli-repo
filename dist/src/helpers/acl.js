"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedRepositoriesByUserOnAccount = exports.checkIfUserCanAccessAccountId = exports.clearAllowedAccountsByUser = exports.getAllowedAccountsByUser = exports.renewAllowedAccountsByUser = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const sync_1 = __importDefault(require("../services/sync"));
const cache_1 = __importDefault(require("../services/cache"));
const config_1 = require("../../config");
const user_1 = require("./user");
const users_1 = require("./core-api/users");
const allowedAccountsCacheKey = (provider, login) => {
    return `allowedAccounts_${provider}_${login}_v2`;
};
/**
 * This function runs the synchronize logic to get all needed entities from the VCS and save it on cache
 * and user's table to then be able to access this information to know what each user has access to.
 *
 * @param user RequestUser is the user we get from the session
 * @returns AllowedAccounts Json string
 */
const renewAllowedAccountsByUser = async (user) => {
    const { provider, login } = (0, user_1.parseUser)(user);
    const cache = new cache_1.default(config_1.env.CACHE_PROVIDER).getInstance();
    const syncService = new sync_1.default(user, Boolean(config_1.env.ACL_WRITE_ACCESS_REPOS_MODE));
    const allowedAccounts = await syncService.synchronize();
    const allowedAccountsJson = JSON.stringify(allowedAccounts);
    const cacheKey = allowedAccountsCacheKey(provider, login);
    cache.set(cacheKey, allowedAccountsJson, config_1.env.ACL_CACHE_EXPIRE_TIME);
    const userInDb = await (0, users_1.findUserByProviderInternalId)(user.providerInternalId, provider);
    await (0, users_1.updateUser)(userInDb.idUser, { acl: allowedAccountsJson });
    return allowedAccountsJson;
};
exports.renewAllowedAccountsByUser = renewAllowedAccountsByUser;
const getAllowedAccountsByUser = async (user) => {
    const { provider, login } = (0, user_1.parseUser)(user);
    const cache = new cache_1.default(config_1.env.CACHE_PROVIDER).getInstance();
    const cacheKey = allowedAccountsCacheKey(provider, login);
    let isSynchronizing = false;
    // 1. try to get it from cache
    let allowedAccountsJson = await cache.get(cacheKey);
    if (allowedAccountsJson === null) {
        // 2. if not in cache, we try to get it from the DB, it should be there unless is the first time they login, then it means we are synchronizing
        const userInDb = await (0, users_1.findUserByProviderInternalId)(user.providerInternalId, provider);
        if (userInDb.acl) {
            // 3. if it's in the DB but no in cache, we get the value and also set the cache so we can re-use in the next requests
            allowedAccountsJson = userInDb.acl;
            cache.set(cacheKey, allowedAccountsJson, config_1.env.ACL_CACHE_EXPIRE_TIME);
        }
        else {
            // 4. If not in cache, and not in db, then it's first time we're synchronizing and we need to return that for proper handling
            isSynchronizing = true;
        }
    }
    return {
        allowedAccounts: allowedAccountsJson ? JSON.parse(allowedAccountsJson) : {},
        isSynchronizing
    };
};
exports.getAllowedAccountsByUser = getAllowedAccountsByUser;
const clearAllowedAccountsByUser = async (user) => {
    const { provider, login } = (0, user_1.parseUser)(user);
    const cache = new cache_1.default(config_1.env.CACHE_PROVIDER).getInstance();
    const cacheKey = allowedAccountsCacheKey(provider, login);
    await cache.del(cacheKey);
    const userInDb = await (0, users_1.findUserByProviderInternalId)(user.providerInternalId, provider);
    await (0, users_1.updateUser)(userInDb.idUser, { acl: null });
};
exports.clearAllowedAccountsByUser = clearAllowedAccountsByUser;
const checkIfUserCanAccessAccountId = async (user, accountId) => {
    const { allowedAccounts } = await (0, exports.getAllowedAccountsByUser)(user);
    const allAllowedAccountIds = Object.keys(allowedAccounts).map(Number);
    if (!allAllowedAccountIds.includes(Number(accountId))) {
        throw boom_1.default.forbidden('Not authorized to perform the operation');
    }
};
exports.checkIfUserCanAccessAccountId = checkIfUserCanAccessAccountId;
const getAllowedRepositoriesByUserOnAccount = async (user, accountId) => {
    const { allowedAccounts } = await (0, exports.getAllowedAccountsByUser)(user);
    const allAllowedAccountIds = Object.keys(allowedAccounts).map(Number);
    if (!allAllowedAccountIds.includes(accountId)) {
        throw boom_1.default.forbidden('Not authorized to perform the operation');
    }
    const { allowedRepositories } = allowedAccounts[accountId];
    const allAllowedRepositoryIds = allowedRepositories.read.concat(allowedRepositories.admin);
    return { allowedAccounts, allowedRepositories, allAllowedRepositoryIds };
};
exports.getAllowedRepositoriesByUserOnAccount = getAllowedRepositoriesByUserOnAccount;
//# sourceMappingURL=acl.js.map