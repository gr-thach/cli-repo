import crypto from 'crypto';
import { Request, Response } from 'express';
import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';
import { env } from '../../config';
import { renewAllowedAccountsByUser } from '../helpers/acl';
import {
  findUserByProviderInternalId,
  queryUsers,
  updateUsersRole,
  queryUsersFilters,
  updateUser
} from '../helpers/core-api/users';
import { UserRoleName, ParsedQs, User, UserRole, SystemUserRoleName } from '../interfaces';
import { findAllRoles } from '../helpers/core-api/roles';
import SyncService from '../services/sync';

export const generateApiKey = async (req: Request, res: Response) => {
  const { user } = req;

  const userInDb: User = await findUserByProviderInternalId(user.providerInternalId, user.provider);

  if (!userInDb) {
    throw boom.notFound(
      'User not found. Please logout and login to GuardRails to create your user.'
    );
  }

  const apiKey = uuid();
  const hmac = () => crypto.createHmac('sha256', env.GUARDRAILS_API_KEY_SECRET);
  const hashedApiKey = hmac()
    .update(apiKey)
    .digest('hex');

  await updateUser(userInDb.idUser, {
    apiKey: hashedApiKey
  });

  return res.status(200).send({
    apiKey
  });
};

export const refreshPermissions = async (req: Request, res: Response) => {
  const { user } = req;

  await renewAllowedAccountsByUser(user);

  return res.status(204).send();
};

export const refreshUsers = async (req: Request, res: Response) => {
  const { user, account } = req;

  const syncService = new SyncService(user, Boolean(env.ACL_WRITE_ACCESS_REPOS_MODE));
  const result = await syncService.synchronizeUsers(account!);

  if (result) {
    return res.status(204).send();
  }
  throw boom.badRequest('Refresh users is currently only available for GitHub');
};

interface ListUsersQueryParams extends ParsedQs {
  teamId: string;
  search: string;
  role: string;
  limit: string;
  offset: string;
}

export const list = async (req: Request<any, any, any, ListUsersQueryParams>, res: Response) => {
  const {
    query: { teamId, search, role, limit, offset },
    account
  } = req;

  const usersResult = await queryUsers(
    account!.idAccount,
    { teamId: teamId ? Number(teamId) : undefined, search, role },
    limit,
    offset
  );

  return res.status(200).send(usersResult);
};

export const filters = async (req: Request<any, any, any, ListUsersQueryParams>, res: Response) => {
  const {
    query: { search, role },
    account
  } = req;

  const repoFilters = await queryUsersFilters(account!.idAccount, { search, role });

  return res.status(200).send(repoFilters);
};

interface PatchRoleReqBody {
  userIds: string[];
  roleId: number;
}

export const patchRole = async (req: Request<any, any, PatchRoleReqBody>, res: Response) => {
  const {
    body: { userIds, roleId },
    account,
    userInDb
  } = req;

  const roles: UserRole[] = await findAllRoles();
  const userRoles = roles.filter(role => Object.values<string>(UserRoleName).includes(role.name));
  const roleToApply = roles.find(r => r.idRole === roleId);

  if (!roleToApply) {
    throw boom.badRequest('Invalid role');
  }

  if (!userRoles.map(r => r.idRole).includes(roleToApply.idRole)) {
    throw boom.badRequest('Invalid role');
  }

  if (!Array.isArray(userIds) || !userIds.length) {
    throw boom.badRequest(
      'Invalid userIds. userIds should be an array of uuid of the users to apply the new role.'
    );
  }

  if (
    roleToApply.name === UserRoleName.ADMIN &&
    ![SystemUserRoleName.OWNER, UserRoleName.ADMIN].includes(
      userInDb!.role?.name || UserRoleName.DEVELOPER
    )
  ) {
    throw boom.badRequest(
      'Only Admins or Owners of an account can change the role of a user to Admin.'
    );
  }

  // If user wants to change its own role
  if (userIds.includes(userInDb!.idUser)) {
    // if only one userId, throw bad request
    if (userIds.length === 1) {
      throw boom.badRequest('You can not change your own role.');
    }
    // if not, just remove the user from the list
    userIds.splice(userIds.indexOf(userInDb!.idUser), 1);
  }

  const result = await updateUsersRole(userIds, account!.idAccount, roleId, true, true);

  return res.status(200).send(result);
};
