import Octokit from '@octokit/rest';
import { App } from '@octokit/app';
import { env } from '../../../../config';

export interface GitHubClientWrapperOptions extends Octokit.EndpointOptions {
  headers: { [header: string]: any };
}

class GitHubClientWrapper {
  private userOptions: GitHubClientWrapperOptions;

  private applicationOptions: GitHubClientWrapperOptions | undefined;

  private installationOptions: GitHubClientWrapperOptions | undefined;

  private client: Octokit;

  constructor(userAccessToken: string) {
    this.userOptions = {
      headers: {
        authorization: `token ${userAccessToken}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    };

    this.client = new Octokit({ baseUrl: env.GITHUB_API_URL });
  }

  private initApplicationOptions() {
    if (this.applicationOptions) {
      return;
    }

    const githubJWT = new App({
      id: env.GITHUB_APP_ISSUER_ID,
      privateKey: Buffer.from(env.GITHUB_APP_PRIVATE_KEY_BASE64, 'base64').toString(),
      baseUrl: `${env.GITHUB_API_URL}`
    }).getSignedJsonWebToken();

    this.applicationOptions = {
      headers: {
        authorization: `Bearer ${githubJWT}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    };
  }

  private async initInstallationOptions(installationId: number) {
    if (this.installationOptions) {
      return;
    }

    this.initApplicationOptions();

    const {
      data: { token }
    } = await this.client.apps.createInstallationToken({
      ...this.applicationOptions!,
      installation_id: installationId
    });

    this.installationOptions = {
      headers: {
        authorization: `token ${token}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    };
  }

  asUser() {
    return {
      client: this.client,
      options: this.userOptions
    };
  }

  asApplication() {
    this.initApplicationOptions();

    return {
      client: this.client,
      options: this.applicationOptions!
    };
  }

  async asInstallation(installationId: number) {
    await this.initInstallationOptions(installationId);

    return {
      client: this.client,
      options: this.installationOptions!
    };
  }

  async installationFallback<R>(
    installationId: number,
    fn: (client: Octokit, options: GitHubClientWrapperOptions) => Promise<R>
  ): Promise<ReturnType<typeof fn>> {
    let result: any;

    try {
      const { client, options } = this.asUser();
      result = await fn(client, options);
    } catch (e) {
      // We only do the fallback on 404 errors
      if ((e as any).status !== 404) {
        throw e;
      }

      const { client, options } = await this.asInstallation(installationId);

      result = await fn(client, options);
    }

    return result;
  }
}

export default GitHubClientWrapper;
