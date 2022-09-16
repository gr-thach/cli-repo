"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJWT = exports.generateJWT = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../config");
const auth_1 = require("../helpers/auth");
const interfaces_1 = require("../interfaces");
const getEncryptedToken = (token) => {
    return token ? (0, auth_1.encryptToken)(token) : undefined;
};
const getDecryptedToken = (token) => {
    return token ? (0, auth_1.decryptToken)(token) : undefined;
};
const generateJWT = (identities, expiresAt) => {
    if (!identities || !identities.length) {
        throw new Error('Invalid identities');
    }
    const identity = identities[0];
    const githubIdentity = identities.find(x => x.provider === interfaces_1.SessionProvider.GITHUB);
    const gitlabIdentity = identities.find(x => x.provider === interfaces_1.SessionProvider.GITLAB);
    const bitbucketIdentity = identities.find(x => x.provider === interfaces_1.SessionProvider.BITBUCKET);
    const bbdcIdentity = identities.find(x => x.provider === interfaces_1.SessionProvider.BBDC);
    const jwtTokenData = {
        provider: identity.provider,
        providerInternalId: identity.id,
        // gh
        githubNickname: githubIdentity?.username,
        githubAccessToken: getEncryptedToken(githubIdentity?.access_token),
        // gl
        gitlabNickname: gitlabIdentity?.username,
        gitlabAccessToken: getEncryptedToken(gitlabIdentity?.access_token),
        // bb
        bitbucketNickname: bitbucketIdentity?.username,
        bitbucketAccessToken: getEncryptedToken(bitbucketIdentity?.access_token),
        // bbdc
        bitbucketDataCenterNickname: bbdcIdentity?.username,
        bitbucketDataCenterAccessToken: getEncryptedToken(bbdcIdentity?.access_token),
        bitbucketDataCenterAccessTokenSecret: bbdcIdentity?.access_token_secret && getEncryptedToken(bbdcIdentity.access_token_secret),
        exp: expiresAt / 1000,
        // extra
        user: {
            id: identity.id,
            username: identity.username,
            name: identity.name,
            email: identity.email,
            avatarUrl: identity.avatarUrl,
            createdAt: identity.createdAt
        }
    };
    return (0, jsonwebtoken_1.sign)(jwtTokenData, config_1.env.GUARDRAILS_JWT_TOKEN_SECRET);
};
exports.generateJWT = generateJWT;
const parseJWT = (jwt) => {
    const data = (0, jsonwebtoken_1.decode)(jwt, { json: true });
    if (!data) {
        throw new Error('Failed to parse JWT Token');
    }
    return {
        ...data,
        user: {
            ...data.user,
            id: String(data.user.id)
        },
        providerInternalId: String(data.providerInternalId),
        // decrypt all tokens
        githubAccessToken: getDecryptedToken(data.githubAccessToken),
        gitlabAccessToken: getDecryptedToken(data.gitlabAccessToken),
        bitbucketAccessToken: getDecryptedToken(data.bitbucketAccessToken),
        bitbucketDataCenterAccessToken: getDecryptedToken(data.bitbucketDataCenterAccessToken),
        bitbucketDataCenterAccessTokenSecret: data.bitbucketDataCenterAccessTokenSecret &&
            getDecryptedToken(data.bitbucketDataCenterAccessTokenSecret)
    };
};
exports.parseJWT = parseJWT;
//# sourceMappingURL=auth.js.map