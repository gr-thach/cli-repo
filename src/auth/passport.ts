import { Express, NextFunction, Request, Response, Application } from 'express';
import passport from 'passport';
import querystring from 'querystring';
import { v4 as uuid } from 'uuid';
import { Strategy as GithubStrategy } from 'passport-github2';
import { Strategy as GitlabStrategy } from 'passport-gitlab2';
import { Strategy as BitbucketStrategy } from 'passport-bitbucket-oauth20';
import { Strategy as BitbucketDataCenterStrategy } from 'passport-bitbucket';
import { renewAllowedAccountsByUser } from '../helpers/acl';
import { RequestUser, User, SessionProvider, GitProvider } from '../interfaces';
import { env, constants } from '../../config';
import {
  getAvatarUrl,
  getUserPrimaryEmail,
  encryptToken,
  emailMatchesAnyDomain
} from '../helpers/auth';
import { findUserByProviderInternalId, createUser, updateUser } from '../helpers/core-api/users';
import { samlStrategy, samlEndpoints } from './saml/public/passportSaml';
import { samlStrategyOnPremise, samlEndpointsOnPremise } from './saml/on-premise/passportSaml';
import { base64Decode } from '../helpers/common';
import BitbucketDataCenterService from '../services/git/bitbucketDataCenter';
import reportError from '../../sentry';
import * as auth from './auth';

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user as Express.User);
});

const authCallbackFn = (accessToken: string, refreshToken: string, profile: any, cb: any) => {
  const user = { ...profile, accessToken, refreshToken };
  return cb(null, user);
};

const useGithubOAuth =
  env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET && env.GITHUB_OAUTH_REDIRECT_URL;

const useGitlabOAuth =
  env.GITLAB_OAUTH_CLIENT_ID && env.GITLAB_OAUTH_CLIENT_SECRET && env.GITLAB_OAUTH_REDIRECT_URL;

const useBitbucketOAuth =
  env.BITBUCKET_OAUTH_CLIENT_ID &&
  env.BITBUCKET_OAUTH_CLIENT_SECRET &&
  env.BITBUCKET_OAUTH_REDIRECT_URL;

const useBitbucketDataCenterOAuth =
  env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY && env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET;

if (!useGithubOAuth && !useGitlabOAuth && !useBitbucketOAuth && !useBitbucketDataCenterOAuth) {
  throw new Error(
    'No OAuth provider (i.e.: github, gitlab) has been configured. At least one of them should be configured'
  );
}

if (useGithubOAuth) {
  const ghEnterpriseOptions =
    env.GITHUB_API_URL !== 'https://api.github.com'
      ? {
          authorizationURL: `${env.GITHUB_API_URL.replace('/api/v3', '')}/login/oauth/authorize`,
          tokenURL: `${env.GITHUB_API_URL.replace('/api/v3', '')}/login/oauth/access_token`,
          userProfileURL: `${env.GITHUB_API_URL}/user`,
          userEmailURL: `${env.GITHUB_API_URL}/user/emails`
        }
      : {};

  passport.use(
    new GithubStrategy(
      {
        clientID: env.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
        callbackURL: env.GITHUB_OAUTH_REDIRECT_URL,
        scope: ['user:email'],
        ...ghEnterpriseOptions
      },
      authCallbackFn
    )
  );
}

if (useGitlabOAuth) {
  passport.use(
    new GitlabStrategy(
      {
        clientID: env.GITLAB_OAUTH_CLIENT_ID,
        clientSecret: env.GITLAB_OAUTH_CLIENT_SECRET,
        callbackURL: env.GITLAB_OAUTH_REDIRECT_URL,
        baseURL: env.GITLAB_URL
      },
      authCallbackFn
    )
  );
}

if (useBitbucketOAuth) {
  passport.use(
    new BitbucketStrategy(
      {
        clientID: env.BITBUCKET_OAUTH_CLIENT_ID,
        clientSecret: env.BITBUCKET_OAUTH_CLIENT_SECRET,
        callbackURL: env.BITBUCKET_OAUTH_REDIRECT_URL,
        scope: ['email']
      },
      authCallbackFn
    )
  );
}

if (useBitbucketDataCenterOAuth) {
  passport.use(
    SessionProvider.BBDC,
    new BitbucketDataCenterStrategy(
      {
        requestTokenURL: `${env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/request-token`,
        accessTokenURL: `${env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/access-token`,
        userAuthorizationURL: `${env.BITBUCKET_DATA_CENTER_API_URL}/plugins/servlet/oauth/authorize`,
        consumerKey: env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY,
        consumerSecret: base64Decode(env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET),
        callbackURL: env.BITBUCKET_DATA_CENTER_OAUTH_REDIRECT_URL,
        signatureMethod: 'RSA-SHA1',
        skipUserProfile: true
      },
      async (token: string, tokenSecret: string, _: any, cb: any) => {
        try {
          const bitbucketDataCenterService = new BitbucketDataCenterService(token, '', tokenSecret);
          const user = await bitbucketDataCenterService.getUser();

          if (typeof user.id !== 'number') {
            throw new Error(`Expected user id to be of type number, got ${typeof user.id}.`);
          }

          user.id = String(user.id);
          user.username = user.name;
          user.accessToken = token;
          user.accessTokenSecret = tokenSecret;

          cb(null, user);
        } catch (err) {
          const errorMsg = 'Failed to get user profile from Bitbucket data center.';
          // eslint-disable-next-line no-console
          console.error(errorMsg, err);
          cb(errorMsg);
        }
      }
    )
  );
}

// @ts-ignore
passport.use(samlStrategy);

if (env.ENVIRONMENT === 'onpremise') {
  // @ts-ignore
  passport.use(samlStrategyOnPremise);
}

