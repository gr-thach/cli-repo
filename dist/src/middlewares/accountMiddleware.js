"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const lodash_1 = require("lodash");
const accounts_1 = require("../helpers/core-api/accounts");
const users_1 = require("../helpers/core-api/users");
const acl_1 = require("../helpers/acl");
// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const accountMiddleware = async (req, _, next) => {
    const { query: { accountId }, user } = req;
    if (accountId) {
        if ((0, lodash_1.isString)(accountId) && !/^\d+$/.test(accountId)) {
            return next(boom_1.default.badRequest('Invalid accountId'));
        }
        await (0, acl_1.checkIfUserCanAccessAccountId)(user, accountId);
        const account = await (0, accounts_1.findAccountById)(Number(accountId));
        if (!account) {
            return next(boom_1.default.notFound('Account not found'));
        }
        const userInDb = await (0, users_1.findUserWithRoleByProviderInternalId)(user.providerInternalId, user.provider, account.idAccount);
        req.account = account;
        req.userInDb = userInDb;
    }
    return next();
};
exports.default = accountMiddleware;
//# sourceMappingURL=accountMiddleware.js.map