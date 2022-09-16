"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessToAllReposRoles = void 0;
const subscription_1 = require("../../helpers/subscription");
const config_1 = require("../../../config");
const interfaces_1 = require("../../interfaces");
const permissions_1 = require("../../helpers/core-api/permissions");
const common_1 = require("../../helpers/common");
const accounts_1 = require("../../helpers/core-api/accounts");
exports.accessToAllReposRoles = [
    interfaces_1.SystemUserRoleName.OWNER,
    interfaces_1.UserRoleName.ADMIN,
    interfaces_1.UserRoleName.SECURITY_ENGINEER
];
class PolicyService {
    planCode;
    rootAccountId;
    userRole;
    policies = [];
    allowedRepositories;
    userTeamRoles = [];
    userTeamIdsByTeamRole;
    constructor(userInDb, options = {}) {
        this.userRole = interfaces_1.UserRoleName.DEVELOPER; // By default, role is developer in case the user has no role in the DB
        if (userInDb?.role) {
            // If the role is owner, we use admin, which works the same way, but this way we don't need to add owner in the policies
            this.userRole =
                userInDb?.role.name === interfaces_1.SystemUserRoleName.OWNER ? interfaces_1.UserRoleName.ADMIN : userInDb.role.name;
        }
        const { allAccountRepositoryIds = [], allowedRepositoryIdsGroupedByTeamRole, ACLAllowedRepositories = { read: [], admin: [] }, userTeamIdsByTeamRole = {} } = options;
        this.userTeamRoles = Object.keys(allowedRepositoryIdsGroupedByTeamRole ?? userTeamIdsByTeamRole ?? {});
        this.allowedRepositories = {
            account: allAccountRepositoryIds,
            aclRead: ACLAllowedRepositories.read.concat(ACLAllowedRepositories.admin),
            aclWrite: ACLAllowedRepositories.admin,
            teamRole: allowedRepositoryIdsGroupedByTeamRole
        };
        this.userTeamIdsByTeamRole = userTeamIdsByTeamRole;
    }
    static async createInstance(account, userInDb, options = {}) {
        return new PolicyService(userInDb, options).initAccount(account);
    }
    async initAccount(account) {
        // If the account has a root account (which is not itself), we get the root account to then
        // check for the subscription plan of that account to use for permissions calculations.
        const rootAccount = account.idRootAccount && account.idRootAccount !== account.idAccount
            ? await (0, accounts_1.findAccountById)(account.idRootAccount)
            : account;
        this.planCode =
            config_1.env.ENVIRONMENT === 'onpremise' ? interfaces_1.SpecialPlanCode.ONPREMISE : (0, subscription_1.getAccountPlanCode)(rootAccount);
        // We also save the id of that root account to retrieve the policies from there
        this.rootAccountId = account.idRootAccount;
        return this;
    }
    async init(action, resources) {
        await this.initPolicies(action, resources);
        return this;
    }
    getUserRole() {
        return this.userRole;
    }
    getUserTeamRoles() {
        return this.userTeamRoles;
    }
    getPolicies() {
        return this.policies;
    }
    getAccountRepositoryIds() {
        return this.allowedRepositories.account;
    }
    getRepositoryIdsGroupedByTeamRole() {
        return this.allowedRepositories.teamRole;
    }
    getACLRepositories(role) {
        const repositoryMap = {
            [interfaces_1.ACLUserRole.ADMIN]: this.allowedRepositories.aclWrite,
            [interfaces_1.ACLUserRole.READ]: this.allowedRepositories.aclRead
        };
        return repositoryMap[role];
    }
    getUserTeamIdsByTeamRole(teamRole) {
        return this.userTeamIdsByTeamRole[teamRole] || [];
    }
    getAllUserTeamIds() {
        return Object.values(this.userTeamIdsByTeamRole).flat();
    }
    async initPolicies(action, resources) {
        const roles = [
            this.userRole,
            interfaces_1.ACLUserRole.READ,
            interfaces_1.ACLUserRole.ADMIN,
            ...Object.values(interfaces_1.TeamRoleName)
        ];
        if (roles.length && resources.length && this.rootAccountId && this.planCode) {
            this.policies = await (0, permissions_1.getPermissionPolicies)(this.rootAccountId, this.planCode, roles, (0, common_1.toArray)(resources), action);
        }
        return this;
    }
}
exports.default = PolicyService;
//# sourceMappingURL=policy.js.map