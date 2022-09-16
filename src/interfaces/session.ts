export enum SessionProvider {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
  BBDC = 'bitbucket_data_center'
}

export interface SessionUser {
  id: string | number;
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt?: string;
}

export interface SessionIdentity extends SessionUser {
  provider: SessionProvider;
  access_token: string;
  refresh_token?: string | null;
  access_token_secret?: string | null; // Used for Bitbucket on-premise
}

export interface JWTTokenData {
  provider: SessionProvider;
  providerInternalId: string | number;
  user: SessionUser;
  // gh
  githubNickname?: string;
  githubAccessToken?: string;
  // gl
  gitlabNickname?: string;
  gitlabAccessToken?: string;
  // bb
  bitbucketNickname?: string;
  bitbucketAccessToken?: string;
  // bbdc
  bitbucketDataCenterNickname?: string;
  bitbucketDataCenterAccessToken?: string;
  bitbucketDataCenterAccessTokenSecret?: string | null;
  exp: number; // in seconds
}
