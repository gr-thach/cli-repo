"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const querystring_1 = __importDefault(require("querystring"));
const uuid_1 = require("uuid");
const passport_github2_1 = require("passport-github2");
const passport_gitlab2_1 = require("passport-gitlab2");
const passport_bitbucket_oauth20_1 = require("passport-bitbucket-oauth20");
const passport_bitbucket_1 = require("passport-bitbucket");
const acl_1 = require("../helpers/acl");
const interfaces_1 = require("../interfaces");
const config_1 = require("../../config");
const auth_1 = require("../helpers/auth");
const users_1 = require("../helpers/core-api/users");
const passportSaml_1 = require("./saml/public/passportSaml");
const passportSaml_2 = require("./saml/on-premise/passportSaml");
const common_1 = require("../helpers/common");
const bitbucketDataCenter_1 = __importDefault(require("../services/git/bitbucketDataCenter"));
const sentry_1 = __importDefault(require("../../sentry"));
const auth = __importStar(require("./auth"));
passport_1.default.serializeUser((user, done) => {
    done(null, user);
});
passport_1.default.deserializeUser((user, done) => {
    done(null, user);
});
const authCallbackFn = (accessToken, refreshToken, profile, cb) => {
    const user = { ...profile, accessToken, refreshToken };
    return cb(null, user);
};
const useGithubOAuth = config_1.env.GITHUB_OAUTH_CLIENT_ID && config_1.env.GITHUB_OAUTH_CLIENT_SECRET && config_1.env.GITHUB_OAUTH_REDIRECT_URL;
const useGitlabOAuth = config_1.env.GITLAB_OAUTH_CLIENT_ID && config_1.env.GITLAB_OAUTH_CLIENT_SECRET && config_1.env.GITLAB_OAUTH_REDIRECT_URL;
const useBitbucketOAuth = config_1.env.BITBUCKET_OAUTH_CLIENT_ID &&
    config_1.env.BITBUCKET_OAUTH_CLIENT_SECRET &&
    config_1.env.BITBUCKET_OAUTH_REDIRECT_URL;
