import { TeamRoleName } from './roles';
import { GitProvider } from './git';

export type AllowedRepositories = { read: number[]; admin: number[] };

export type AllowedRepositoriesByTeamRole = Record<TeamRoleName, number[]>;

export type UserTeamIdsByTeamRole = { [key: string]: number[] };

export interface AllowedAccount {
  idAccount: number;
  login: string;
  provider: GitProvider;
  allowedRepositories: AllowedRepositories;
  avatar_url: string;
  url: string;
}

export type AllowedAccounts = { [key: string]: AllowedAccount };
