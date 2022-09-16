export enum UserRoleName {
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  SECURITY_ENGINEER = 'security_engineer',
  MANAGER = 'manager'
}

export enum SystemUserRoleName {
  OWNER = 'owner'
}

export enum ACLUserRole {
  READ = 'acl_read',
  ADMIN = 'acl_admin'
}

export interface UserRole {
  idRole: number;
  name: UserRoleName | SystemUserRoleName;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export enum TeamRoleName {
  DEVELOPER = 'team_developer',
  SECURITY_ENGINEER = 'team_security_engineer',
  TEAM_ADMIN = 'team_admin'
}

export interface TeamRole {
  idTeamRole: number;
  name: TeamRoleName;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchingRole {
  user: (UserRoleName | SystemUserRoleName)[];
  team: TeamRoleName[];
  acl: ACLUserRole[];
}

export type PermissionsRoleName = SystemUserRoleName | UserRoleName | ACLUserRole | TeamRoleName;