const useBitbucketDataCenterOAuth = config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY && config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET;
if (!useGithubOAuth && !useGitlabOAuth && !useBitbucketOAuth && !useBitbucketDataCenterOAuth) {
    throw new Error('No OAuth provider (i.e.: github, gitlab) has been configured. At least one of them should be configured');
}
if (useGithubOAuth) {
    const ghEnterpriseOptions = config_1.env.GITHUB_API_URL !== 'https://api.github.com'
        ? {
            authorizationURL: `${config_1.env.GITHUB_API_URL.replace('/api/v3', '')}/login/oauth/authorize`,
            tokenURL: `${config_1.env.GITHUB_API_URL.replace('/api/v3', '')}/login/oauth/access_token`,
            userProfileURL: `${config_1.env.GITHUB_API_URL}/user`,
            userEmailURL: `${config_1.env.GITHUB_API_URL}/user/emails`
        }
        : {};
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: config_1.env.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: config_1.env.GITHUB_OAUTH_CLIENT_SECRET,
        callbackURL: config_1.env.GITHUB_OAUTH_REDIRECT_URL,
        scope: ['user:email'],
        ...ghEnterpriseOptions
    }, authCallbackFn));
}
if (useGitlabOAuth) {
    passport_1.default.use(new passport_gitlab2_1.Strategy({
        clientID: config_1.env.GITLAB_OAUTH_CLIENT_ID,
        clientSecret: config_1.env.GITLAB_OAUTH_CLIENT_SECRET,
        callbackURL: config_1.env.GITLAB_OAUTH_REDIRECT_URL,
        baseURL: config_1.env.GITLAB_URL
    }, authCallbackFn));
}
if (useBitbucketOAuth) {
    passport_1.default.use(new passport_bitbucket_oauth20_1.Strategy({
        clientID: config_1.env.BITBUCKET_OAUTH_CLIENT_ID,
        clientSecret: config_1.env.BITBUCKET_OAUTH_CLIENT_SECRET,
        callbackURL: config_1.env.BITBUCKET_OAUTH_REDIRECT_URL,
        scope: ['email']
    }, authCallbackFn));
}
if (useBitbucketDataCenterOAuth) {
    passport_1.default.use(interfaces_1.SessionProvider.BBDC, new passport_bitbucket_1.Strategy({
        requestTokenURL: `${config_1.env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/request-token`,
        accessTokenURL: `${config_1.env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/access-token`,
        userAuthorizationURL: `${config_1.env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/authorize`,
        consumerKey: config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY,
        consumerSecret: (0, common_1.base64Decode)(config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET),
        callbackURL: config_1.env.BITBUCKET_DATA_CENTER_OAUTH_REDIRECT_URL,
        signatureMethod: 'RSA-SHA1',
        skipUserProfile: true
    }, async (token, tokenSecret, _, cb) => {
        try {
            const bitbucketDataCenterService = new bitbucketDataCenter_1.default(token, '', tokenSecret);
            const user = await bitbucketDataCenterService.getUser();
            if (typeof user.id !== 'number') {
                throw new Error(`Expected user id to be of type number, got ${typeof user.id}.`);
            }
            user.id = String(user.id);
            user.username = user.name;
            user.accessToken = token;
            user.accessTokenSecret = tokenSecret;
            cb(null, user);
        }
        catch (err) {
            const errorMsg = 'Failed to get user profile from Bitbucket data center.';
            // eslint-disable-next-line no-console
            console.error(errorMsg, err);
            cb(errorMsg);
        }
    }));
}
// @ts-ignore
passport_1.default.use(passportSaml_1.samlStrategy);
if (config_1.env.ENVIRONMENT === 'onpremise') {
    // @ts-ignore
    passport_1.default.use(passportSaml_2.samlStrategyOnPremise);
}
const redirect = (res, state, isError, errorCode) => {
    const params = {
        grauth: isError ? 'error' : 'ok',
        state,
        ...(errorCode && { errorCode })
    };
    return res.redirect(`${config_1.constants.dashboardBaseUrl}?${querystring_1.default.stringify(params)}`);
};
const errorRedirect = (res, state, errorCode) => {
    return redirect(res, state, true, errorCode);
};
const okRedirect = (res, state) => {
    return redirect(res, state, false);
};
const initPassport = (app) => {
    app.use(passport_1.default.initialize());
    app.use((0, passportSaml_1.samlEndpoints)(passport_1.default));
    if (config_1.env.ENVIRONMENT === 'onpremise') {
        app.use((0, passportSaml_2.samlEndpointsOnPremise)(passport_1.default));
    }
    app.get('/authorize', (req, res, next) => {
        const { state, provider } = req.query;
        // validate provider
        if (![
            interfaces_1.SessionProvider.GITHUB,
            interfaces_1.SessionProvider.GITLAB,
            interfaces_1.SessionProvider.BITBUCKET,
            interfaces_1.SessionProvider.BBDC
        ].includes(provider) ||
            (provider === interfaces_1.SessionProvider.GITHUB && !useGithubOAuth) ||
            (provider === interfaces_1.SessionProvider.GITLAB && !useGitlabOAuth) ||
            (provider === interfaces_1.SessionProvider.BITBUCKET && !useBitbucketOAuth) ||
            (provider === interfaces_1.SessionProvider.BBDC && !useBitbucketDataCenterOAuth)) {
            throw new Error(`Invalid provider: "${provider}"`);
        }
        const authenticator = passport_1.default.authenticate(provider, {
            state,
            ...(provider === interfaces_1.SessionProvider.GITLAB && {
                scope: ['api read_user openid profile email']
            })
        });
        authenticator(req, res, next);
    });
    app.get('/authorize/:gitprovider/callback', (req, res, next) => {
        const { gitprovider } = req.params;
        const { state } = req.query;
        // eslint-disable-next-line
        passport_1.default.authenticate(gitprovider, async (err, user, info, status) => {
            try {
                if (err || !user) {
                    // The err variable is set when an internal error occurs during the authentication process
                    // (or in case of Bitbucket data center, if user clicks on cancel on the 'app permission approval' screen during login).
                    // https://github.com/jaredhanson/passport/blob/v0.4.1/lib/middleware/authenticate.js#L358
                    // The user is set to false when authentication fails. Example if Gitlab/Github/Bitbucket
                    // user clicks 'cancel' during on the 'app permission approval' screen during login.
                    // https://github.com/jaredhanson/passport/blob/v0.4.1/lib/middleware/authenticate.js#L36-L37
                    // https://github.com/jaredhanson/passport/blob/v0.4.1/lib/middleware/authenticate.js#L107
                    // eslint-disable-next-line no-console
                    console.error('An error occured during the oauth authentication process.', err, info, status);
                    return errorRedirect(res, state, 'OAUTH_PROVIDER_ERROR');
                }
                // eslint-disable-next-line no-underscore-dangle
                const username = gitprovider === interfaces_1.SessionProvider.BITBUCKET ? user._json.nickname : user.username;
                const email = (0, auth_1.getUserPrimaryEmail)(user);
                const name = user.displayName;
                const avatarUrl = (0, auth_1.getAvatarUrl)(gitprovider, user);
                const now = new Date().toJSON();
                const userInDb = await (0, users_1.findUserByProviderInternalId)(user.id, gitprovider);
                const providerMetadata = gitprovider === interfaces_1.SessionProvider.BITBUCKET
                    ? {
                        atlassianId: user._json.account_id
                    }
                    : undefined;
                if (config_1.env.AUTH_ALLOWED_EMAIL_DOMAINS && config_1.env.AUTH_ALLOWED_EMAIL_DOMAINS.length > 0) {
                    if (!email) {
                        // eslint-disable-next-line no-console
                        console.error('Only whitelisted email domains are allowed to login to GuardRails, but no email address was provided by the oauth provider.');
                        return errorRedirect(res, state, 'NO_EMAIL_PROVIDED');
                    }
                    if (!(0, auth_1.emailMatchesAnyDomain)(email, config_1.env.AUTH_ALLOWED_EMAIL_DOMAINS)) {
                        // eslint-disable-next-line no-console
                        console.log(`This email domain (${email}) is not allowed to login.`);
                        return errorRedirect(res, state, 'EMAIL_DOMAIN_NOT_ALLOWED');
                    }
                }
                if (userInDb) {
                    // Update the access token on each login as there are some edge cases when the token becomes invalid.
                    // https://github.community/t5/GitHub-API-Development-and/API-Access-Token-Expiry/td-p/41059.
                    // Also update the username in case the user renames their account.
                    await (0, users_1.updateUser)(userInDb.idUser, {
                        login: username,
                        providerAccessToken: (0, auth_1.encryptToken)(user.accessToken),
                        providerAccessTokenSecret: user.accessTokenSecret && (0, auth_1.encryptToken)(user.accessTokenSecret),
                        providerRefreshToken: user.refreshToken && (0, auth_1.encryptToken)(user.refreshToken),
                        name,
                        email,
                        avatarUrl,
                        updatedAt: now,
                        lastLoginAt: now
                    });
                }
                else {
                    await (0, users_1.createUser)({
                        idUser: (0, uuid_1.v4)(),
                        login: username,
                        provider: gitprovider.toUpperCase(),
                        providerInternalId: user.id,
                        providerAccessToken: (0, auth_1.encryptToken)(user.accessToken),
                        providerAccessTokenSecret: user.accessTokenSecret && (0, auth_1.encryptToken)(user.accessTokenSecret),
                        providerRefreshToken: user.refreshToken && (0, auth_1.encryptToken)(user.refreshToken),
                        providerMetadata: providerMetadata || null,
                        name,
                        email,
                        avatarUrl,
                        createdAt: now,
                        updatedAt: now,
                        lastLoginAt: now
                    });
                }
                const mainIdentity = {
                    // main
                    provider: gitprovider,
                    access_token: user.accessToken,
                    access_token_secret: user.accessTokenSecret,
                    username,
                    // extra
                    id: user.id,
                    name,
                    email,
                    avatarUrl,
                    createdAt: userInDb ? userInDb.createdAt : now
                };
                const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).getTime();
                const jwtToken = auth.generateJWT([mainIdentity], expiresAt);
                // save the session (cookie) with the token
                if (!req.session) {
                    req.session = {};
                }
                req.session.jwt = jwtToken;
                // renew allowedAccounts cache
                let requestUser = {
                    provider: gitprovider,
                    providerInternalId: mainIdentity.id,
                    user: {
                        id: mainIdentity.id,
                        username: mainIdentity.username,
                        name: mainIdentity.name,
                        email: mainIdentity.email,
                        avatarUrl: mainIdentity.avatarUrl,
                        createdAt: mainIdentity.createdAt
                    }
                };
                if (gitprovider === interfaces_1.SessionProvider.BBDC) {
                    requestUser = {
                        ...requestUser,
                        bitbucketDataCenterNickname: username,
                        bitbucketDataCenterAccessToken: user.accessToken,
                        bitbucketDataCenterAccessTokenSecret: user.accessTokenSecret
                    };
                }
                else {
                    requestUser = {
                        ...requestUser,
                        [`${gitprovider}Nickname`]: username,
                        [`${gitprovider}AccessToken`]: user.accessToken
                    };
                }
                (0, acl_1.renewAllowedAccountsByUser)(requestUser);
                return okRedirect(res, state);
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.error('An unexpected internal error occurred during the oauth authentication process.', error);
                (0, sentry_1.default)(error);
                return errorRedirect(res, state, 'OAUTH_INTERNAL_ERROR');
            }
        })(req, res, next);
    });
};
exports.default = initPassport;
//# sourceMappingURL=passport.js.map