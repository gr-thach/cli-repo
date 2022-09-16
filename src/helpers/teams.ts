import Octokit from '@octokit/rest';
import { Account, GitProvider, GitProviderTeam, RequestUser, TeamRoleName } from '../interfaces';
import GitHubService from '../services/git/github';
import { findRepositoryIdsByProviderInternalId } from './core-api/repositories';
import { findAllTeamRoles } from './core-api/roles';
import {
  bulkAddRepositories,
  bulkAddUsers,
  bulkCreateTeams,
  getImportedTeamIds
} from './core-api/teams';
import { getUserIdsByProviderInternalIds } from './core-api/users';
import { gitServiceFactory } from './gitServiceFactory';

export const getTeamsFromGitProvider = async (user: RequestUser, account: Account) => {
  const gitService = gitServiceFactory(user, GitProvider.GITHUB) as GitHubService;

  const [teams, teamsInDb] = await Promise.all([
    gitService.getAllOrgTeams(account),
    getImportedTeamIds(account.idAccount, account.provider)
  ]);

  const providerTeamIds = teamsInDb.map(({ providerInternalId }) => providerInternalId);
  const teamsNotInDb = teams.filter(({ id }) => !providerTeamIds.includes(String(id)));

  if (teamsNotInDb.length) {
    const teamsDetails = await Promise.all(
      teamsNotInDb.map(team => gitService.getATeamBySlug(account, team.slug))
    );

    const teamsWithChildren: Record<number, GitProviderTeam> = {};

    teamsDetails.forEach(team => {
      const { name, id, slug, html_url, members_count, repos_count, description } = team;
      teamsWithChildren[team.id] = {
        name,
        id,
        slug,
        children: [],
        memberCount: members_count,
        repositoryCount: repos_count,
        htmlUrl: html_url,
        description
      };
    });

    const result: GitProviderTeam[] = [];
    teamsDetails.forEach(team => {
      if (team.parent && teamsWithChildren[team.parent.id])
        teamsWithChildren[team.parent.id].children.push(teamsWithChildren[team.id]);
      else result.push(teamsWithChildren[team.id]);
    });

    return { teams: result, total: teamsDetails.length };
  }

  return { teams: [], total: 0 };
};

const findValidUsersToAdd = ({
  userIdByProviderId,
  usersFromGitProvider,
  teamIdByProviderId,
  teamRoleId
}: {
  userIdByProviderId: Record<string, string>;
  usersFromGitProvider: (Octokit.TeamsListMembersResponseItem & {
    teamId: number;
  })[];
  teamIdByProviderId: Record<string, number>;
  teamRoleId: number;
}) => {
  // only get users that are imported to GR to add into team
  const usersData = usersFromGitProvider.reduce((data, { id, teamId: providerTeamId }) => {
    const userId = userIdByProviderId[id];
    if (userId) {
      data.push({
        fkTeam: teamIdByProviderId[String(providerTeamId)],
        fkTeamRole: teamRoleId,
        fkUser: userId
      });
    }
    return data;
  }, [] as Array<{ fkTeam: number; fkTeamRole: number; fkUser: string }>);

  return usersData;
};

