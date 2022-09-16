"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const teams_1 = require("../../src/controllers/teams");
const teams_2 = require("../../src/helpers/core-api/teams");
const teamPermission_1 = __importDefault(require("../../src/services/permissions/teamPermission"));
const getAllowedIdsMock = jest.fn();
jest.mock('../../src/services/permissions/teamPermission', () => {
    return jest.fn().mockImplementation(() => ({
        enforce: jest.fn(),
        teamsEnforce: getAllowedIdsMock,
        getAllowedIds: getAllowedIdsMock
    }));
});
const teamPermissionMock = new teamPermission_1.default();
jest.mock('../../src/helpers/core-api/teams');
jest.mock('../../src/helpers/acl');
jest.mock('../../config', () => ({
    ...jest.requireActual('../../config'),
    env: {
        GITHUB_API_URL: 'https://api.github.com',
        GITLAB_URL: 'https://gitlab.com',
        BITBUCKET_DATA_CENTER_API_URL: 'https://bitbucket.example.com',
        BITBUCKET_DATA_CENTER_SITE_URL: 'https://bitbucket.example.com',
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY: 'consumer',
        // This is a random generated private key.
        BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET: 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBc2tlV2NUM3hQQTRHVDF5YklDSmR0bUhDVDZGd1RzMWNWbW9WUXRheTJQOUdzT1d6CnIybEhUcVl2UTAwdUd0aTlNU3pNWTlaazVmNEpQT1phQUI3WGpJY2pkcmRjZksraGk1bjJKMXFwa3hVK3NDUGIKc1BvWDBCUFJzWXByZGd4TnJYYWRLbCtlYkhRYUJsTUhTWWZ0cDNXNGl4N0NkTFN4dS9Db2tHVS9sVEdoUWwyTQpYODJ2alZOR2tJMlNyWEkzYmJzWXFKV1EyNDVVcWJwcXNGYjFrc25yTmpsdENCeElwSDlud3NVWUhqQWpnaEt0CmF6b1QwanpLT2hobHJIVURzM09LdUtSa0NlZmk0KzJ2VUVKRW5JdCtoTzc0ZkRQTG05SFh4dDE4RUM0S2dmSCsKWVlDTHgzeXJvdmhCK052RVZnaVJvZVFNaEg3Z1VzdWNpYnZ2bFFJREFRQUJBb0gvU29PaFhiT0dJSk84RDIrbApac2oyWWtSNThzNkhJbWl6TDJzbmQ4aEUrRzI2SGpYajVHMGNZTU1VL2d4RU9QUmVIeSthUGlCZUM4TWlHVkl1ClM5NllPU1JDcmx2MVRDZ2NYVHo4cFhZL2FqcDIrU2dEcXZUYy94dEppZXRRL3dZbGNWc2lWWk9obzdMakxjR0cKU2pXR0gzZ1VxaEV4TlpaUXN6empOM2NhSEVEdlFDU0l2RHBLY0puSm1DbHFhQ0U5TFJ4cVJJQ3NsMkNrd09ncgppb0lWdXphLzFZODQxaXAxYmtaazl0L1VxbEtVMHo2MEthbFJHc3ZkWDFnNDNZUXcrdXE3M29wb1FwbGM5YThSCml6eHZZSVVRZEIxQmhkMFFoMU90UnNPMVF3SG5iRm1ETlZ4SU1tVUNTSzh5NldGV0ZqRm9zTXpSVml5WFY4ZzgKS0pBbEFvR0JBT0tsZXBNOWhvT1lSWDcxQ1g0dC9QRi93Ym5zVzRGbjJqc0lUUGRKdnRkZHVPV0x5ZitWNjdFOQpMcnJDTnRMeHhqbjNZQWR5b1pYVnMyM09JMERrVjdTM2RYZlh0UXdjTVBxdXpRaDRxVEIzelZVYVZXR1JhdGlICndwK2V4OFJrMEJXaXMzZmN6dlhweDl6L0JiWUlSSGtPVVFsY296eG9hbEowNmxzR3UzY1BBb0dCQU1sZWZ3Q2EKZVZvMTZWa1ZwL0drYnZGMWdyaSswTzI3V3dQSXlJeWxrZFhiMUE4ZTdoakNtNHhuODhranpQZFNVOG9WNFR1NQpoRFJnd0haVjdJc29jT2xQZU1iVVVNWjJFcmxwcHBERHVwL1Y1Y2RpL3NVK1BNY1RIM20wTUJLRnhIQkF1eGNnCmd2UTd5ZGo2eitWdUFsMU5vTkJURzdWM0EvcXZoMW1VTzQ4YkFvR0JBSmVEMEtIR0s3cWxmVEFXVjdaR3dDWWkKSmp4SXloT0VmZHVnL1BNRUZkU2NEeE5GbEZDTXhQZkQwdzErOEcrc3VidmVxQS9Tamp0QWxhYitlNHJTRzkvdwpGVk44bk1mdndMNlZSUFE0MWNKVkZLdWo0eGhLd29ibW16RmlVR0gya3pVamc1N0p1b0dqTzcxOXJ5KzE3ekNPClpaWkFtOCt5YmdHWnIySVM2aGY1QW9HQkFLei9LTjdzMXhxZ1BGUFRYaEFrTTBmdnE1bHFIWFpQd25aeTFaQzMKWVoyNEdPdlFwNzdQMmZCN0VoNllTaXVrSitYeWZDamlUV2p1UWdxbjhPcndtR2hvWlJ0MEpkMEtiVFdyUlhVVApJazdVNVc0eFp5MHZOZW5WVFBJeTBpWG5sQWJZSmFOTnhCTnRGaEQ2RVFkTFJtN0FGVXRFU3diUU03UDNmckYvCnZ0ZEhBb0dBTy8vNWczWk1jV1lDN0FmOHFNdG1FV3RFY1UzZnc5RnpiSk14MG5TY0ljQzNzSWliekJLSGlLcjAKcUYvbVo3ektLR3FlTDJrSVBBREVjU0lQcWNpYnNtWUtIRWsybU1Icms3MGRSSGs2Z2FQZkJHSzRHeWFiSkVDbgpHTVBacnc1aXU4ZlVqb2xaaytxWk95dk00YmFzYmxMMVZOVU0yd0szZkVQZ0IrMkJEbHM9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0t'
    }
}));
describe('Teams controller', () => {
    const send = jest.fn();
    const status = jest.fn();
    let res;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        res = {
            status: jest.fn(() => {
                return {
                    status,
                    send
                };
            })
        };
        teamPermission_1.default.factory = jest.fn(() => new teamPermission_1.default({}));
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    describe('list teams', () => {
        it('Should return teams', async () => {
            const req = {
                query: { accountId: 1, limit: 0, offset: 16 },
                account: { idAccount: 1 },
                teamPermission: teamPermissionMock
            };
            getAllowedIdsMock
                .mockReturnValueOnce([])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            const teams = [
                {
                    idTeam: 1,
                    name: 'Frontend',
                    description: 'Frontend team',
                    department: 'Development'
                },
                {
                    idTeam: 2,
                    name: 'Backend',
                    description: 'Backend team',
                    department: 'Development'
                },
                {
                    idTeam: 3,
                    name: 'Security Engineers',
                    description: 'Security Engineers team',
                    department: 'Cybersecurity'
                }
            ];
            teams_2.queryTeams.mockReturnValueOnce({ teams, totalCount: 3 });
            await (0, teams_1.list)(req, res);
            expect(send).toBeCalledWith({
                teams: teams.map(team => ({ ...team, write: false })),
                totalCount: 3
            });
            expect(teams_2.queryTeams).toBeCalledWith(1, { search: undefined, department: undefined }, 0, 16);
        });
    });
    describe('get team filters', () => {
        it('Should return team filters', async () => {
            const req = {
                query: { accountId: 1 },
                account: { idAccount: 1 },
                teamPermission: teamPermissionMock
            };
            const teamFilters = {
                department: ['Development', 'Security', 'Automation']
            };
            teams_2.queryTeamsFilters.mockReturnValueOnce(teamFilters);
            await (0, teams_1.filters)(req, res);
            expect(send).toBeCalledWith(teamFilters);
            expect(teams_2.queryTeamsFilters).toBeCalledWith(1, { search: undefined, department: undefined });
        });
    });
    describe('get team by id', () => {
        it('Should return team by id', async () => {
            const req = {
                query: { accountId: 2 },
                params: { teamId: 10 },
                account: { idAccount: 2 },
                teamPermission: teamPermissionMock
            };
            getAllowedIdsMock.mockReturnValueOnce([10]).mockReturnValueOnce([10]);
            const team = {
                idTeam: 10,
                name: 'Frontend',
                description: 'Frontend team',
                department: 'Development',
                write: true
            };
            teams_2.queryTeamById.mockReturnValueOnce(team);
            await (0, teams_1.getById)(req, res);
            expect(send).toBeCalledWith(team);
            expect(teams_2.queryTeamById).toBeCalledWith(2, 10);
        });
    });
    describe('create team', () => {
        it('Should create team', async () => {
            const team = {
                name: 'Frontend',
                description: 'Frontend team',
                department: 'Development'
            };
            const req = {
                query: { accountId: 3 },
                body: { team },
                account: { idAccount: 3 },
                teamPermission: teamPermissionMock
            };
            teams_2.createTeam.mockReturnValueOnce({ idTeam: 100, ...team });
            await (0, teams_1.create)(req, res);
            expect(send).toBeCalledWith({ idTeam: 100, ...team });
            expect(teams_2.createTeam).toBeCalledWith(3, team);
        });
    });
    describe('patch team', () => {
        it('Should patch team', async () => {
            const _patch = {
                name: 'Frontend edited',
                description: 'Frontend team edited',
                department: 'Development edited'
            };
            const req = {
                query: { accountId: 3 },
                params: { teamId: 200 },
                body: { patch: _patch },
                account: { idAccount: 3 },
                teamPermission: teamPermissionMock
            };
            teams_2.updateTeam.mockReturnValueOnce({ idTeam: 200, ..._patch });
            await (0, teams_1.patch)(req, res);
            expect(send).toBeCalledWith({ idTeam: 200, ..._patch });
            expect(teams_2.updateTeam).toBeCalledWith(3, 200, _patch);
        });
    });
    describe('destroy team', () => {
        it('Should destroy team', async () => {
            const req = {
                query: { accountId: 4 },
                params: { teamId: 300 },
                account: { idAccount: 4 },
                teamPermission: teamPermissionMock
            };
            teams_2.destroyTeam.mockReturnValueOnce('ok');
            await (0, teams_1.destroy)(req, res);
            expect(send).toBeCalledWith('ok');
            expect(teams_2.destroyTeam).toBeCalledWith(4, 300);
        });
    });
    describe('team applications', () => {
        it('Should add applications to team', async () => {
            const applicationIds = [1, 2, 5];
            const req = {
                query: { accountId: 5 },
                params: { teamId: 400 },
                body: { applicationIds },
                account: { idAccount: 5 },
                teamPermission: teamPermissionMock
            };
            teams_2.addTeamApplications.mockReturnValueOnce({ addedApplications: 3 });
            await (0, teams_1.addApplications)(req, res);
            expect(send).toBeCalledWith({ addedApplications: 3 });
            expect(teams_2.addTeamApplications).toBeCalledWith(5, 400, applicationIds);
        });
        it('Should replace applications of team', async () => {
            const applicationIds = [1, 2, 4, 8, 10];
            const req = {
                query: { accountId: 6 },
                params: { teamId: 500 },
                body: { applicationIds },
                account: { idAccount: 6 },
                teamPermission: teamPermissionMock
            };
            teams_2.putTeamApplications.mockReturnValueOnce({ addedApplications: 3, removedApplications: 1 });
            await (0, teams_1.putApplications)(req, res);
            expect(send).toBeCalledWith({ addedApplications: 3, removedApplications: 1 });
            expect(teams_2.putTeamApplications).toBeCalledWith(6, 500, applicationIds);
        });
        it('Should remove applications from team', async () => {
            const applicationIds = [1, 4, 11];
            const req = {
                query: { accountId: 7 },
                params: { teamId: 600 },
                body: { applicationIds },
                account: { idAccount: 7 },
                teamPermission: teamPermissionMock
            };
            teams_2.removeTeamApplications.mockReturnValueOnce({ removedApplications: 2 });
            await (0, teams_1.removeApplications)(req, res);
            expect(send).toBeCalledWith({ removedApplications: 2 });
            expect(teams_2.removeTeamApplications).toBeCalledWith(7, 600, applicationIds);
        });
    });
    describe('team repositories', () => {
        it('Should add repositories to team', async () => {
            const repositoryIds = [100, 200, 500];
            const req = {
                query: { accountId: 8 },
                params: { teamId: 700 },
                body: { repositoryIds },
                account: { idAccount: 8 },
                teamPermission: teamPermissionMock
            };
            teams_2.addTeamRepositories.mockReturnValueOnce({ addedRepositories: 3 });
            await (0, teams_1.addRepositories)(req, res);
            expect(send).toBeCalledWith({ addedRepositories: 3 });
            expect(teams_2.addTeamRepositories).toBeCalledWith(8, 700, repositoryIds);
        });
        it('Should replace repositories of team', async () => {
            const repositoryIds = [100, 200, 400, 800, 1000];
            const req = {
                query: { accountId: 9 },
                params: { teamId: 800 },
                body: { repositoryIds },
                account: { idAccount: 9 },
                teamPermission: teamPermissionMock
            };
            teams_2.putTeamRepositories.mockReturnValueOnce({ addedRepositories: 3, removedRepositories: 1 });
            await (0, teams_1.putRepositories)(req, res);
            expect(send).toBeCalledWith({ addedRepositories: 3, removedRepositories: 1 });
            expect(teams_2.putTeamRepositories).toBeCalledWith(9, 800, repositoryIds);
        });
        it('Should remove repositories from team', async () => {
            const repositoryIds = [100, 400, 1100];
            const req = {
                query: { accountId: 10 },
                params: { teamId: 900 },
                body: { repositoryIds },
                account: { idAccount: 10 },
                teamPermission: teamPermissionMock
            };
            teams_2.removeTeamRepositories.mockReturnValueOnce({ removedRepositories: 2 });
            await (0, teams_1.removeRepositories)(req, res);
            expect(send).toBeCalledWith({ removedRepositories: 2 });
            expect(teams_2.removeTeamRepositories).toBeCalledWith(10, 900, repositoryIds);
        });
    });
    describe('team users/members', () => {
        it('Should add users to team', async () => {
            const users = [
                { userId: 1000, teamRoleId: 1 },
                { userId: 2000, teamRoleId: 2 },
                { userId: 5000, teamRoleId: 3 }
            ];
            const req = {
                query: { accountId: 9 },
                params: { teamId: 800 },
                body: { users },
                account: { idAccount: 9 },
                teamPermission: teamPermissionMock
            };
            teams_2.addTeamUsers.mockReturnValueOnce({ addedUsers: 3 });
            await (0, teams_1.addUsers)(req, res);
            expect(send).toBeCalledWith({ addedUsers: 3 });
            expect(teams_2.addTeamUsers).toBeCalledWith(9, 800, users);
        });
        it('Should update users roles of team', async () => {
            const users = [
                { userId: 1000, teamRoleId: 3 },
                { userId: 2000, teamRoleId: 3 },
                { userId: 4000, teamRoleId: 1 },
                { userId: 800, teamRoleId: 3 },
                { userId: 1000, teamRoleId: 2 }
            ];
            const req = {
                query: { accountId: 10 },
                params: { teamId: 900 },
                body: { users },
                account: { idAccount: 10 },
                teamPermission: teamPermissionMock,
                userInDb: {}
            };
            teams_2.updateTeamUsersRoles.mockReturnValueOnce({ updatedUsers: 5 });
            await (0, teams_1.patchUsers)(req, res);
            expect(send).toBeCalledWith({ updatedUsers: 5 });
            expect(teams_2.updateTeamUsersRoles).toBeCalledWith(10, 900, users);
        });
        it('Should replace users of team', async () => {
            const users = [
                { userId: 1000, teamRoleId: 1 },
                { userId: 2000, teamRoleId: 2 },
                { userId: 4000, teamRoleId: 3 },
                { userId: 800, teamRoleId: 1 },
                { userId: 1000, teamRoleId: 1 }
            ];
            const req = {
                query: { accountId: 11 },
                params: { teamId: 1000 },
                body: { users },
                account: { idAccount: 11 },
                teamPermission: teamPermissionMock
            };
            teams_2.putTeamUsers.mockReturnValueOnce({ addedUsers: 3, removedUsers: 1 });
            await (0, teams_1.putUsers)(req, res);
            expect(send).toBeCalledWith({ addedUsers: 3, removedUsers: 1 });
            expect(teams_2.putTeamUsers).toBeCalledWith(11, 1000, users);
        });
        it('Should remove users from team', async () => {
            const userIds = [1000, 4000, 11000];
            const req = {
                query: { accountId: 12 },
                params: { teamId: 1100 },
                body: { userIds },
                account: { idAccount: 12 },
                teamPermission: teamPermissionMock
            };
            teams_2.removeTeamUsers.mockReturnValueOnce({ removedUsers: 2 });
            await (0, teams_1.removeUsers)(req, res);
            expect(send).toBeCalledWith({ removedUsers: 2 });
            expect(teams_2.removeTeamUsers).toBeCalledWith(12, 1100, userIds);
        });
    });
});
//# sourceMappingURL=teams.test.js.map