"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountPermissionForUser = exports.getPolicyByRequestUserAndAccount = void 0;
const interfaces_1 = require("../interfaces");
const permission_1 = __importDefault(require("../services/permissions/permission"));
const policy_1 = __importDefault(require("../services/permissions/policy"));
const acl_1 = require("./acl");
const users_1 = require("./core-api/users");
const repository_1 = require("./repository");
const getPolicyByRequestUserAndAccount = async (user, account) => {
    const userInDb = await (0, users_1.findUserWithRoleByProviderInternalId)(user.providerInternalId, user.provider, account.idAccount);
    const { allowedRepositories: ACLAllowedRepositories } = await (0, acl_1.getAllowedRepositoriesByUserOnAccount)(user, account.idAccount);
    const allAccountRepositoryIds = await (0, repository_1.getAllAccountsRepositoryIds)(account.idAccount);
    return policy_1.default.createInstance(account, userInDb, {
        ACLAllowedRepositories,
        allAccountRepositoryIds
    });
};
exports.getPolicyByRequestUserAndAccount = getPolicyByRequestUserAndAccount;
const getAccountPermissionForUser = async (user, account) => {
    const policy = await (0, exports.getPolicyByRequestUserAndAccount)(user, account);
    const allowedWriteResources = (await permission_1.default.factory(policy, interfaces_1.PermissionAction.WRITE, [
        interfaces_1.Resource.ACCOUNTS,
        interfaces_1.Resource.JIRA_CONFIG,
        interfaces_1.Resource.SUBSCRIPTION,
        interfaces_1.Resource.CUSTOM_CONFIG,
        interfaces_1.Resource.SAML,
        interfaces_1.Resource.USERS,
        interfaces_1.Resource.TEAMS,
        interfaces_1.Resource.ACTIONS
    ])).getAllowedResources();
    const allowedReadResources = (await permission_1.default.factory(policy, interfaces_1.PermissionAction.READ, [interfaces_1.Resource.USER_EVENTS])).getAllowedResources();
    return {
        read: allowedReadResources,
        write: allowedWriteResources
    };
};
exports.getAccountPermissionForUser = getAccountPermissionForUser;
//# sourceMappingURL=permissions.js.map