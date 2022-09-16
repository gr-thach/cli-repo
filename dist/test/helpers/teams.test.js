"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moxios_1 = __importDefault(require("moxios"));
const repositories_1 = require("../../src/helpers/core-api/repositories");
const roles_1 = require("../../src/helpers/core-api/roles");
const teams = __importStar(require("../../src/helpers/core-api/teams"));
const users_1 = require("../../src/helpers/core-api/users");
const teams_1 = require("../../src/helpers/teams");
const interfaces_1 = require("../../src/interfaces");
const github_1 = __importDefault(require("../../src/services/git/github"));
jest.mock('../../src/helpers/core-api/roles');
jest.mock('../../src/helpers/core-api/repositories');
jest.mock('../../src/helpers/core-api/teams');
jest.mock('../../src/helpers/core-api/users');
jest.mock('../../src/helpers/github');
jest.mock('../../src/services/git/github');
const getImportedTeamIds = teams.getImportedTeamIds;
const bulkCreateTeams = teams.bulkCreateTeams;
const bulkAddUsers = teams.bulkAddUsers;
const bulkAddRepositories = teams.bulkAddRepositories;
const mockGetUserIdsByProviderInternalIds = users_1.getUserIdsByProviderInternalIds;
const mockFindAllTeamRoles = roles_1.findAllTeamRoles;
const mockFindRepositoryIdsByProviderInternalId = repositories_1.findRepositoryIdsByProviderInternalId;
describe('Teams helpers', () => {
    beforeEach(() => {
        moxios_1.default.install();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    afterEach(() => {
        moxios_1.default.uninstall();
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    const user = {
        provider: interfaces_1.SessionProvider.GITHUB,
        providerInternalId: '1',
        user: {
            id: '1',
            username: 'username',
            name: 'name',
            email: 'email',
            avatarUrl: ''
        }
    };
    const account = {
        idAccount: 1,
        provider: interfaces_1.GitProvider.GITHUB,
        installationId: 123,
        type: interfaces_1.AccountType.ORGANIZATION,
        fkParentAccount: null
    };
    const mockTeam = (index) => ({
        id: index,
        name: `Team ${index}`,
        slug: `team-${index}`,
        html_url: 'https://github.com',
        description: '',
        members_url: 'https://github.com',
        node_id: 'id',
        parent: null,
        permission: '',
        privacy: '',
        repositories_url: 'https://github.com',
        url: 'https://github.com'
    });
    const getTeamDetail = (team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        slug: team.slug,
        htmlUrl: team.html_url,
        memberCount: 2,
        repositoryCount: 3,
        children: []
    });
    const teamsFromGitProvider = new Array(4).fill(0).map((e, index) => mockTeam(index));
    jest.spyOn(github_1.default.prototype, 'getAllOrgTeams').mockResolvedValueOnce(teamsFromGitProvider);
    jest.spyOn(github_1.default.prototype, 'getATeamBySlug').mockImplementation((_, teamSlug) => {
        const team = teamsFromGitProvider.find(t => t.slug === teamSlug);
        return Promise.resolve({
            ...team,
            parent: teamSlug === 'team-2' ? teamsFromGitProvider[0] : null,
            members_count: 2,
            repos_count: 3
        });
    });
    jest.spyOn(github_1.default.prototype, 'getTeamMembers').mockImplementation(({ role, team }) => {
        if (role === 'maintainer') {
            return Promise.resolve([
                { id: 0, teamId: team.id }
            ]);
        }
        return Promise.resolve([
            { id: 2, teamId: team.id }
        ]);
    });
    jest
        .spyOn(github_1.default.prototype, 'getTeamRepositories')
        .mockImplementation((_, team) => Promise.resolve([
        { id: 0, teamId: team.id }
    ]));
    describe('getTeamsFromGitProvider', () => {
        it('should return list teams from git provider that are not imported to GR', async () => {
            getImportedTeamIds.mockResolvedValueOnce([
                { idTeam: 1, providerInternalId: '5' },
                { idTeam: 2, providerInternalId: '7' },
                { idTeam: 3, providerInternalId: '1' }
            ]);
            const response = await (0, teams_1.getTeamsFromGitProvider)(user, account);
            const teamResponse2 = {
                ...getTeamDetail(teamsFromGitProvider[2]),
                children: []
            };
            const teamResponse0 = {
                ...getTeamDetail(teamsFromGitProvider[0]),
                children: [teamResponse2]
            };
            const teamResponse3 = {
                ...getTeamDetail(teamsFromGitProvider[3]),
                children: []
            };
            expect(response).toStrictEqual({ teams: [teamResponse0, teamResponse3], total: 3 });
        });
    });
    describe('importGitProviderTeams', () => {
        jest.useFakeTimers().setSystemTime(new Date('2022-02-28'));
        it('should successfully import git provider teams', async () => {
            bulkCreateTeams.mockResolvedValueOnce({
                teamIds: [
                    { idTeam: 1, providerInternalId: '0' },
                    { idTeam: 2, providerInternalId: '1' }
                ]
            });
            bulkAddUsers.mockResolvedValueOnce({ addedUsers: 4 });
            bulkAddRepositories.mockResolvedValueOnce({ addedRepositories: 2 });
            mockGetUserIdsByProviderInternalIds.mockResolvedValueOnce([
                { idUser: '1', providerInternalId: '0' },
                { idUser: '3', providerInternalId: '2' }
            ]);
            mockFindAllTeamRoles.mockResolvedValueOnce([
                {
                    idTeamRole: 1,
                    name: interfaces_1.TeamRoleName.DEVELOPER,
                    description: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    idTeamRole: 2,
                    name: interfaces_1.TeamRoleName.TEAM_ADMIN,
                    description: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]);
            mockFindRepositoryIdsByProviderInternalId.mockResolvedValueOnce([
                { idRepository: 1, providerInternalId: '0' }
            ]);
            await (0, teams_1.importGitProviderTeams)({
                user,
                account: account,
                teams: [teamsFromGitProvider[0], teamsFromGitProvider[1]].map(t => getTeamDetail(t))
            });
            expect(teams.bulkCreateTeams).toBeCalledWith([teamsFromGitProvider[0], teamsFromGitProvider[1]].map(t => ({
                name: t.name,
                description: t.description,
                providerInternalId: String(t.id),
                fkAccount: account.idAccount,
                provider: user.provider,
                createdAt: new Date('2022-02-28'),
                updatedAt: new Date('2022-02-28')
            })));
            expect(teams.bulkAddUsers).toBeCalledWith([
                { fkTeam: 1, fkTeamRole: 1, fkUser: '3' },
                { fkTeam: 2, fkTeamRole: 1, fkUser: '3' },
                { fkTeam: 1, fkTeamRole: 2, fkUser: '1' },
                { fkTeam: 2, fkTeamRole: 2, fkUser: '1' }
            ]);
            expect(teams.bulkAddRepositories).toBeCalledWith([
                { fkTeam: 1, fkRepository: 1 },
                { fkTeam: 2, fkRepository: 1 }
            ]);
        });
    });
});
//# sourceMappingURL=teams.test.js.map