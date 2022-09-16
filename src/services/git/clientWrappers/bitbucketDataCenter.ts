import { env } from '../../../../config';
import BitbucketDataCenterClient from '../../../clients/bitbucketDataCenterClient';
import { base64Decode } from '../../../helpers/common';

class BitbucketDataCenterClientWrapper {
  private client: BitbucketDataCenterClient;

  private patClient: BitbucketDataCenterClient | undefined;

  constructor(userAccessToken: string, userAccessTokenSecret: string) {
    this.client = new BitbucketDataCenterClient(env.BITBUCKET_DATA_CENTER_API_URL, {
      type: 'oauth',
      consumerKey: env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY,
      consumerSecret: base64Decode(env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET),
      accessToken: userAccessToken,
      accessTokenSecret: userAccessTokenSecret
    });
  }

  asUser() {
    return this.client;
  }

  asInstallation() {
    if (!this.patClient) {
      this.patClient = new BitbucketDataCenterClient(env.BITBUCKET_DATA_CENTER_API_URL, {
        type: 'pat',
        pat: env.BITBUCKET_DATA_CENTER_OWN_USER_TOKEN
      });
    }

    return this.patClient;
  }

  async installationFallback<R>(fn: (client: any) => Promise<R>): Promise<ReturnType<typeof fn>> {
    let result: any;

    try {
      result = await fn(this.asUser());
    } catch (e) {
      // We only do the fallback on 403 errors
      if ((e as any).status !== 403) {
        throw e;
      }

      const client = await this.asInstallation();

      result = await fn(client);
    }

    return result;
  }
}

export default BitbucketDataCenterClientWrapper;
