"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const permission_1 = __importDefault(require("../../src/services/permissions/permission"));
const policy_1 = __importDefault(require("../../src/services/permissions/policy"));
const permissions_1 = require("../../src/helpers/core-api/permissions");
const interfaces_1 = require("../../src/interfaces");
jest.mock('../../src/helpers/core-api/permissions');
const mockDBPolicies = (policies) => {
    permissions_1.getPermissionPolicies.mockReturnValueOnce(policies.map(p => ({
        idPermission: Math.floor(Math.random() * (100 - 50)) + 50,
        fkAccount: 1,
        plans: p[0],
        role: p[1],
        resource: p[2],
        actions: p[3]
    })));
};
// Plan = FREE, Resource = Actions, action = write
const mockDBPoliciesForCase1 = () => {
    mockDBPolicies([
        // plans, role, resource, actions
        [['FREE'], 'acl_admin', 'Actions', ['write']],
        [['FREE'], 'team_admin', 'Actions', ['write']],
        [['FREE'], 'team_security_engineer', 'Actions', ['write']]
    ]);
};
// Plan = FREE, Resource = Repositories, action = write
const mockDBPoliciesForCase2 = () => {
    mockDBPolicies([
        [['FREE'], 'acl_admin', 'Repositories', ['write']],
        [['FREE'], 'admin', 'Repositories', ['write']],
        [['FREE'], 'team_admin', 'Repositories', ['write']]
    ]);
};
// Plan = FREE, Resource = JiraConfig, action = write
const mockDBPoliciesForCase3 = () => {
    mockDBPolicies([
        [['FREE'], 'acl_admin', 'JiraConfig', ['write']],
        [['FREE'], 'team_admin', 'JiraConfig', ['write']]
    ]);
};
// Plan = FREE, Resource = Repositories, action = write
const mockDBPoliciesForCase4 = () => {
    mockDBPolicies([[['FREE'], 'team_developer', 'Repositories', ['write']]]);
};
// Plan = FREE, Resource = Teams, action = write
const mockDBPoliciesForCase5 = () => {
    mockDBPolicies([
        [['FREE'], 'manager', 'Teams', ['write']],
        [['FREE'], 'team_admin', 'Teams', ['write']]
    ]);
};
// Plan = FREE, Resource = Repositories, action = read
const mockDBPoliciesForCase6 = () => {
    mockDBPolicies([
        [['FREE'], 'acl_read', 'Repositories', ['read']],
        [['FREE'], 'team_admin', 'Repositories', ['read']],
        [['FREE'], 'team_developer', 'Repositories', ['read']]
    ]);
};
const createPolicyWithPlanAndRole = (planCode, userRole) => async (allAccountRepositoryIds, allowedRepositories, allowedRepositoryIdsGroupedByTeamRole) => {
    const account = {
        idAccount: 1,
        fkParentAccount: null,
        idRootAccount: 1,
        childrenQty: 0,
        installationId: null,
        login: 'test',
        provider: interfaces_1.GitProvider.GITHUB,
        providerInternalId: '',
        type: interfaces_1.AccountType.ORGANIZATION,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
        configuration: null,
        cliToken: '',
        providerMetadata: {},
        filterReposByWriteAccess: false,
        findingConfiguration: {
            requireApprovalOnUpdate: false
        },
        usersSynchronized: true,
        subscription: {
            idSubscription: 1,
            fkPlan: 1,
            interval: interfaces_1.SubscriptionInterval.MONTHLY,
            periodStart: null,
            periodEnd: null,
            stripeSubscriptionId: null,
            stripeCustomerId: '',
            status: null,
            hadFreeTrial: false,
            isCheckoutCompleted: false,
            trialEnd: 0,
            cancelAtPeriodEnd: false,
            extraRepositories: 0,
            updatedAt: '',
            plan: {
                idPlan: 1,
                code: planCode,
                name: '',
                description: '',
                bullets: '',
                queuePriority: 0,
                createdAt: '',
                updatedAt: '',
                features: []
            }
        }
    };
    const userInDb = {
        idUser: 'some-id-blah',
        apiKey: null,
        createdAt: '',
        updatedAt: '',
        deletedAt: null,
        login: 'test-user',
        provider: interfaces_1.GitProvider.GITHUB,
        providerAccessToken: null,
        providerRefreshToken: null,
        providerInternalId: null,
        name: 'Test User',
        avatarUrl: null,
        email: null,
        providerAccessTokenSecret: null,
        providerMetadata: null,
        acl: null,
        lastLoginAt: null,
        role: {
            idRole: 1,
            name: userRole,
            description: '',
            createdAt: '',
            updatedAt: ''
        }
    };
    const options = {
        ACLAllowedRepositories: allowedRepositories || { read: [], admin: [] },
        allAccountRepositoryIds,
        allowedRepositoryIdsGroupedByTeamRole: allowedRepositoryIdsGroupedByTeamRole
    };
    const policy = await policy_1.default.createInstance(account, userInDb, options);
    return policy;
};
describe('PermissionService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });
    let resource;
    let action;
    let createPolicy;
    describe('Case 1: resource = Actions, action = write, user = developer', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.ACTIONS;
            action = interfaces_1.PermissionAction.WRITE;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.UserRoleName.DEVELOPER);
        });
        describe('PermissionService.enforce', () => {
            it('Should throw when no ACL, no teams, only account repositories', async () => {
                expect.hasAssertions();
                mockDBPoliciesForCase1();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
                const permission = await permission_1.default.factory(policy, action, resource);
                try {
                    permission.repositoriesEnforce([1, 2, 3]);
                }
                catch (err) {
                    expect(err.message).toBe('You have insufficient permissions.');
                }
            });
            it('Should pass and getAllowedIds return the allowed id from admin acl', async () => {
                mockDBPoliciesForCase1();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {
                    read: [],
                    admin: [1]
                });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds();
                expect(allowedIds).toEqual([1]);
            });
            it('Should pass and getAllowedIds return the allowed id from the teams', async () => {
                mockDBPoliciesForCase1();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], undefined, {
                    team_admin: [9, 10],
                    team_developer: [],
                    team_security_engineer: []
                });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds();
                expect(allowedIds).toEqual([9, 10]);
            });
            it("Should pass when the repository is in the user's acl or team repositories", async () => {
                mockDBPoliciesForCase1();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6], { read: [], admin: [1] }, { team_admin: [2, 3], team_developer: [], team_security_engineer: [] });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds(1);
                expect(allowedIds).toEqual([1]);
            });
        });
    });
    describe('Case 2: resource = Repositories, action = write, user = owner', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.REPOSITORIES;
            action = interfaces_1.PermissionAction.WRITE;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.SystemUserRoleName.OWNER);
        });
        describe('PermissionService.enforce', () => {
            it('Should treat owner role as admin role', async () => {
                mockDBPoliciesForCase2();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6]);
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds();
                expect(allowedIds).toEqual([1, 2, 3, 4, 5, 6]);
            });
        });
        describe('PermissionService.getAllowedResources', () => {
            it('Should allow user with admin role access all possible resources', async () => {
                mockDBPoliciesForCase2();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6]);
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedResources = permission.enforce().getAllowedResources();
                expect(allowedResources).toEqual(['Repositories']);
            });
        });
    });
    describe('Case 3: resource = Repositories, action = write, user = developer', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.JIRA_CONFIG;
            action = interfaces_1.PermissionAction.WRITE;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.UserRoleName.DEVELOPER);
        });
        describe('PermissionService.enforce', () => {
            it('When a developer wants to access repositories that are in the ACL and Teams but not both, it should allow all the accessible ones', async () => {
                mockDBPoliciesForCase3();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6], { read: [], admin: [1, 2, 3] }, { team_admin: [4, 5, 6], team_developer: [], team_security_engineer: [] });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.repositoriesEnforce([1, 2, 3, 4, 5, 6]);
                expect(allowedIds).toEqual([1, 2, 3, 4, 5, 6]);
            });
        });
    });
    describe('Case 4: resource = Repositories, action = read, user = developer', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.REPOSITORIES;
            action = interfaces_1.PermissionAction.READ;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.UserRoleName.DEVELOPER);
        });
        describe('PermissionService.enforce', () => {
            it('When a developer wants to access repositories that do not exist in the account, it should throw exception', async () => {
                expect.hasAssertions();
                mockDBPoliciesForCase4();
                const policy = await createPolicy([1, 2, 3, 4, 5, 6], { read: [1, 2], admin: [5, 6] }, { team_admin: [4, 5, 6], team_developer: [], team_security_engineer: [] });
                const permission = await permission_1.default.factory(policy, action, resource);
                try {
                    permission.repositoriesEnforce([999, 9999, 99999]);
                }
                catch (err) {
                    expect(err.message).toBe('You have insufficient permissions.');
                }
            });
        });
    });
    describe('Case 5: resource = Teams, action = write, user = manager', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.TEAMS;
            action = interfaces_1.PermissionAction.WRITE;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.UserRoleName.MANAGER);
        });
        describe('Permission.getAllowedIds', () => {
            it('Should allow user access to all accessible repositories', async () => {
                mockDBPoliciesForCase5();
                const policy = await createPolicy([1, 2, 3], { read: [1, 2], admin: [3] }, { team_admin: [4, 5], team_developer: [], team_security_engineer: [] });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds();
                expect(allowedIds).toEqual([1, 2, 3, 4, 5]);
            });
        });
    });
    describe('Case 6: resource = Repositories, action = read, user = manager', () => {
        beforeEach(async () => {
            resource = interfaces_1.Resource.REPOSITORIES;
            action = interfaces_1.PermissionAction.READ;
            createPolicy = createPolicyWithPlanAndRole(interfaces_1.PlanCode.FREE, interfaces_1.UserRoleName.MANAGER);
        });
        describe('Permission.getAllowedIds', () => {
            it('Should allow user access to all accessible repositories', async () => {
                mockDBPoliciesForCase6();
                const policy = await createPolicy([1, 2, 3], { read: [1, 2], admin: [3] }, { team_admin: [4, 5], team_developer: [6], team_security_engineer: [] });
                const permission = await permission_1.default.factory(policy, action, resource);
                const allowedIds = permission.getAllowedIds([1, 2, 3, 4, 5, 6, 7]);
                expect(allowedIds).toEqual([1, 2, 3, 4, 5, 6]);
            });
        });
    });
});
//# sourceMappingURL=permission.test.js.map