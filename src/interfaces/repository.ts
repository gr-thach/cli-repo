// eslint-disable-next-line import/no-cycle
import { GitProvider, Account } from '.';

export interface Repository {
  idRepository: number;
  name: string;
  fkAccount: number;
  provider: GitProvider;
  providerInternalId: string;
  isPrivate: boolean;
  isEnabled: boolean;
  isMonorepo: boolean;
  fkParentRepository: number | null;
  path: string | null;
  description: string | null;
  fullName: string;
  language: string | undefined;
  badgeToken: string;
  configuration: {};
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface RepositoryWithAccount extends Repository {
  account: Account;
}

export interface CreateRepository {
  fkAccount: number;
  provider: GitProvider;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  isPrivate: boolean;
  description?: string;
  fullName: string;
  language: string | undefined;
  defaultBranch?: string;
  badgeToken: string;
  providerInternalId: string;
}

export interface RepositoryFiltersResponse {
  language: string[];
}

export interface FiltersForRepositoryFilters {
  name?: string;
  isPrivate?: 't' | 'f';
  isEnabled?: 't' | 'f';
  language?: string[];
  monorepoId?: string;
  path?: string;
}

export interface RepositoryFilters extends FiltersForRepositoryFilters {
  limit?: string;
  offset?: string;
  orderBy?: string;
  teamId?: string;
  pkgEcosystem?: string;
  license?: string;
  name?: string;
  dependency?: string;
  path?: string;
}
