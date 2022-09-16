import boom from '@hapi/boom';
import uniq from 'lodash/uniq';
import PolicyService from './policy';
import {
  ACLUserRole,
  PermissionAction,
  MatchingRole,
  Resource,
  UserRoleName
} from '../../interfaces';
import { toArray } from '../../helpers/common';

class PermissionService {
  policy: PolicyService;

  matchingRole: MatchingRole;

  protected constructor(policy: PolicyService) {
    this.policy = policy;
    const policyRoles = new Set(policy.getPolicies().map(({ role }) => role));

    const userRole = policyRoles.has(policy.getUserRole()) ? [policy.getUserRole()] : [];
    const teamRoles = policy.getUserTeamRoles().filter(r => policyRoles.has(r));
    const aclRoles = Object.values(ACLUserRole).filter(r => policyRoles.has(r));

    this.matchingRole = { user: userRole, team: teamRoles, acl: aclRoles };
  }

  public static async factory(
    policy: PolicyService | undefined,
    action: PermissionAction,
    resources: Resource | Resource[]
  ) {
    if (!policy) {
      throw boom.badRequest('Invalid request. The accountId query parameter is required.');
    }

    return new this(await policy.init(action, resources));
  }

  public getAllowedResources() {
    return uniq(
      this.policy
        .getPolicies()
        .filter(p => Object.values<string>(UserRoleName).includes(p.role))
        .map<Resource>(policy => policy.resource)
    );
  }

  /**
   * Basic enforce method. It only checks whether a user can do an action over a resource with its own user role.
   * @returns this if allowed
   * @throws 401 forbidden exception if not allowed
   */
  public enforce() {
    if (this.matchingRole.user.length) {
      return this;
    }

    throw boom.forbidden('You have insufficient permissions.');
  }

  /**
   * Checks whether the user has permissions over the repositoryIds or, if no repositoryIds, if the user is
   * allowed to do the desired action over some of the ids the user may have access to, returning the list of
   * those ids or throwing 401 exception if the user has no access or there are no allowed ids for this action
   * @param repositoryIds the ids of the repositories the user wants to apply the action to
   * @returns allowedIds the user can actually apply this action to
   */
  public repositoriesEnforce(repositoryIds?: number | number[]) {
    const hasNoMatchingRoles =
      !this.matchingRole.user.length &&
      !this.matchingRole.acl.length &&
      !this.matchingRole.team.length;

    if (hasNoMatchingRoles) {
      throw boom.forbidden('You have insufficient permissions.');
    }

    const allowedRepositoryIds = this.getAllowedIds(repositoryIds);

    if (repositoryIds && !allowedRepositoryIds.length) {
      throw boom.forbidden('You have insufficient permissions.');
    }

    return allowedRepositoryIds;
  }

  /**
   * Returns the list of repository ids the user can apply the desired action to
   * @param repositoryIds the ids of the repositories the user wants to apply the action to
   * @returns allowedIds the user can actually apply this action to. If repositoryIds param was sent, then
   * repositoryIds will be filtered by the entire list of repository ids the user has access to.
   */
  public getAllowedIds(repositoryIds?: number | number[]) {
    const parsedRepositoryIds = toArray(repositoryIds);

    let allAllowedRepositories = uniq([
      ...this.getAllowedACLRepositories(),
      ...this.getAllowedAccountRepositories(),
      ...this.getAllowedTeamRepositories()
    ]);

    if (parsedRepositoryIds.length) {
      allAllowedRepositories = parsedRepositoryIds.filter(repoId =>
        allAllowedRepositories.includes(repoId)
      );
    }

    return allAllowedRepositories;
  }

  private getAllowedAccountRepositories() {
    if (this.matchingRole.user.length) {
      return this.policy.getAccountRepositoryIds();
    }
    return [];
  }

  private getAllowedTeamRepositories() {
    const groupedRepositoryIds = this.policy.getRepositoryIdsGroupedByTeamRole();

    if (groupedRepositoryIds) {
      return this.matchingRole.team.flatMap(role => groupedRepositoryIds[role]);
    }

    return [];
  }

  private getAllowedACLRepositories() {
    return this.matchingRole.acl.flatMap(role => this.policy.getACLRepositories(role));
  }
}

export default PermissionService;
