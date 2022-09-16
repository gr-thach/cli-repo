"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../auth/auth");
const config_1 = require("../../config");
const users_1 = require("../helpers/core-api/users");
const auth_2 = require("../helpers/auth");
const enums_1 = require("../helpers/core-api/enums");
const authenticate = async (req, res) => {
    const { body: { apiKey } } = req;
    const hmac = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_API_KEY_SECRET);
    const hashedApiKey = hmac()
        .update(apiKey)
        .digest('hex');
    const user = await (0, users_1.findUserByApiKey)(hashedApiKey);
    if (!user) {
        throw boom_1.default.notFound('No user found with the given api key.');
    }
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).getTime();
    let accessToken;
    if (user.provider === enums_1.ACCOUNT_PROVIDER.BITBUCKET && user.providerRefreshToken) {
        // Bitbucket access tokens become stale after 2 hours (https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html).
        // So we generate a new access token that is valid for 2 hours (the same time as our JWT tokens) everytime the user is requesting a jwt.
        const refreshToken = (0, auth_2.decryptToken)(user.providerRefreshToken);
        accessToken = await (0, auth_2.refreshAccessToken)(refreshToken, user.provider);
    }
    else {
        // Gitlab access tokens never become invalid.
        // Github only allows 10 valid oauth access tokens at a time (this was confirmed by testing it manually). So if the user is logging out and logging in
        // to GuardRails more than 10 times under a two hour period (the time that the JWT is valid), then the Github oauth access token will become invalid.
        // We assume that a user won't do this though...
        accessToken = (0, auth_2.decryptToken)(user.providerAccessToken);
    }
    const jwtToken = (0, auth_1.generateJWT)([
        {
            id: user.providerInternalId,
            provider: user.provider.toLowerCase(),
            access_token: accessToken,
            access_token_secret: user.providerAccessTokenSecret && (0, auth_2.decryptToken)(user.providerAccessTokenSecret),
            refresh_token: user.providerRefreshToken && (0, auth_2.decryptToken)(user.providerRefreshToken),
            username: user.login,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl
        }
    ], expiresAt);
    return res.status(200).send({ jwtToken, expiresAt });
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map