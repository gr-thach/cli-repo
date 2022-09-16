import { sign, decode } from 'jsonwebtoken';
import { env } from '../../config';
import { encryptToken, decryptToken } from '../helpers/auth';
import { RequestUser, JWTTokenData, SessionIdentity, SessionProvider } from '../interfaces';

const getEncryptedToken = (token: string | undefined): string | undefined => {
  return token ? encryptToken(token) : undefined;
};

const getDecryptedToken = (token: string | undefined): string | undefined => {
  return token ? decryptToken(token) : undefined;
};

export const generateJWT = (identities: SessionIdentity[], expiresAt: number) => {
  if (!identities || !identities.length) {
    throw new Error('Invalid identities');
  }

  const identity = identities[0];

  const githubIdentity = identities.find(x => x.provider === SessionProvider.GITHUB);
  const gitlabIdentity = identities.find(x => x.provider === SessionProvider.GITLAB);
  const bitbucketIdentity = identities.find(x => x.provider === SessionProvider.BITBUCKET);
  const bbdcIdentity = identities.find(x => x.provider === SessionProvider.BBDC);

  const jwtTokenData: JWTTokenData = {
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
    bitbucketDataCenterAccessTokenSecret:
      bbdcIdentity?.access_token_secret && getEncryptedToken(bbdcIdentity.access_token_secret),
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

  return sign(jwtTokenData, env.GUARDRAILS_JWT_TOKEN_SECRET);
};

export const parseJWT = (jwt: string): RequestUser => {
  const data = decode(jwt, { json: true }) as JWTTokenData;

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
    bitbucketDataCenterAccessTokenSecret:
      data.bitbucketDataCenterAccessTokenSecret &&
      getDecryptedToken(data.bitbucketDataCenterAccessTokenSecret)
  };
};