const redirect = (
  res: Response,
  state: string | undefined,
  isError: boolean,
  errorCode?: string
) => {
  const params = {
    grauth: isError ? 'error' : 'ok',
    state,
    ...(errorCode && { errorCode })
  };

  return res.redirect(`${constants.dashboardBaseUrl}?${querystring.stringify(params)}`);
};

const errorRedirect = (res: Response, state: string | undefined, errorCode: string) => {
  return redirect(res, state, true, errorCode);
};

const okRedirect = (res: Response, state: string | undefined) => {
  return redirect(res, state, false);
};

const initPassport = (app: Application) => {
  app.use(passport.initialize());

  app.use(samlEndpoints(passport));

  if (env.ENVIRONMENT === 'onpremise') {
    app.use(samlEndpointsOnPremise(passport));
  }

  app.get(
    '/authorize',
    (
      req: Request<any, any, any, { state: string; provider: SessionProvider }>,
      res: Response,
      next: NextFunction
    ) => {
      const { state, provider } = req.query;

      // validate provider
      if (
        ![
          SessionProvider.GITHUB,
          SessionProvider.GITLAB,
          SessionProvider.BITBUCKET,
          SessionProvider.BBDC
        ].includes(provider) ||
        (provider === SessionProvider.GITHUB && !useGithubOAuth) ||
        (provider === SessionProvider.GITLAB && !useGitlabOAuth) ||
        (provider === SessionProvider.BITBUCKET && !useBitbucketOAuth) ||
        (provider === SessionProvider.BBDC && !useBitbucketDataCenterOAuth)
      ) {
        throw new Error(`Invalid provider: "${provider}"`);
      }

      const authenticator = passport.authenticate(provider, {
        state,
        ...(provider === SessionProvider.GITLAB && {
          scope: ['api read_user openid profile email']
        })
      });

      authenticator(req, res, next);
    }
  );

  app.get(
    '/authorize/:gitprovider/callback',
    (
      req: Request<{ gitprovider: SessionProvider }, any, any, { state: string }>,
      res: Response,
      next: NextFunction
    ) => {
      const { gitprovider } = req.params;
      const { state } = req.query;

      // eslint-disable-next-line
      passport.authenticate(gitprovider, async (err, user, info, status) => {
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
            console.error(
              'An error occured during the oauth authentication process.',
              err,
              info,
              status
            );

            return errorRedirect(res, state, 'OAUTH_PROVIDER_ERROR');
          }

          // eslint-disable-next-line no-underscore-dangle
          const username =
            gitprovider === SessionProvider.BITBUCKET ? user._json.nickname : user.username;
          const email = getUserPrimaryEmail(user);
          const name = user.displayName;
          const avatarUrl = getAvatarUrl(gitprovider, user);
          const now = new Date().toJSON();
          const userInDb: User = await findUserByProviderInternalId(user.id, gitprovider);
          const providerMetadata =
            gitprovider === SessionProvider.BITBUCKET
              ? {
                  atlassianId: user._json.account_id
                }
              : undefined;

          if (env.AUTH_ALLOWED_EMAIL_DOMAINS && env.AUTH_ALLOWED_EMAIL_DOMAINS.length > 0) {
            if (!email) {
              // eslint-disable-next-line no-console
              console.error(
                'Only whitelisted email domains are allowed to login to GuardRails, but no email address was provided by the oauth provider.'
              );

              return errorRedirect(res, state, 'NO_EMAIL_PROVIDED');
            }

            if (!emailMatchesAnyDomain(email, env.AUTH_ALLOWED_EMAIL_DOMAINS)) {
              // eslint-disable-next-line no-console
              console.log(`This email domain (${email}) is not allowed to login.`);
              return errorRedirect(res, state, 'EMAIL_DOMAIN_NOT_ALLOWED');
            }
          }

          if (userInDb) {
            // Update the access token on each login as there are some edge cases when the token becomes invalid.
            // https://github.community/t5/GitHub-API-Development-and/API-Access-Token-Expiry/td-p/41059.
            // Also update the username in case the user renames their account.
            await updateUser(userInDb.idUser, {
              login: username,
              providerAccessToken: encryptToken(user.accessToken),
              providerAccessTokenSecret:
                user.accessTokenSecret && encryptToken(user.accessTokenSecret),
              providerRefreshToken: user.refreshToken && encryptToken(user.refreshToken),
              name,
              email,
              avatarUrl,
              updatedAt: now,
              lastLoginAt: now
            });
          } else {
            await createUser({
              idUser: uuid(),
              login: username,
              provider: gitprovider.toUpperCase() as GitProvider,
              providerInternalId: user.id,
              providerAccessToken: encryptToken(user.accessToken),
              providerAccessTokenSecret:
                user.accessTokenSecret && encryptToken(user.accessTokenSecret),
              providerRefreshToken: user.refreshToken && encryptToken(user.refreshToken),
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
          let requestUser: RequestUser = {
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
          if (gitprovider === SessionProvider.BBDC) {
            requestUser = {
              ...requestUser,
              bitbucketDataCenterNickname: username,
              bitbucketDataCenterAccessToken: user.accessToken,
              bitbucketDataCenterAccessTokenSecret: user.accessTokenSecret
            };
          } else {
            requestUser = {
              ...requestUser,
              [`${gitprovider}Nickname`]: username,
              [`${gitprovider}AccessToken`]: user.accessToken
            };
          }
          renewAllowedAccountsByUser(requestUser);

          return okRedirect(res, state);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(
            'An unexpected internal error occurred during the oauth authentication process.',
            error
          );
          reportError(error);
          return errorRedirect(res, state, 'OAUTH_INTERNAL_ERROR');
        }
      })(req, res, next);
    }
  );
};

export default initPassport;
