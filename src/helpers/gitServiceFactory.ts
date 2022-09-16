import { GitProvider, RequestUser } from '../interfaces';
import GitHubService from '../services/git/github';
import GitLabService from '../services/git/gitlab';
import BitbucketService from '../services/git/bitbucket';
import BitbucketDataCenterService from '../services/git/bitbucketDataCenter';

export const gitServiceFactory = (user: RequestUser, provider: GitProvider) => {
  if (provider.toUpperCase() === GitProvider.GITHUB) {
    return new GitHubService(user.githubAccessToken!, user.githubNickname!);
  }
  if (provider.toUpperCase() === GitProvider.GITLAB) {
    return new GitLabService(user.gitlabAccessToken!, user.gitlabNickname!);
  }
  if (provider.toUpperCase() === GitProvider.BITBUCKET) {
    return new BitbucketService(user.bitbucketAccessToken!, user.bitbucketNickname!);
  }
  if (provider.toUpperCase() === GitProvider.BITBUCKET_DATA_CENTER) {
    return new BitbucketDataCenterService(
      user.bitbucketDataCenterAccessToken!,
      user.bitbucketDataCenterNickname!,
      user.bitbucketDataCenterAccessTokenSecret!
    );
  }
  throw Error(`Invalid provider [${provider}]`);
};

export const gitServiceFactoryWithAccessToken = (
  provider: GitProvider,
  accessToken: string,
  nickname: string,
  accessTokenSecret: string | null = null
) => {
  if (provider.toUpperCase() === GitProvider.GITHUB) {
    return new GitHubService(accessToken, nickname);
  }
  if (provider.toUpperCase() === GitProvider.GITLAB) {
    return new GitLabService(accessToken, nickname);
  }
  if (provider.toUpperCase() === GitProvider.BITBUCKET) {
    return new BitbucketService(accessToken, nickname);
  }
  if (provider.toUpperCase() === GitProvider.BITBUCKET_DATA_CENTER) {
    return new BitbucketDataCenterService(accessToken, nickname, accessTokenSecret || '');
  }
  throw Error(`Invalid provider [${provider}]`);
};
