import jwt from 'jwt-simple';
import { APIClient, Bitbucket } from 'bitbucket';
import { env } from '../../../../config';

class BitbucketClientWrapper {
  private client: APIClient;

  private bitbucketAppClient: APIClient | undefined;

  constructor(userAccessToken: string) {
    this.client = new Bitbucket({
      baseUrl: env.BITBUCKET_API_URL,
      auth: {
        token: userAccessToken
      }
    });
  }

  asUser() {
    return this.client;
  }

  asInstallation(accountProviderInternalId: string) {
    if (!this.bitbucketAppClient) {
      const appName = env.BITBUCKET_APP_NAME;
      const clientKey = `ari:cloud:bitbucket::app/${accountProviderInternalId}/${appName}`;
      const now = new Date();
      const payload = {
        iss: appName,
        sub: clientKey,
        iat: Math.floor(now.getTime() / 1000),
        exp: Math.floor(now.setHours(now.getHours() + 1) / 1000)
      };
      const token = jwt.encode(payload, env.BITBUCKET_APP_SECRET);

      this.bitbucketAppClient = new Bitbucket({
        baseUrl: env.BITBUCKET_API_URL,
        headers: {
          Authorization: `JWT ${token}`
        }
      });
    }

    return this.bitbucketAppClient;
  }

  async installationFallback<R>(
    accountProviderInternalId: string,
    fn: (client: any) => Promise<R>
  ): Promise<ReturnType<typeof fn>> {
    let result: any;

    try {
      result = await fn(this.asUser());
    } catch (e) {
      // We only do the fallback on 403 errors
      if ((e as any).status !== 403) {
        throw e;
      }

      const client = this.asInstallation(accountProviderInternalId);

      result = await fn(client);
    }

    return result;
  }
}

export default BitbucketClientWrapper;
