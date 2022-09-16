import lodashGet from 'lodash/get';
import { aesEncrypt, aesDecrypt } from './encryption';
import { gitServiceFactoryWithAccessToken } from './gitServiceFactory';
import BitbucketService from '../services/git/bitbucket';
import { GitProvider, SessionProvider } from '../interfaces';
import { ACCOUNT_PROVIDER } from './core-api/enums';
import { env } from '../../config';

export const isValidAccessToken = async (
  accessToken: string,
  provider: GitProvider,
  login: string,
  accessTokenSecret: string
) => {
  const gitService = gitServiceFactoryWithAccessToken(
    provider,
    accessToken,
    login,
    accessTokenSecret
  );

  try {
    // If we can get the user we assume that the access tokens are valid.
    await gitService.getUser();
    return true;
  } catch (err) {
    return false;
  }
};

export const emailMatchesAnyDomain = (email: string, domains: string[]) => {
  if (!email || !email.includes('@')) {
    return false;
  }

  const domain = email.split('@').pop();

  if (!domain) {
    return false;
  }

  return domains.includes(domain);
};

export const refreshAccessToken = async (refreshToken: string, provider: GitProvider) => {
  switch (provider) {
    case ACCOUNT_PROVIDER.BITBUCKET:
      return BitbucketService.refreshAccessToken(refreshToken);
    default:
      throw new Error(`Refreshing token is not supported for git provider ${provider}.`);
  }
};

export const getAvatarUrl = (provider: SessionProvider, user: any) => {
  const { avatarUrl, photos, _json } = user;

  switch (provider) {
    case SessionProvider.GITHUB:
      return lodashGet(photos, '[0].value', undefined);
    case SessionProvider.GITLAB:
      return avatarUrl;
    case SessionProvider.BITBUCKET:
      return lodashGet(_json, 'links.avatar.href', undefined);
    case SessionProvider.BBDC:
      return undefined;
    default:
      return undefined;
  }
};

export const getUserPrimaryEmail = (user: any) => {
  if (user.emails && user.emails.length) {
    return (user.emails.find((e: any) => e.primary === true) || user.emails[0]).value;
  }
  // bbdc
  if (user.emailAddress) {
    return user.emailAddress;
  }
  return undefined;
};

export const encryptToken = (token: string) => {
  return aesEncrypt(token, env.GUARDRAILS_GIT_TOKENS_SECRET);
};

export const decryptToken = (encryptedToken: string) => {
  return aesDecrypt(encryptedToken, env.GUARDRAILS_GIT_TOKENS_SECRET);
};
