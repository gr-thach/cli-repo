/* eslint-disable no-unused-vars */
// eslint-disable-next-line import/no-cycle
import { GitProvider, Repository, Subscription } from '.';

export enum AccountType {
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER'
}

export type AccountConfigBundles = 'auto' | Array<{ [lang: string]: string[] } | string>;
export type AccountConfigFindings = 'onAllFiles' | 'onChangedFilesOnly' | 'onChangedLinesOnly';
export type AccountConfigIgnore = string;
export interface EngineRule {
  [key: string]: {
    enable: boolean;
    docs: string;
  };
}
export interface Rule {
  enable: boolean;
  title: string;
  languages: {
    [key: string]: boolean;
  };
}
export interface RuleOverride {
  engineRules: {
    [key: string]: EngineRule;
  };
  GuardRailsRules: {
    [key: string]: Rule;
  };
}

export interface AccountConfig {
  bundles?: AccountConfigBundles;
  notifications?: {
    slack: {
      enabled?: boolean;
      notify?: 'onAllScans' | 'whenScanHasFindingsOnly' | 'whenPRHasFindingsOnly';
      webhookUrl?: string;
    };
  } | null;
  report?: {
    pullRequest: {
      comment?: boolean;
      findings?: AccountConfigFindings;
      paranoid?: boolean;
    };
  } | null;
  ignore?: AccountConfigIgnore | null;
  ruleOverride?: RuleOverride | null;
  useGitClone?: boolean | null;
  excludeBundles?: AccountConfigBundles;
}

interface AccountProviderMetadata {
  projectKey?: string;
  ownerId?: number;
}

interface FindingConfiguration {
  requireApprovalOnUpdate: boolean;
}
export interface BaseAccount {
  idAccount: number;
  fkParentAccount: number | null;
  installationId: number | null;
  login: string;
  provider: GitProvider;
  providerInternalId: string;
  type: AccountType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  configuration: AccountConfig | null;
  cliToken: string;
  providerMetadata: AccountProviderMetadata;
  filterReposByWriteAccess: boolean;
  findingConfiguration: FindingConfiguration | null;
  usersSynchronized: boolean;
}

export interface Account extends BaseAccount {
  idRootAccount: number;
  childrenQty: number;
  subscription: Subscription;
}

export interface BaseAccountWithRepos extends BaseAccount {
  repositories: Repository[];
}

export interface AccountWithRepos extends Account, BaseAccountWithRepos {}
