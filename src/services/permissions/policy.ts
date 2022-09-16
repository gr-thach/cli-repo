import { getAccountPlanCode } from '../../helpers/subscription';
import { env } from '../../../config';
import {
  Account,
  AllowedRepositories,
  UserRoleName,
  SystemUserRoleName,
  SpecialPlanCode,
  ACLUserRole,
  User,
  PermissionsRoleName,
  PermissionsPolicy,
  Resource,
  TeamRoleName,
  AllowedRepositoriesByTeamRole,
  UserTeamIdsByTeamRole,
  PermissionAction,
  PlanCode
} from '../../interfaces';
import { getPermissionPolicies } from '../../helpers/core-api/permissions';
import { toArray } from '../../helpers/common';
import { findAccountById } from '../../helpers/core-api/accounts';

export const accessToAllReposRoles: PermissionsRoleName[] = [
  SystemUserRoleName.OWNER,
  UserRoleName.ADMIN,
  UserRoleName.SECURITY_ENGINEER
];

export interface PolicyAllowedRepositories {
  account: number[];
  aclRead: number[];
  aclWrite: number[];
  teamRole?: AllowedRepositoriesByTeamRole | null;
}

interface PolicyOptions {
  ACLAllowedRepositories?: AllowedRepositories;
  allAccountRepositoryIds?: number[];
  allowedRepositoryIdsGroupedByTeamRole?: AllowedRepositoriesByTeamRole | null;
  userTeamIdsByTeamRole?: UserTeamIdsByTeamRole;
}

class PolicyService {
  private planCode: PlanCode | SpecialPlanCode | undefined;

  private rootAccountId: number | undefined;

  private userRole: SystemUserRoleName | UserRoleName;

  private policies: PermissionsPolicy[] = [];

  private allowedRepositories: PolicyAllowedRepositories;

  private userTeamRoles: TeamRoleName[] = [];

  private userTeamIdsByTeamRole: UserTeamIdsByTeamRole;

  private constructor(userInDb?: User, options: PolicyOptions = {}) {
    this.userRole = UserRoleName.DEVELOPER; // By default, role is developer in case the user has no role in the DB
    if (userInDb?.role) {
      // If the role is owner, we use admin, which works the same way, but this way we don't need to add owner in the policies
      this.userRole =
        userInDb?.role.name === SystemUserRoleName.OWNER ? UserRoleName.ADMIN : userInDb.role.name;
    }

    const {
      allAccountRepositoryIds = [],
      allowedRepositoryIdsGroupedByTeamRole,
      ACLAllowedRepositories = { read: [], admin: [] },
      userTeamIdsByTeamRole = {}
    } = options;

    this.userTeamRoles = Object.keys(
      allowedRepositoryIdsGroupedByTeamRole ?? userTeamIdsByTeamRole ?? {}
    ) as TeamRoleName[];

    this.allowedRepositories = {
      account: allAccountRepositoryIds,
      aclRead: ACLAllowedRepositories.read.concat(ACLAllowedRepositories.admin),
      aclWrite: ACLAllowedRepositories.admin,
      teamRole: allowedRepositoryIdsGroupedByTeamRole
    };

    this.userTeamIdsByTeamRole = userTeamIdsByTeamRole;
  }

  public static async createInstance(
    account: Account,
    userInDb?: User,
    options: PolicyOptions = {}
  ) {
    return new PolicyService(userInDb, options).initAccount(account);
  }

  public async initAccount(account: Account) {
    // If the account has a root account (which is not itself), we get the root account to then
    // check for the subscription plan of that account to use for permissions calculations.
    const rootAccount =
      account.idRootAccount && account.idRootAccount !== account.idAccount
        ? await findAccountById(account.idRootAccount)
        : account;

    this.planCode =
      env.ENVIRONMENT === 'onpremise' ? SpecialPlanCode.ONPREMISE : getAccountPlanCode(rootAccount);

    // We also save the id of that root account to retrieve the policies from there
    this.rootAccountId = account.idRootAccount;

    return this;
  }

  public async init(action: PermissionAction, resources: Resource | Resource[]) {
    await this.initPolicies(action, resources);

    return this;
  }

  public getUserRole() {
    return this.userRole;
  }

  public getUserTeamRoles() {
    return this.userTeamRoles;
  }

  public getPolicies() {
    return this.policies;
  }

  public getAccountRepositoryIds() {
    return this.allowedRepositories.account;
  }

  public getRepositoryIdsGroupedByTeamRole() {
    return this.allowedRepositories.teamRole;
  }

  public getACLRepositories(role: ACLUserRole) {
    const repositoryMap = {
      [ACLUserRole.ADMIN]: this.allowedRepositories.aclWrite,
      [ACLUserRole.READ]: this.allowedRepositories.aclRead
    };

    return repositoryMap[role];
  }

  public getUserTeamIdsByTeamRole(teamRole: TeamRoleName) {
    return this.userTeamIdsByTeamRole[teamRole] || [];
  }

  public getAllUserTeamIds() {
    return Object.values(this.userTeamIdsByTeamRole).flat();
  }

  private async initPolicies(action: PermissionAction, resources: Resource | Resource[]) {
    const roles = [
      this.userRole,
      ACLUserRole.READ,
      ACLUserRole.ADMIN,
      ...Object.values(TeamRoleName)
    ];

    if (roles.length && resources.length && this.rootAccountId && this.planCode) {
      this.policies = await getPermissionPolicies(
        this.rootAccountId,
        this.planCode,
        roles,
        toArray(resources),
        action
      );
    }
    return this;
  }
}

export default PolicyService;
