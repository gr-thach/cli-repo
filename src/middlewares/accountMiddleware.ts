import boom from '@hapi/boom';
import { isString } from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { findAccountById } from '../helpers/core-api/accounts';
import { findUserWithRoleByProviderInternalId } from '../helpers/core-api/users';
import { checkIfUserCanAccessAccountId } from '../helpers/acl';

// IMPORTANT: this middleware must be added after the jwtMiddlewareCookie (where we first get the user from the session)
const accountMiddleware = async (req: Request, _: Response, next: NextFunction) => {
  const {
    query: { accountId },
    user
  } = req;

  if (accountId) {
    if (isString(accountId) && !/^\d+$/.test(accountId)) {
      return next(boom.badRequest('Invalid accountId'));
    }

    await checkIfUserCanAccessAccountId(user, accountId as string);

    const account = await findAccountById(Number(accountId));
    if (!account) {
      return next(boom.notFound('Account not found'));
    }

    const userInDb = await findUserWithRoleByProviderInternalId(
      user.providerInternalId,
      user.provider,
      account.idAccount
    );

    req.account = account;
    req.userInDb = userInDb;
  }

  return next();
};

export default accountMiddleware;
