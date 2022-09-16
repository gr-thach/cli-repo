"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchRole = exports.filters = exports.list = exports.refreshUsers = exports.refreshPermissions = exports.generateApiKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const boom_1 = __importDefault(require("@hapi/boom"));
const uuid_1 = require("uuid");
const config_1 = require("../../config");
const acl_1 = require("../helpers/acl");
const users_1 = require("../helpers/core-api/users");
const interfaces_1 = require("../interfaces");
const roles_1 = require("../helpers/core-api/roles");
const sync_1 = __importDefault(require("../services/sync"));
const generateApiKey = async (req, res) => {
    const { user } = req;
    const userInDb = await (0, users_1.findUserByProviderInternalId)(user.providerInternalId, user.provider);
    if (!userInDb) {
        throw boom_1.default.notFound('User not found. Please logout and login to GuardRails to create your user.');
    }
    const apiKey = (0, uuid_1.v4)();
    const hmac = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_API_KEY_SECRET);
    const hashedApiKey = hmac()
        .update(apiKey)
        .digest('hex');
    await (0, users_1.updateUser)(userInDb.idUser, {
        apiKey: hashedApiKey
    });
    return res.status(200).send({
        apiKey
    });
};
exports.generateApiKey = generateApiKey;
const refreshPermissions = async (req, res) => {
    const { user } = req;
    await (0, acl_1.renewAllowedAccountsByUser)(user);
    return res.status(204).send();
};
exports.refreshPermissions = refreshPermissions;
const refreshUsers = async (req, res) => {
    const { user, account } = req;
    const syncService = new sync_1.default(user, Boolean(config_1.env.ACL_WRITE_ACCESS_REPOS_MODE));
    const result = await syncService.synchronizeUsers(account);
    if (result) {
        return res.status(204).send();
    }
    throw boom_1.default.badRequest('Refresh users is currently only available for GitHub');
};
exports.refreshUsers = refreshUsers;
const list = async (req, res) => {
    const { query: { teamId, search, role, limit, offset }, account } = req;
    const usersResult = await (0, users_1.queryUsers)(account.idAccount, { teamId: teamId ? Number(teamId) : undefined, search, role }, limit, offset);
    return res.status(200).send(usersResult);
};
exports.list = list;
const filters = async (req, res) => {
    const { query: { search, role }, account } = req;
    const repoFilters = await (0, users_1.queryUsersFilters)(account.idAccount, { search, role });
    return res.status(200).send(repoFilters);
};
exports.filters = filters;
const patchRole = async (req, res) => {
    const { body: { userIds, roleId }, account, userInDb } = req;
    const roles = await (0, roles_1.findAllRoles)();
    const userRoles = roles.filter(role => Object.values(interfaces_1.UserRoleName).includes(role.name));
    const roleToApply = roles.find(r => r.idRole === roleId);
    if (!roleToApply) {
        throw boom_1.default.badRequest('Invalid role');
    }
    if (!userRoles.map(r => r.idRole).includes(roleToApply.idRole)) {
        throw boom_1.default.badRequest('Invalid role');
    }
    if (!Array.isArray(userIds) || !userIds.length) {
        throw boom_1.default.badRequest('Invalid userIds. userIds should be an array of uuid of the users to apply the new role.');
    }
    if (roleToApply.name === interfaces_1.UserRoleName.ADMIN &&
        ![interfaces_1.SystemUserRoleName.OWNER, interfaces_1.UserRoleName.ADMIN].includes(userInDb.role?.name || interfaces_1.UserRoleName.DEVELOPER)) {
        throw boom_1.default.badRequest('Only Admins or Owners of an account can change the role of a user to Admin.');
    }
    // If user wants to change its own role
    if (userIds.includes(userInDb.idUser)) {
        // if only one userId, throw bad request
        if (userIds.length === 1) {
            throw boom_1.default.badRequest('You can not change your own role.');
        }
        // if not, just remove the user from the list
        userIds.splice(userIds.indexOf(userInDb.idUser), 1);
    }
    const result = await (0, users_1.updateUsersRole)(userIds, account.idAccount, roleId, true, true);
    return res.status(200).send(result);
};
exports.patchRole = patchRole;
//# sourceMappingURL=user.js.map