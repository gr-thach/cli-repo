import boom from '@hapi/boom';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { generateJWT } from '../auth/auth';
import { env } from '../../config';
import { findUserByApiKey } from '../helpers/core-api/users';
import { decryptToken, refreshAccessToken } from '../helpers/auth';
import { ACCOUNT_PROVIDER } from '../helpers/core-api/enums';
import { SessionProvider } from '../interfaces';

export const authenticate = async (req: Request, res: Response) => {
  const {
    body: { apiKey }
  } = req;

  const hmac = () => crypto.createHmac('sha256', env.GUARDRAILS_API_KEY_SECRET);
  const hashedApiKey = hmac()
    .update(apiKey)
    .digest('hex');

  const user = await findUserByApiKey(hashedApiKey);
  if (!user) {
    throw boom.notFound('No user found with the given api key.');
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).getTime();

  let accessToken;

  if (user.provider === ACCOUNT_PROVIDER.BITBUCKET && user.providerRefreshToken) {
    // Bitbucket access tokens become stale after 2 hours (https://confluence.atlassian.com/bitbucket/oauth-on-bitbucket-cloud-238027431.html).
    // So we generate a new access token that is valid for 2 hours (the same time as our JWT tokens) everytime the user is requesting a jwt.
    const refreshToken = decryptToken(user.providerRefreshToken);
    accessToken = await refreshAccessToken(refreshToken, user.provider);
  } else {
    // Gitlab access tokens never become invalid.
    // Github only allows 10 valid oauth access tokens at a time (this was confirmed by testing it manually). So if the user is logging out and logging in
    // to GuardRails more than 10 times under a two hour period (the time that the JWT is valid), then the Github oauth access token will become invalid.
    // We assume that a user won't do this though...
    accessToken = decryptToken(user.providerAccessToken!);
  }

  const jwtToken = generateJWT(
    [
      {
        id: user.providerInternalId!,
        provider: user.provider!.toLowerCase() as SessionProvider,
        access_token: accessToken,
        access_token_secret:
          user.providerAccessTokenSecret && decryptToken(user.providerAccessTokenSecret),
        refresh_token: user.providerRefreshToken && decryptToken(user.providerRefreshToken),
        username: user.login!,
        name: user.name!,
        email: user.email!,
        avatarUrl: user.avatarUrl!
      }
    ],
    expiresAt
  );

  return res.status(200).send({ jwtToken, expiresAt });
};
