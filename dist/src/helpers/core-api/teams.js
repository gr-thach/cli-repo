"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTeamUsers = exports.updateTeamUsersRoles = exports.putTeamUsers = exports.addTeamUsers = exports.removeTeamRepositories = exports.putTeamRepositories = exports.addTeamRepositories = exports.removeTeamApplications = exports.putTeamApplications = exports.addTeamApplications = exports.destroyTeam = exports.updateTeam = exports.bulkAddRepositories = exports.bulkAddUsers = exports.bulkCreateTeams = exports.createTeam = exports.queryTeamById = exports.queryTeamsFilters = exports.getImportedTeamIds = exports.queryTeams = void 0;
const index_1 = require("./index");
exports.queryTeams = (0, index_1.wrapper)(async (accountId, filters, limit, offset) => {
    const { data } = await index_1.coreAxios.get('/teams', {
        params: {
            ...filters,
            accountId,
            limit,
            offset
        }
    });
    return data;
});
exports.getImportedTeamIds = (0, index_1.wrapper)(async (accountId, provider) => {
    const { data } = await index_1.coreAxios.post('/v2/teams/importedIds', {
        accountId,
        provider
    });
    return data;
});
exports.queryTeamsFilters = (0, index_1.wrapper)(async (accountId, filters) => {
    const { data } = await index_1.coreAxios.get('/teams/filters', {
        params: {
            ...filters,
            accountId
        }
    });
    return data;
});
exports.queryTeamById = (0, index_1.wrapper)(async (accountId, teamId) => {
    const { data } = await index_1.coreAxios.get(`/teams/${teamId}`, {
        params: {
            accountId
        }
    });
    return data;
});
exports.createTeam = (0, index_1.wrapper)(async (accountId, team) => {
    const { data } = await index_1.coreAxios.post('/teams', { team }, { params: { accountId } });
    return data;
});
exports.bulkCreateTeams = (0, index_1.wrapper)(async (teams) => {
    const { data } = await index_1.coreAxios.post('/v2/teams/bulk', { teams });
    return data;
});
exports.bulkAddUsers = (0, index_1.wrapper)(async (teamsUsers) => {
    const { data } = await index_1.coreAxios.post('/v2/teams/users/bulk', { teamsUsers });
    return data;
});
exports.bulkAddRepositories = (0, index_1.wrapper)(async (teamsRepositories) => {
    const { data } = await index_1.coreAxios.post('/v2/teams/repositories/bulk', { teamsRepositories });
    return data;
});
exports.updateTeam = (0, index_1.wrapper)(async (accountId, teamId, patch) => {
    const { data } = await index_1.coreAxios.patch(`/teams/${teamId}`, { patch }, { params: { accountId } });
    return data;
});
exports.destroyTeam = (0, index_1.wrapper)(async (accountId, teamId) => {
    const { data } = await index_1.coreAxios.delete(`/teams/${teamId}`, {
        params: {
            accountId
        }
    });
    return data;
});
exports.addTeamApplications = (0, index_1.wrapper)(async (accountId, teamId, applicationIds) => {
    const { data } = await index_1.coreAxios.post(`/teams/${teamId}/applications`, { applicationIds }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.putTeamApplications = (0, index_1.wrapper)(async (accountId, teamId, applicationIds) => {
    const { data } = await index_1.coreAxios.put(`/teams/${teamId}/applications`, { applicationIds }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.removeTeamApplications = (0, index_1.wrapper)(async (accountId, teamId, applicationIds) => {
    const { data } = await index_1.coreAxios.delete(`/teams/${teamId}/applications`, {
        data: { applicationIds },
        params: {
            accountId
        }
    });
    return data;
});
exports.addTeamRepositories = (0, index_1.wrapper)(async (accountId, teamId, repositoryIds) => {
    const { data } = await index_1.coreAxios.post(`/teams/${teamId}/repositories`, { repositoryIds }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.putTeamRepositories = (0, index_1.wrapper)(async (accountId, teamId, repositoryIds) => {
    const { data } = await index_1.coreAxios.put(`/teams/${teamId}/repositories`, { repositoryIds }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.removeTeamRepositories = (0, index_1.wrapper)(async (accountId, teamId, repositoryIds) => {
    const { data } = await index_1.coreAxios.delete(`/teams/${teamId}/repositories`, {
        data: { repositoryIds },
        params: {
            accountId
        }
    });
    return data;
});
exports.addTeamUsers = (0, index_1.wrapper)(async (accountId, teamId, users) => {
    const { data } = await index_1.coreAxios.post(`/teams/${teamId}/users`, { users }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.putTeamUsers = (0, index_1.wrapper)(async (accountId, teamId, users) => {
    const { data } = await index_1.coreAxios.put(`/teams/${teamId}/users`, { users }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.updateTeamUsersRoles = (0, index_1.wrapper)(async (accountId, teamId, users) => {
    const { data } = await index_1.coreAxios.patch(`/teams/${teamId}/users`, { users }, {
        params: {
            accountId
        }
    });
    return data;
});
exports.removeTeamUsers = (0, index_1.wrapper)(async (accountId, teamId, userIds) => {
    const { data } = await index_1.coreAxios.delete(`/teams/${teamId}/users`, {
        data: { userIds },
        params: {
            accountId
        }
    });
    return data;
});
//# sourceMappingURL=teams.js.map