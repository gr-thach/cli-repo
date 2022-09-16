export interface Team {
  idTeam: number;
  fkAccount: number;
  name: string;
  description: string;
  department: string;
  providerInternalId: string | null;
  provider: string | null;
}

export interface Application {
  idApplication: number;
  fkAccount: number;
  name: string;
  description: string;
}

export interface GitProviderTeam {
  id: number;
  name: string;
  memberCount: number;
  repositoryCount: number;
  children: GitProviderTeam[];
  slug: string;
  htmlUrl: string;
  description: string;
}