const addUsersToTeams = async ({
  user,
  account,
  teams,
  gitService,
  teamIdByProviderId
}: {
  user: RequestUser;
  account: Account;
  teams: GitProviderTeam[];
  teamIdByProviderId: Record<string, number>;
  gitService: GitHubService;
}) => {
  const maintainers = teams.length
    ? (
        await Promise.all(
          teams.map(team => gitService.getTeamMembers({ account, team, role: 'maintainer' }))
        )
      ).flat()
    : [];

  const members = teams.length
    ? (
        await Promise.all(
          teams.map(team => gitService.getTeamMembers({ account, team, role: 'member' }))
        )
      ).flat()
    : [];

  const usersInDb =
    members.length + maintainers.length > 0
      ? await getUserIdsByProviderInternalIds(user.provider, [
          ...new Set(members.concat(maintainers).map(({ id }) => String(id)))
        ])
      : [];

  if (usersInDb.length) {
    const roles = await findAllTeamRoles();
    const teamRoleIdByRoleName = {} as Record<TeamRoleName, number>;

    roles.forEach(role => {
      teamRoleIdByRoleName[role.name] = role.idTeamRole;
    });

    const userIdByProviderId = usersInDb.reduce((acc, { idUser, providerInternalId }) => {
      acc[providerInternalId!] = idUser;
      return acc;
    }, {} as Record<string, string>);

    const membersToAdd = findValidUsersToAdd({
      userIdByProviderId,
      teamIdByProviderId,
      usersFromGitProvider: members,
      teamRoleId: teamRoleIdByRoleName[TeamRoleName.DEVELOPER]
    });

    const maintainersToAdd = findValidUsersToAdd({
      userIdByProviderId,
      teamIdByProviderId,
      usersFromGitProvider: maintainers,
      teamRoleId: teamRoleIdByRoleName[TeamRoleName.TEAM_ADMIN]
    });

    return membersToAdd.length + maintainersToAdd.length > 0
      ? bulkAddUsers(membersToAdd.concat(maintainersToAdd))
      : { addedUsers: 0 };
  }

  return { addedUsers: 0 };
};

const addRepositoriesToTeams = async ({
  account,
  teams,
  teamIdByProviderId,
  gitService
}: {
  account: Account;
  teams: GitProviderTeam[];
  gitService: GitHubService;
  teamIdByProviderId: Record<string, number>;
}) => {
  const teamReposFromProvider = teams.length
    ? (await Promise.all(teams.map(team => gitService.getTeamRepositories(account, team)))).flat()
    : [];

  const repositoryIds = teamReposFromProvider.length
    ? await findRepositoryIdsByProviderInternalId(
        [...new Set(teamReposFromProvider.map(({ id }) => String(id)))],
        account.provider
      )
    : [];

  if (repositoryIds.length) {
    const repoIdByProviderId = repositoryIds.reduce((acc, { idRepository, providerInternalId }) => {
      acc[providerInternalId] = idRepository;
      return acc;
    }, {} as Record<string, number>);

    // only get repositories that are imported to GR to add into team
    const repositoriesData = teamReposFromProvider.reduce(
      (data, { id, teamId: providerTeamId }) => {
        const repositoryId = repoIdByProviderId[id];
        if (repositoryId) {
          data.push({
            fkTeam: teamIdByProviderId[String(providerTeamId)],
            fkRepository: repositoryId
          });
        }
        return data;
      },
      [] as Array<{ fkTeam: number; fkRepository: number }>
    );

    return repositoriesData.length
      ? bulkAddRepositories(repositoriesData)
      : { addedRepositories: 0 };
  }

  return { addedRepositories: 0 };
};

export const importGitProviderTeams = async ({
  user,
  account,
  teams
}: {
  user: RequestUser;
  account: Account;
  teams: GitProviderTeam[];
}) => {
  const { teamIds } = await bulkCreateTeams(
    teams.map(({ name, description = '', id }) => ({
      name,
      description,
      providerInternalId: String(id),
      fkAccount: account.idAccount,
      provider: user.provider,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  );

  const gitService = gitServiceFactory(user, GitProvider.GITHUB) as GitHubService;

  const teamIdByProviderId: Record<string, number> = {};
  teamIds.forEach(teamId => {
    teamIdByProviderId[teamId.providerInternalId!] = teamId.idTeam;
  });

  const { addedUsers } = await addUsersToTeams({
    user,
    account,
    teams: teams.filter(({ memberCount }) => memberCount > 0),
    teamIdByProviderId,
    gitService
  });

  const { addedRepositories } = await addRepositoriesToTeams({
    account,
    teams: teams.filter(({ repositoryCount }) => repositoryCount > 0),
    teamIdByProviderId,
    gitService
  });

  return { addedUsers, addedRepositories, addedTeams: teamIds.length };
};
