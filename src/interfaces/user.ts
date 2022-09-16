import { GitProvider } from './git';
import { SessionProvider } from './session';
import { UserRole, TeamRole } from './roles';

export interface User {
  idUser: string;
  apiKey: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  login: string | null;
  provider: GitProvider | null;
  providerAccessToken: string | null;
  providerRefreshToken: string | null;
  providerInternalId: string | null;
  name: string | null;
  avatarUrl: string | null;
  email: string | null;
  providerAccessTokenSecret: string | null;
  providerMetadata: {
    atlassianId?: string;
  } | null;
  acl: string | null;
  lastLoginAt: string | null;
  roleOverwrittenAt?: string;
  role?: UserRole;
  teamRole?: TeamRole;
}

export interface RequestUser {
  provider: SessionProvider;
  providerInternalId: string;
  exp?: number;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    avatarUrl: string;
    createdAt?: string;
  };
  iat?: number;
  githubNickname?: string;
  githubAccessToken?: string;
  gitlabNickname?: string;
  gitlabAccessToken?: string | undefined;
  bitbucketNickname?: string;
  bitbucketAccessToken?: string | undefined;
  bitbucketDataCenterNickname?: string;
  bitbucketDataCenterAccessToken?: string | undefined;
  bitbucketDataCenterAccessTokenSecret?: string | undefined | null;
}
