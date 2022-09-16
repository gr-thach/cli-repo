import { Gitlab } from '@gitbeaker/node';
import { env } from '../../../../config';

class GitLabClientWrapper {
  private client: any;

  private gitLabApiOwnUserClient: any | undefined;

  constructor(userAccessToken: string) {
    this.client = new Gitlab({
      oauthToken: userAccessToken,
      host: env.GITLAB_URL
    });
  }

  asUser() {
    return this.client;
  }

  async asInstallation() {
    if (!this.gitLabApiOwnUserClient) {
      // We need to create another instance to try to get the "Own user" id (used for on-premise)
      this.gitLabApiOwnUserClient = new Gitlab({
        token: env.GUARDRAILS_GITLAB_OWN_USER_TOKEN,
        host: env.GITLAB_URL
      });
    }

    return this.gitLabApiOwnUserClient;
  }

  async installationFallback<R>(fn: (client: any) => Promise<R>): Promise<ReturnType<typeof fn>> {
    let result: any;

    try {
      result = await fn(this.asUser());
    } catch (e) {
      // We only do the fallback on 404 errors
      if ((e as any).response && (e as any).response.statusCode !== 404) {
        throw e;
      }

      const client = await this.asInstallation();

      result = await fn(client);
    }

    return result;
  }
}

export default GitLabClientWrapper;
