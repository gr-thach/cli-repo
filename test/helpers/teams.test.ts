import Octokit from '@octokit/rest';
import moxios from 'moxios';
import { findRepositoryIdsByProviderInternalId } from '../../src/helpers/core-api/repositories';
import { findAllTeamRoles } from '../../src/helpers/core-api/roles';

import * as teams from '../../src/helpers/core-api/teams';
import { getUserIdsByProviderInternalIds } from '../../src/helpers/core-api/users';
import { getTeamsFromGitProvider, importGitProviderTeams } from '../../src/helpers/teams';
import {
  Account,
  AccountType,
  GitProvider,
  RequestUser,
  SessionProvider,
  TeamRoleName
} from '../../src/interfaces';
import GitHubService from '../../src/services/git/github';

jest.mock('../../src/helpers/core-api/roles');
jest.mock('../../src/helpers/core-api/repositories');
jest.mock('../../src/helpers/core-api/teams');
jest.mock('../../src/helpers/core-api/users');
jest.mock('../../src/helpers/github');
jest.mock('../../src/services/git/github');

const getImportedTeamIds = teams.getImportedTeamIds as jest.MockedFn<
  typeof teams.getImportedTeamIds
>;

const bulkCreateTeams = teams.bulkCreateTeams as jest.MockedFn<typeof teams.bulkCreateTeams>;
const bulkAddUsers = teams.bulkAddUsers as jest.MockedFn<typeof teams.bulkAddUsers>;
const bulkAddRepositories = teams.bulkAddRepositories as jest.MockedFn<
  typeof teams.bulkAddRepositories
>;
const mockGetUserIdsByProviderInternalIds = getUserIdsByProviderInternalIds as jest.MockedFn<
  typeof getUserIdsByProviderInternalIds
>;

const mockFindAllTeamRoles = findAllTeamRoles as jest.MockedFn<typeof findAllTeamRoles>;

const mockFindRepositoryIdsByProviderInternalId = findRepositoryIdsByProviderInternalId as jest.MockedFn<
  typeof findRepositoryIdsByProviderInternalId
>;

describe('Teams helpers', () => {
  beforeEach(() => {
    moxios.install();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    moxios.uninstall();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const user: RequestUser = {
    provider: SessionProvider.GITHUB,
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
    provider: GitProvider.GITHUB,
    installationId: 123,
    type: AccountType.ORGANIZATION,
    fkParentAccount: null
  };

  const mockTeam = (index: number): Octokit.TeamsListResponseItem => ({
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

  const getTeamDetail = (team: Octokit.TeamsListResponseItem) => ({
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

  jest.spyOn(GitHubService.prototype, 'getAllOrgTeams').mockResolvedValueOnce(teamsFromGitProvider);

  jest.spyOn(GitHubService.prototype, 'getATeamBySlug').mockImplementation((_, teamSlug) => {
    const team = teamsFromGitProvider.find(t => t.slug === teamSlug);
    return Promise.resolve({
      ...team,
      parent: teamSlug === 'team-2' ? teamsFromGitProvider[0] : null,
      members_count: 2,
      repos_count: 3
    } as Octokit.TeamsGetByNameResponse);
  });

  jest.spyOn(GitHubService.prototype, 'getTeamMembers').mockImplementation(({ role, team }) => {
    if (role === 'maintainer') {
      return Promise.resolve([
        { id: 0, teamId: team.id } as Octokit.TeamsListMembersResponseItem & { teamId: number }
      ]);
    }
    return Promise.resolve([
      { id: 2, teamId: team.id } as Octokit.TeamsListMembersResponseItem & { teamId: number }
    ]);
  });

  jest
    .spyOn(GitHubService.prototype, 'getTeamRepositories')
    .mockImplementation((_, team) =>
      Promise.resolve([
        { id: 0, teamId: team.id } as Octokit.TeamsListReposResponseItem & { teamId: number }
      ])
    );

  describe('getTeamsFromGitProvider', () => {
    it('should return list teams from git provider that are not imported to GR', async () => {
      getImportedTeamIds.mockResolvedValueOnce([
        { idTeam: 1, providerInternalId: '5' },
        { idTeam: 2, providerInternalId: '7' },
        { idTeam: 3, providerInternalId: '1' }
      ]);

      const response = await getTeamsFromGitProvider(user, account as Account);

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
          name: TeamRoleName.DEVELOPER,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          idTeamRole: 2,
          name: TeamRoleName.TEAM_ADMIN,
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);

      mockFindRepositoryIdsByProviderInternalId.mockResolvedValueOnce([
        { idRepository: 1, providerInternalId: '0' }
      ]);

      await importGitProviderTeams({
        user,
        account: account as Account,
        teams: [teamsFromGitProvider[0], teamsFromGitProvider[1]].map(t => getTeamDetail(t))
      });

      expect(teams.bulkCreateTeams).toBeCalledWith(
        [teamsFromGitProvider[0], teamsFromGitProvider[1]].map(t => ({
          name: t.name,
          description: t.description,
          providerInternalId: String(t.id),
          fkAccount: account.idAccount,
          provider: user.provider,
          createdAt: new Date('2022-02-28'),
          updatedAt: new Date('2022-02-28')
        }))
      );

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
