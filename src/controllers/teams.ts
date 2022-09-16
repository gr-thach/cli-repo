import boom from '@hapi/boom';
import { Request, Response } from 'express';
import {
  AccountType,
  GitProvider,
  GitProviderTeam,
  ParsedQs,
  PermissionAction,
  Resource,
  Team
} from '../interfaces';
import {
  addTeamApplications,
  addTeamRepositories,
  addTeamUsers,
  createTeam,
  destroyTeam,
  updateTeam,
  putTeamApplications,
  putTeamRepositories,
  putTeamUsers,
  queryTeamById,
  queryTeams,
  queryTeamsFilters,
  removeTeamApplications,
  removeTeamRepositories,
  removeTeamUsers,
  updateTeamUsersRoles
} from '../helpers/core-api/teams';
import TeamPermissionService from '../services/permissions/teamPermission';
import { getTeamsFromGitProvider, importGitProviderTeams } from '../helpers/teams';

interface ListTeamsQueryParams extends ParsedQs {
  search: string | undefined;
  departmentId: string | undefined;
}

export const list = async (req: Request<any, any, any, ListTeamsQueryParams>, res: Response) => {
  const {
    query: { search, departmentId, limit, offset },
    account,
    teamPermission
  } = req;

  const { teams, totalCount } = await queryTeams(
    account!.idAccount,
    { search, departmentId },
    limit !== undefined ? Number(limit) : undefined,
    offset !== undefined ? Number(offset) : undefined
  );

  const writePermission = (await TeamPermissionService.factory(
    teamPermission!.policy,
    PermissionAction.WRITE,
    Resource.TEAMS
  )) as TeamPermissionService;

  return res.status(200).send({
    teams: teams.map((team: Team) => ({
      ...team,
      write: writePermission.getAllowedIds(team.idTeam).length > 0
    })),
    totalCount
  });
};

export const listFromGitProvider = async (req: Request, res: Response) => {
  const { account, user } = req;
  if (
    account &&
    account.provider === GitProvider.GITHUB &&
    account.type === AccountType.ORGANIZATION &&
    account.installationId
  ) {
    const teams = await getTeamsFromGitProvider(user, account);
    return res.status(200).send(teams);
  }

  throw boom.badRequest(
    'Import teams is currently only available for Github organization accounts.'
  );
};

export const filters = async (req: Request<any, any, any, ListTeamsQueryParams>, res: Response) => {
  const {
    query: { search, departmentId },
    account
  } = req;

  const result = await queryTeamsFilters(account!.idAccount, { search, departmentId });

  return res.status(200).send(result);
};

export const getById = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const {
    params: { teamId },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const team: Team = await queryTeamById(account!.idAccount, teamId);
  if (!team) {
    throw boom.notFound('Team not found.');
  }

  const writePermission = (await TeamPermissionService.factory(
    teamPermission!.policy,
    PermissionAction.WRITE,
    Resource.TEAMS
  )) as TeamPermissionService;

  const write = writePermission.getAllowedIds(team.idTeam).length > 0;

  return res.status(200).send({ ...team, write });
};

export const create = async (req: Request, res: Response) => {
  const {
    body: { team },
    account
  } = req;

  const result = await createTeam(account!.idAccount, team);

  return res.status(200).send(result);
};

export const importTeams = async (
  req: Request<any, any, { teams: GitProviderTeam[] }>,
  res: Response
) => {
  const {
    body: { teams },
    account,
    user
  } = req;

  if (
    account &&
    account.provider === GitProvider.GITHUB &&
    account.type === AccountType.ORGANIZATION &&
    account.installationId
  ) {
    const result = await importGitProviderTeams({ account: account!, user, teams });

    return res.status(200).send(result);
  }

  throw boom.badRequest(
    'Import teams is currently only available for Github organization accounts.'
  );
};

export const patch = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { patch: _patch },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await updateTeam(account!.idAccount, teamId, _patch);

  return res.status(200).send(result);
};

export const destroy = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await destroyTeam(account!.idAccount, Number(teamId));

  return res.status(200).send(result);
};

export const addApplications = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { applicationIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await addTeamApplications(account!.idAccount, Number(teamId), applicationIds);

  return res.status(200).send(result);
};

export const putApplications = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { applicationIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await putTeamApplications(account!.idAccount, Number(teamId), applicationIds);

  return res.status(200).send(result);
};

export const removeApplications = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { applicationIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await removeTeamApplications(account!.idAccount, Number(teamId), applicationIds);

  return res.status(200).send(result);
};

export const addRepositories = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { repositoryIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await addTeamRepositories(account!.idAccount, Number(teamId), repositoryIds);

  return res.status(200).send(result);
};

export const putRepositories = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { repositoryIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await putTeamRepositories(account!.idAccount, Number(teamId), repositoryIds);

  return res.status(200).send(result);
};

export const removeRepositories = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { repositoryIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await removeTeamRepositories(account!.idAccount, Number(teamId), repositoryIds);

  return res.status(200).send(result);
};

export const addUsers = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { users },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await addTeamUsers(account!.idAccount, Number(teamId), users);

  return res.status(200).send(result);
};

export const putUsers = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { users },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await putTeamUsers(account!.idAccount, Number(teamId), users);

  return res.status(200).send(result);
};

interface PatchUserReqBody {
  users: {
    userId: string;
    teamRoleId: number;
  }[];
}

export const patchUsers = async (req: Request<any, any, PatchUserReqBody>, res: Response) => {
  const {
    params: { teamId },
    body: { users },
    account,
    teamPermission,
    userInDb
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  if (users.some(({ userId }) => userId === userInDb!.idUser)) {
    throw boom.badRequest('You can not change your own role.');
  }

  const result = await updateTeamUsersRoles(account!.idAccount, teamId, users);

  return res.status(200).send(result);
};

export const removeUsers = async (req: Request, res: Response) => {
  const {
    params: { teamId },
    body: { userIds },
    account,
    teamPermission
  } = req;

  teamPermission!.teamsEnforce(Number(teamId));

  const result = await removeTeamUsers(account!.idAccount, Number(teamId), userIds);

  return res.status(200).send(result);
};
