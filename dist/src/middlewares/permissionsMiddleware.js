"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const policy_1 = __importDefault(require("../services/permissions/policy"));
const acl_1 = require("../helpers/acl");
const permission_1 = __importDefault(require("../services/permissions/permission"));
const repository_1 = require("../helpers/repository");
// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const permissionsMiddleware = (action, resources, enforce = true) => async (req, _, next) => {
    const { user, account, userInDb } = req;
    if (!account) {
        return next(boom_1.default.badRequest('Missing mandatory accountId query parameter'));
    }
    if (!userInDb) {
        return next(boom_1.default.badRequest('Invalid logged in user'));
    }
    const { allowedRepositories: ACLAllowedRepositories } = await (0, acl_1.getAllowedRepositoriesByUserOnAccount)(user, account.idAccount);
    const allAccountRepositoryIds = await (0, repository_1.getAllAccountsRepositoryIds)(account.idAccount);
    const allowedRepositoryIdsGroupedByTeamRole = await (0, repository_1.getAllowedRepositoryIdsGroupedByTeamRole)(userInDb.idUser, account.idAccount);
    const policy = await policy_1.default.createInstance(account, userInDb, {
        ACLAllowedRepositories,
        allAccountRepositoryIds,
        allowedRepositoryIdsGroupedByTeamRole
    });
    req.permission = await permission_1.default.factory(policy, action, resources);
    if (enforce) {
        try {
            req.permission.enforce();
        }
        catch (e) {
            return next(e);
        }
    }
    return next();
};
exports.default = permissionsMiddleware;
//# sourceMappingURL=permissionsMiddleware.js.map