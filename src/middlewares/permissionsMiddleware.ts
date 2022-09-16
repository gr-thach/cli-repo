import boom from '@hapi/boom';
import { Request, Response, NextFunction } from 'express';
import PolicyService from '../services/permissions/policy';
import { getAllowedRepositoriesByUserOnAccount } from '../helpers/acl';
import PermissionService from '../services/permissions/permission';
import { PermissionAction, Resource } from '../interfaces';
import {
  getAllAccountsRepositoryIds,
  getAllowedRepositoryIdsGroupedByTeamRole
} from '../helpers/repository';

// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const permissionsMiddleware = (
  action: PermissionAction,
  resources: Resource | Resource[],
  enforce: boolean = true
) => async (req: Request, _: Response, next: NextFunction) => {
  const { user, account, userInDb } = req;

  if (!account) {
    return next(boom.badRequest('Missing mandatory accountId query parameter'));
  }

  if (!userInDb) {
    return next(boom.badRequest('Invalid logged in user'));
  }

  const {
    allowedRepositories: ACLAllowedRepositories
  } = await getAllowedRepositoriesByUserOnAccount(user, account.idAccount);

  const allAccountRepositoryIds = await getAllAccountsRepositoryIds(account.idAccount);

  const allowedRepositoryIdsGroupedByTeamRole = await getAllowedRepositoryIdsGroupedByTeamRole(
    userInDb.idUser,
    account.idAccount
  );

  const policy = await PolicyService.createInstance(account, userInDb, {
    ACLAllowedRepositories,
    allAccountRepositoryIds,
    allowedRepositoryIdsGroupedByTeamRole
  });
  req.permission = await PermissionService.factory(policy, action, resources);

  if (enforce) {
    try {
      req.permission.enforce();
    } catch (e) {
      return next(e);
    }
  }

  return next();
};

export default permissionsMiddleware;
