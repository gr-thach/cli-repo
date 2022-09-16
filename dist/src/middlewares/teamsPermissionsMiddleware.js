"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const policy_1 = __importDefault(require("../services/permissions/policy"));
const interfaces_1 = require("../interfaces");
const user_1 = require("../helpers/user");
const teamPermission_1 = __importDefault(require("../services/permissions/teamPermission"));
// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const teamsPermissionsMiddleware = (action, enforce = true) => async (req, _, next) => {
    const { account, userInDb } = req;
    if (!account) {
        return next(boom_1.default.badRequest('Missing mandatory accountId query parameter'));
    }
    if (!userInDb) {
        return next(boom_1.default.badRequest('Invalid logged in user'));
    }
    const userTeamIdsByTeamRole = await (0, user_1.getUserTeamIdsByTeamRoleOnAccount)(account.idAccount, userInDb.idUser);
    const policy = await policy_1.default.createInstance(account, userInDb, { userTeamIdsByTeamRole });
    req.teamPermission = (await teamPermission_1.default.factory(policy, action, interfaces_1.Resource.TEAMS));
    if (enforce) {
        try {
            req.teamPermission.enforce();
        }
        catch (e) {
            return next(e);
        }
    }
    return next();
};
exports.default = teamsPermissionsMiddleware;
//# sourceMappingURL=teamsPermissionsMiddleware.js.map