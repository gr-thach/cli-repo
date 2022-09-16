"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUsers = exports.patchUsers = exports.putUsers = exports.addUsers = exports.removeRepositories = exports.putRepositories = exports.addRepositories = exports.removeApplications = exports.putApplications = exports.addApplications = exports.destroy = exports.patch = exports.importTeams = exports.create = exports.getById = exports.filters = exports.listFromGitProvider = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const interfaces_1 = require("../interfaces");
const teams_1 = require("../helpers/core-api/teams");
const teamPermission_1 = __importDefault(require("../services/permissions/teamPermission"));
const teams_2 = require("../helpers/teams");
const list = async (req, res) => {
    const { query: { search, departmentId, limit, offset }, account, teamPermission } = req;
    const { teams, totalCount } = await (0, teams_1.queryTeams)(account.idAccount, { search, departmentId }, limit !== undefined ? Number(limit) : undefined, offset !== undefined ? Number(offset) : undefined);
    const writePermission = (await teamPermission_1.default.factory(teamPermission.policy, interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.TEAMS));
    return res.status(200).send({
        teams: teams.map((team) => ({
            ...team,
            write: writePermission.getAllowedIds(team.idTeam).length > 0
        })),
        totalCount
    });
};
exports.list = list;
const listFromGitProvider = async (req, res) => {
    const { account, user } = req;
    if (account &&
        account.provider === interfaces_1.GitProvider.GITHUB &&
        account.type === interfaces_1.AccountType.ORGANIZATION &&
        account.installationId) {
        const teams = await (0, teams_2.getTeamsFromGitProvider)(user, account);
        return res.status(200).send(teams);
    }
    throw boom_1.default.badRequest('Import teams is currently only available for Github organization accounts.');
};
exports.listFromGitProvider = listFromGitProvider;
const filters = async (req, res) => {
    const { query: { search, departmentId }, account } = req;
    const result = await (0, teams_1.queryTeamsFilters)(account.idAccount, { search, departmentId });
    return res.status(200).send(result);
};
exports.filters = filters;
const getById = async (req, res) => {
    const { params: { teamId }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const team = await (0, teams_1.queryTeamById)(account.idAccount, teamId);
    if (!team) {
        throw boom_1.default.notFound('Team not found.');
    }
    const writePermission = (await teamPermission_1.default.factory(teamPermission.policy, interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.TEAMS));
    const write = writePermission.getAllowedIds(team.idTeam).length > 0;
    return res.status(200).send({ ...team, write });
};
exports.getById = getById;
const create = async (req, res) => {
    const { body: { team }, account } = req;
    const result = await (0, teams_1.createTeam)(account.idAccount, team);
    return res.status(200).send(result);
};
exports.create = create;
const importTeams = async (req, res) => {
    const { body: { teams }, account, user } = req;
    if (account &&
        account.provider === interfaces_1.GitProvider.GITHUB &&
        account.type === interfaces_1.AccountType.ORGANIZATION &&
        account.installationId) {
        const result = await (0, teams_2.importGitProviderTeams)({ account: account, user, teams });
        return res.status(200).send(result);
    }
    throw boom_1.default.badRequest('Import teams is currently only available for Github organization accounts.');
};
exports.importTeams = importTeams;
const patch = async (req, res) => {
    const { params: { teamId }, body: { patch: _patch }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.updateTeam)(account.idAccount, teamId, _patch);
    return res.status(200).send(result);
};
exports.patch = patch;
const destroy = async (req, res) => {
    const { params: { teamId }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.destroyTeam)(account.idAccount, Number(teamId));
    return res.status(200).send(result);
};
exports.destroy = destroy;
const addApplications = async (req, res) => {
    const { params: { teamId }, body: { applicationIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.addTeamApplications)(account.idAccount, Number(teamId), applicationIds);
    return res.status(200).send(result);
};
exports.addApplications = addApplications;
const putApplications = async (req, res) => {
    const { params: { teamId }, body: { applicationIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.putTeamApplications)(account.idAccount, Number(teamId), applicationIds);
    return res.status(200).send(result);
};
exports.putApplications = putApplications;
const removeApplications = async (req, res) => {
    const { params: { teamId }, body: { applicationIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.removeTeamApplications)(account.idAccount, Number(teamId), applicationIds);
    return res.status(200).send(result);
};
exports.removeApplications = removeApplications;
const addRepositories = async (req, res) => {
    const { params: { teamId }, body: { repositoryIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.addTeamRepositories)(account.idAccount, Number(teamId), repositoryIds);
    return res.status(200).send(result);
};
exports.addRepositories = addRepositories;
const putRepositories = async (req, res) => {
    const { params: { teamId }, body: { repositoryIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.putTeamRepositories)(account.idAccount, Number(teamId), repositoryIds);
    return res.status(200).send(result);
};
exports.putRepositories = putRepositories;
const removeRepositories = async (req, res) => {
    const { params: { teamId }, body: { repositoryIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.removeTeamRepositories)(account.idAccount, Number(teamId), repositoryIds);
    return res.status(200).send(result);
};
exports.removeRepositories = removeRepositories;
const addUsers = async (req, res) => {
    const { params: { teamId }, body: { users }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.addTeamUsers)(account.idAccount, Number(teamId), users);
    return res.status(200).send(result);
};
exports.addUsers = addUsers;
const putUsers = async (req, res) => {
    const { params: { teamId }, body: { users }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.putTeamUsers)(account.idAccount, Number(teamId), users);
    return res.status(200).send(result);
};
exports.putUsers = putUsers;
const patchUsers = async (req, res) => {
    const { params: { teamId }, body: { users }, account, teamPermission, userInDb } = req;
    teamPermission.teamsEnforce(Number(teamId));
    if (users.some(({ userId }) => userId === userInDb.idUser)) {
        throw boom_1.default.badRequest('You can not change your own role.');
    }
    const result = await (0, teams_1.updateTeamUsersRoles)(account.idAccount, teamId, users);
    return res.status(200).send(result);
};
exports.patchUsers = patchUsers;
const removeUsers = async (req, res) => {
    const { params: { teamId }, body: { userIds }, account, teamPermission } = req;
    teamPermission.teamsEnforce(Number(teamId));
    const result = await (0, teams_1.removeTeamUsers)(account.idAccount, Number(teamId), userIds);
    return res.status(200).send(result);
};
exports.removeUsers = removeUsers;
//# sourceMappingURL=teams.js.map