/* eslint-disable no-unused-vars */
import { BaseAccount, GitBranch, Repository, RepositoryWithAccount } from '../../interfaces';

export interface GetRepositoriesParams {
  providerInternalId?: string;
  projectKey?: string;
  installationId?: number | null;
  type?: 'USER' | 'ORGANIZATION';
}

export interface GetBranchesOptions {
  limit?: number;
  offset?: number;
  totalCount?: number;
}

export default abstract class GitService {
  nickname: string;

  accessToken: string;

  constructor(accessToken: string, nickname: string) {
    this.nickname = nickname;
    this.accessToken = accessToken;
  }

  abstract getUser(): Promise<any>;

  abstract getRepositories(params: GetRepositoriesParams): Promise<any>;

  abstract getRepository(repo: RepositoryWithAccount): Promise<any>;

  abstract getBranches(
    repo: RepositoryWithAccount,
    options?: GetBranchesOptions
  ): Promise<{ branches: GitBranch[]; totalCount: number }>;

  abstract getBranch(repo: RepositoryWithAccount, branchName: string): Promise<GitBranch>;

  abstract getBranchSha(repo: RepositoryWithAccount, branch: string): Promise<string>;

  abstract getUserRole(
    account: BaseAccount,
    userProviderInternalId: string | number
  ): Promise<string | boolean>;

  abstract deleteApp(account: BaseAccount): Promise<any>;

  abstract setQueuedStatus(
    account: BaseAccount,
    repository: Repository,
    sha: string
  ): Promise<void>;

  abstract getContent(
    repo: RepositoryWithAccount,
    sha: string,
    path: string
  ): Promise<string | undefined>;
}
