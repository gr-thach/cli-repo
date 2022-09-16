"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importGitProviderTeams = exports.getTeamsFromGitProvider = void 0;
const interfaces_1 = require("../interfaces");
const repositories_1 = require("./core-api/repositories");
const roles_1 = require("./core-api/roles");
const teams_1 = require("./core-api/teams");
const users_1 = require("./core-api/users");
const gitServiceFactory_1 = require("./gitServiceFactory");
const getTeamsFromGitProvider = async (user, account) => {
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, interfaces_1.GitProvider.GITHUB);
    const [teams, teamsInDb] = await Promise.all([
        gitService.getAllOrgTeams(account),
        (0, teams_1.getImportedTeamIds)(account.idAccount, account.provider)
    ]);
    const providerTeamIds = teamsInDb.map(({ providerInternalId }) => providerInternalId);
    const teamsNotInDb = teams.filter(({ id }) => !providerTeamIds.includes(String(id)));
    if (teamsNotInDb.length) {
        const teamsDetails = await Promise.all(teamsNotInDb.map(team => gitService.getATeamBySlug(account, team.slug)));
        const teamsWithChildren = {};
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
        const result = [];
        teamsDetails.forEach(team => {
            if (team.parent && teamsWithChildren[team.parent.id])
                teamsWithChildren[team.parent.id].children.push(teamsWithChildren[team.id]);
            else
                result.push(teamsWithChildren[team.id]);
        });
        return { teams: result, total: teamsDetails.length };
    }
    return { teams: [], total: 0 };
};
exports.getTeamsFromGitProvider = getTeamsFromGitProvider;
const findValidUsersToAdd = ({ userIdByProviderId, usersFromGitProvider, teamIdByProviderId, teamRoleId }) => {
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
    }, []);
    return usersData;
};
const addUsersToTeams = async ({ user, account, teams, gitService, teamIdByProviderId }) => {
    const maintainers = teams.length
        ? (await Promise.all(teams.map(team => gitService.getTeamMembers({ account, team, role: 'maintainer' })))).flat()
        : [];
    const members = teams.length
        ? (await Promise.all(teams.map(team => gitService.getTeamMembers({ account, team, role: 'member' })))).flat()
        : [];
    const usersInDb = members.length + maintainers.length > 0
        ? await (0, users_1.getUserIdsByProviderInternalIds)(user.provider, [
            ...new Set(members.concat(maintainers).map(({ id }) => String(id)))
        ])
        : [];
    if (usersInDb.length) {
        const roles = await (0, roles_1.findAllTeamRoles)();
        const teamRoleIdByRoleName = {};
        roles.forEach(role => {
            teamRoleIdByRoleName[role.name] = role.idTeamRole;
        });
        const userIdByProviderId = usersInDb.reduce((acc, { idUser, providerInternalId }) => {
            acc[providerInternalId] = idUser;
            return acc;
        }, {});
        const membersToAdd = findValidUsersToAdd({
            userIdByProviderId,
            teamIdByProviderId,
            usersFromGitProvider: members,
            teamRoleId: teamRoleIdByRoleName[interfaces_1.TeamRoleName.DEVELOPER]
        });
        const maintainersToAdd = findValidUsersToAdd({
            userIdByProviderId,
            teamIdByProviderId,
            usersFromGitProvider: maintainers,
            teamRoleId: teamRoleIdByRoleName[interfaces_1.TeamRoleName.TEAM_ADMIN]
        });
        return membersToAdd.length + maintainersToAdd.length > 0
            ? (0, teams_1.bulkAddUsers)(membersToAdd.concat(maintainersToAdd))
            : { addedUsers: 0 };
    }
    return { addedUsers: 0 };
};
const addRepositoriesToTeams = async ({ account, teams, teamIdByProviderId, gitService }) => {
    const teamReposFromProvider = teams.length
        ? (await Promise.all(teams.map(team => gitService.getTeamRepositories(account, team)))).flat()
        : [];
    const repositoryIds = teamReposFromProvider.length
        ? await (0, repositories_1.findRepositoryIdsByProviderInternalId)([...new Set(teamReposFromProvider.map(({ id }) => String(id)))], account.provider)
        : [];
    if (repositoryIds.length) {
        const repoIdByProviderId = repositoryIds.reduce((acc, { idRepository, providerInternalId }) => {
            acc[providerInternalId] = idRepository;
            return acc;
        }, {});
        // only get repositories that are imported to GR to add into team
        const repositoriesData = teamReposFromProvider.reduce((data, { id, teamId: providerTeamId }) => {
            const repositoryId = repoIdByProviderId[id];
            if (repositoryId) {
                data.push({
                    fkTeam: teamIdByProviderId[String(providerTeamId)],
                    fkRepository: repositoryId
                });
            }
            return data;
        }, []);
        return repositoriesData.length
            ? (0, teams_1.bulkAddRepositories)(repositoriesData)
            : { addedRepositories: 0 };
    }
    return { addedRepositories: 0 };
};
const importGitProviderTeams = async ({ user, account, teams }) => {
    const { teamIds } = await (0, teams_1.bulkCreateTeams)(teams.map(({ name, description = '', id }) => ({
        name,
        description,
        providerInternalId: String(id),
        fkAccount: account.idAccount,
        provider: user.provider,
        createdAt: new Date(),
        updatedAt: new Date()
    })));
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, interfaces_1.GitProvider.GITHUB);
    const teamIdByProviderId = {};
    teamIds.forEach(teamId => {
        teamIdByProviderId[teamId.providerInternalId] = teamId.idTeam;
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
exports.importGitProviderTeams = importGitProviderTeams;
//# sourceMappingURL=teams.js.map