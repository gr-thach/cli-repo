"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptToken = exports.encryptToken = exports.getUserPrimaryEmail = exports.getAvatarUrl = exports.refreshAccessToken = exports.emailMatchesAnyDomain = exports.isValidAccessToken = void 0;
const get_1 = __importDefault(require("lodash/get"));
const encryption_1 = require("./encryption");
const gitServiceFactory_1 = require("./gitServiceFactory");
const bitbucket_1 = __importDefault(require("../services/git/bitbucket"));
const interfaces_1 = require("../interfaces");
const enums_1 = require("./core-api/enums");
const config_1 = require("../../config");
const isValidAccessToken = async (accessToken, provider, login, accessTokenSecret) => {
    const gitService = (0, gitServiceFactory_1.gitServiceFactoryWithAccessToken)(provider, accessToken, login, accessTokenSecret);
    try {
        // If we can get the user we assume that the access tokens are valid.
        await gitService.getUser();
        return true;
    }
    catch (err) {
        return false;
    }
};
exports.isValidAccessToken = isValidAccessToken;
const emailMatchesAnyDomain = (email, domains) => {
    if (!email || !email.includes('@')) {
        return false;
    }
    const domain = email.split('@').pop();
    if (!domain) {
        return false;
    }
    return domains.includes(domain);
};
exports.emailMatchesAnyDomain = emailMatchesAnyDomain;
const refreshAccessToken = async (refreshToken, provider) => {
    switch (provider) {
        case enums_1.ACCOUNT_PROVIDER.BITBUCKET:
            return bitbucket_1.default.refreshAccessToken(refreshToken);
        default:
            throw new Error(`Refreshing token is not supported for git provider ${provider}.`);
    }
};
exports.refreshAccessToken = refreshAccessToken;
const getAvatarUrl = (provider, user) => {
    const { avatarUrl, photos, _json } = user;
    switch (provider) {
        case interfaces_1.SessionProvider.GITHUB:
            return (0, get_1.default)(photos, '[0].value', undefined);
        case interfaces_1.SessionProvider.GITLAB:
            return avatarUrl;
        case interfaces_1.SessionProvider.BITBUCKET:
            return (0, get_1.default)(_json, 'links.avatar.href', undefined);
        case interfaces_1.SessionProvider.BBDC:
            return undefined;
        default:
            return undefined;
    }
};
exports.getAvatarUrl = getAvatarUrl;
const getUserPrimaryEmail = (user) => {
    if (user.emails && user.emails.length) {
        return (user.emails.find((e) => e.primary === true) || user.emails[0]).value;
    }
    // bbdc
    if (user.emailAddress) {
        return user.emailAddress;
    }
    return undefined;
};
exports.getUserPrimaryEmail = getUserPrimaryEmail;
const encryptToken = (token) => {
    return (0, encryption_1.aesEncrypt)(token, config_1.env.GUARDRAILS_GIT_TOKENS_SECRET);
};
exports.encryptToken = encryptToken;
const decryptToken = (encryptedToken) => {
    return (0, encryption_1.aesDecrypt)(encryptedToken, config_1.env.GUARDRAILS_GIT_TOKENS_SECRET);
};
exports.decryptToken = decryptToken;
//# sourceMappingURL=auth.js.map