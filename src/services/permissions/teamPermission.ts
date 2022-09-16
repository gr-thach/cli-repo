import uniq from 'lodash/uniq';
import boom from '@hapi/boom';
import { TeamRoleName } from '../../interfaces';
import { toArray } from '../../helpers/common';
import PermissionService from './permission';

class TeamPermissionService extends PermissionService {
  /**
   * Checks whether the user has permissions over the teamIds or, if no teamIds, if the user is
   * allowed to do the desired action over some of the ids the user may have access to, returning the list of
   * those ids or throwing 401 exception if the user has no access or there are no allowed ids for this action
   * @param teamIds the ids of the teams the user wants to apply the action to
   * @returns allowedIds the user can actually apply this action to
   */
  public teamsEnforce(teamIds?: number | number[]) {
    const hasNoMatchingRoles =
      !this.matchingRole.user.length && !this.matchingRole.team.includes(TeamRoleName.TEAM_ADMIN);

    if (hasNoMatchingRoles) {
      throw boom.forbidden('You have insufficient permissions.');
    }

    const allowedTeamIds = this.getAllowedIds(teamIds);

    if (teamIds && !allowedTeamIds.length) {
      throw boom.forbidden('You have insufficient permissions.');
    }

    return allowedTeamIds;
  }

  /**
   * Returns the list of team ids the user can apply the desired action to
   * @param teamIds the ids of the teams the user wants to apply the action to
   * @returns allowedIds the user can actually apply this action to. If teamIds param was sent, then
   * teamIds will be filtered by the entire list of team ids the user has access to.
   */
  public getAllowedIds(teamIds?: number | number[]) {
    const parsedTeamIds = toArray(teamIds);

    let allowedTeams = uniq([...this.getAllowedUsersTeams(), ...this.getAllowedTeamsByAdminRole()]);

    if (parsedTeamIds.length) {
      allowedTeams = parsedTeamIds.filter(teamId => allowedTeams.includes(teamId));
    }

    return allowedTeams;
  }

  private getAllowedUsersTeams = () => {
    if (this.matchingRole.user.length) {
      return this.policy.getAllUserTeamIds();
    }

    return [];
  };

  private getAllowedTeamsByAdminRole = () => {
    if (this.matchingRole.team.includes(TeamRoleName.TEAM_ADMIN)) {
      return this.policy.getUserTeamIdsByTeamRole(TeamRoleName.TEAM_ADMIN);
    }

    return [];
  };
}

export default TeamPermissionService;
