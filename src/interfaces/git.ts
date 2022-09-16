/* eslint-disable no-unused-vars */
import { Schema } from 'bitbucket';
import {
  BBDCPersonalProject,
  BBDCProject,
  BBDCRepository,
  BBDCBranch
} from './bitbucketDataCenter';
import { GithubInstallation, GithubRepository, GithubBranch } from './github';
import { GitlabGroup, GitlabRepository, GitlabUser, GitlabBranch } from './gitlab';

export enum GitProvider {
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  BITBUCKET = 'BITBUCKET',
  BITBUCKET_DATA_CENTER = 'BITBUCKET_DATA_CENTER'
}

export type GitRepository =
  | GithubRepository
  | GitlabRepository
  | Schema.Repository
  | BBDCRepository;

export type GitBranch = GithubBranch | GitlabBranch | Schema.Branch | BBDCBranch;

export type GitAccount =
  | GithubInstallation
  | GitlabGroup
  | GitlabUser
  | Schema.Workspace
  | BBDCProject
  | BBDCPersonalProject;
