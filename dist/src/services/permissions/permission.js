"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const uniq_1 = __importDefault(require("lodash/uniq"));
const interfaces_1 = require("../../interfaces");
const common_1 = require("../../helpers/common");
class PermissionService {
    policy;
    matchingRole;
    constructor(policy) {
        this.policy = policy;
        const policyRoles = new Set(policy.getPolicies().map(({ role }) => role));
        const userRole = policyRoles.has(policy.getUserRole()) ? [policy.getUserRole()] : [];
        const teamRoles = policy.getUserTeamRoles().filter(r => policyRoles.has(r));
        const aclRoles = Object.values(interfaces_1.ACLUserRole).filter(r => policyRoles.has(r));
        this.matchingRole = { user: userRole, team: teamRoles, acl: aclRoles };
    }
    static async factory(policy, action, resources) {
        if (!policy) {
            throw boom_1.default.badRequest('Invalid request. The accountId query parameter is required.');
        }
        return new this(await policy.init(action, resources));
    }
    getAllowedResources() {
        return (0, uniq_1.default)(this.policy
            .getPolicies()
            .filter(p => Object.values(interfaces_1.UserRoleName).includes(p.role))
            .map(policy => policy.resource));
    }
    /**
     * Basic enforce method. It only checks whether a user can do an action over a resource with its own user role.
     * @returns this if allowed
     * @throws 401 forbidden exception if not allowed
     */
    enforce() {
        if (this.matchingRole.user.length) {
            return this;
        }
        throw boom_1.default.forbidden('You have insufficient permissions.');
    }
    /**
     * Checks whether the user has permissions over the repositoryIds or, if no repositoryIds, if the user is
     * allowed to do the desired action over some of the ids the user may have access to, returning the list of
     * those ids or throwing 401 exception if the user has no access or there are no allowed ids for this action
     * @param repositoryIds the ids of the repositories the user wants to apply the action to
     * @returns allowedIds the user can actually apply this action to
     */
    repositoriesEnforce(repositoryIds) {
        const hasNoMatchingRoles = !this.matchingRole.user.length &&
            !this.matchingRole.acl.length &&
            !this.matchingRole.team.length;
        if (hasNoMatchingRoles) {
            throw boom_1.default.forbidden('You have insufficient permissions.');
        }
        const allowedRepositoryIds = this.getAllowedIds(repositoryIds);
        if (repositoryIds && !allowedRepositoryIds.length) {
            throw boom_1.default.forbidden('You have insufficient permissions.');
        }
        return allowedRepositoryIds;
    }
    /**
     * Returns the list of repository ids the user can apply the desired action to
     * @param repositoryIds the ids of the repositories the user wants to apply the action to
     * @returns allowedIds the user can actually apply this action to. If repositoryIds param was sent, then
     * repositoryIds will be filtered by the entire list of repository ids the user has access to.
     */
    getAllowedIds(repositoryIds) {
        const parsedRepositoryIds = (0, common_1.toArray)(repositoryIds);
        let allAllowedRepositories = (0, uniq_1.default)([
            ...this.getAllowedACLRepositories(),
            ...this.getAllowedAccountRepositories(),
            ...this.getAllowedTeamRepositories()
        ]);
        if (parsedRepositoryIds.length) {
            allAllowedRepositories = parsedRepositoryIds.filter(repoId => allAllowedRepositories.includes(repoId));
        }
        return allAllowedRepositories;
    }
    getAllowedAccountRepositories() {
        if (this.matchingRole.user.length) {
            return this.policy.getAccountRepositoryIds();
        }
        return [];
    }
    getAllowedTeamRepositories() {
        const groupedRepositoryIds = this.policy.getRepositoryIdsGroupedByTeamRole();
        if (groupedRepositoryIds) {
            return this.matchingRole.team.flatMap(role => groupedRepositoryIds[role]);
        }
        return [];
    }
    getAllowedACLRepositories() {
        return this.matchingRole.acl.flatMap(role => this.policy.getACLRepositories(role));
    }
}
exports.default = PermissionService;
//# sourceMappingURL=permission.js.map