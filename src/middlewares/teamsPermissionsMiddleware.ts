import boom from '@hapi/boom';
import { Request, Response, NextFunction } from 'express';
import PolicyService from '../services/permissions/policy';
import { PermissionAction, Resource } from '../interfaces';
import { getUserTeamIdsByTeamRoleOnAccount } from '../helpers/user';
import TeamPermissionService from '../services/permissions/teamPermission';

// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const teamsPermissionsMiddleware = (action: PermissionAction, enforce: boolean = true) => async (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const { account, userInDb } = req;

  if (!account) {
    return next(boom.badRequest('Missing mandatory accountId query parameter'));
  }

  if (!userInDb) {
    return next(boom.badRequest('Invalid logged in user'));
  }

  const userTeamIdsByTeamRole = await getUserTeamIdsByTeamRoleOnAccount(
    account.idAccount,
    userInDb.idUser
  );

  const policy = await PolicyService.createInstance(account, userInDb, { userTeamIdsByTeamRole });
  req.teamPermission = (await TeamPermissionService.factory(
    policy,
    action,
    Resource.TEAMS
  )) as TeamPermissionService;

  if (enforce) {
    try {
      req.teamPermission.enforce();
    } catch (e) {
      return next(e);
    }
  }

  return next();
};

export default teamsPermissionsMiddleware;
