"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uniq_1 = __importDefault(require("lodash/uniq"));
const boom_1 = __importDefault(require("@hapi/boom"));
const interfaces_1 = require("../../interfaces");
const common_1 = require("../../helpers/common");
const permission_1 = __importDefault(require("./permission"));
class TeamPermissionService extends permission_1.default {
    /**
     * Checks whether the user has permissions over the teamIds or, if no teamIds, if the user is
     * allowed to do the desired action over some of the ids the user may have access to, returning the list of
     * those ids or throwing 401 exception if the user has no access or there are no allowed ids for this action
     * @param teamIds the ids of the teams the user wants to apply the action to
     * @returns allowedIds the user can actually apply this action to
     */
    teamsEnforce(teamIds) {
        const hasNoMatchingRoles = !this.matchingRole.user.length && !this.matchingRole.team.includes(interfaces_1.TeamRoleName.TEAM_ADMIN);
        if (hasNoMatchingRoles) {
            throw boom_1.default.forbidden('You have insufficient permissions.');
        }
        const allowedTeamIds = this.getAllowedIds(teamIds);
        if (teamIds && !allowedTeamIds.length) {
            throw boom_1.default.forbidden('You have insufficient permissions.');
        }
        return allowedTeamIds;
    }
    /**
     * Returns the list of team ids the user can apply the desired action to
     * @param teamIds the ids of the teams the user wants to apply the action to
     * @returns allowedIds the user can actually apply this action to. If teamIds param was sent, then
     * teamIds will be filtered by the entire list of team ids the user has access to.
     */
    getAllowedIds(teamIds) {
        const parsedTeamIds = (0, common_1.toArray)(teamIds);
        let allowedTeams = (0, uniq_1.default)([...this.getAllowedUsersTeams(), ...this.getAllowedTeamsByAdminRole()]);
        if (parsedTeamIds.length) {
            allowedTeams = parsedTeamIds.filter(teamId => allowedTeams.includes(teamId));
        }
        return allowedTeams;
    }
    getAllowedUsersTeams = () => {
        if (this.matchingRole.user.length) {
            return this.policy.getAllUserTeamIds();
        }
        return [];
    };
    getAllowedTeamsByAdminRole = () => {
        if (this.matchingRole.team.includes(interfaces_1.TeamRoleName.TEAM_ADMIN)) {
            return this.policy.getUserTeamIdsByTeamRole(interfaces_1.TeamRoleName.TEAM_ADMIN);
        }
        return [];
    };
}
exports.default = TeamPermissionService;
//# sourceMappingURL=teamPermission.js.map