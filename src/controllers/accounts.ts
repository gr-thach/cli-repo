import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { env } from '../../config';
import StripeService from '../services/stripe';
import { clearAllowedAccountsByUser, getAllowedAccountsByUser } from '../helpers/acl';
import { validateInstallationConfig } from '../helpers/yml';
import { updateAccount, destroyAccount, findAccountsByIds } from '../helpers/core-api/accounts';
import { gitServiceFactory } from '../helpers/gitServiceFactory';
import { getAccountPermissionForUser } from '../helpers/permissions';
import { getUserInDbForAccount } from '../helpers/user';

// temporal log to find out what's going on with accounts on onpremise customers
const _log = (...args: any[]) => {
  if (env.ENVIRONMENT === 'onpremise') {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

export const list = async (req: Request, res: Response) => {
  const { user } = req;

  _log('Accounts controller: getting allowed accounts for user');

  const { allowedAccounts, isSynchronizing } = await getAllowedAccountsByUser(user);

  _log('Accounts controller: allowed accounts result is', { allowedAccounts, isSynchronizing });

  if (isSynchronizing) {
    return res.status(202).send({ isSynchronizing });
  }

  const accountIds = Object.keys(allowedAccounts).map(id => Number(id));

  _log('Accounts controller: Preparing to get accounts with ids ', { accountIds });

  const accounts = await findAccountsByIds(accountIds);

  _log(`Accounts controller: ${accounts.length} accounts retrieved`);

  return res.status(200).send({
    [user.provider.toLowerCase()]: await Promise.all(
      accounts
        .filter(account => allowedAccounts[account.idAccount])
        .map(async account => ({
          ...account,
          avatar_url: allowedAccounts[account.idAccount].avatar_url,
          url: allowedAccounts[account.idAccount].url,
          hasAccessTo: await getAccountPermissionForUser(user, account),
          user: await getUserInDbForAccount(user, account.idAccount)
        }))
    )
  });
};

export const config = async (req: Request, res: Response) => {
  const {
    body: { configuration },
    account
  } = req;

  let parsedConfiguration;
  try {
    parsedConfiguration = validateInstallationConfig(configuration);
  } catch (e) {
    const err = e as Error;
    if (err.name === 'ValidationError') {
      throw boom.badRequest("Some fields didn't pass validation", {
        details: (err as any).details.map((detail: { message: string; path: string }) => ({
          message: detail.message,
          path: detail.path
        }))
      });
    } else if (err.name === 'YAMLException' || err.name === 'SyntaxError') {
      throw boom.badData(err.message);
    } else {
      throw e;
    }
  }

  await updateAccount(account!.idAccount, { configuration: parsedConfiguration });

  return res.sendStatus(200);
};

export const update = async (req: Request, res: Response) => {
  const {
    body: { filterReposByWriteAccess, findingConfiguration },
    account
  } = req;

  const updatedAccount = await updateAccount(account!.idAccount, {
    filterReposByWriteAccess,
    findingConfiguration
  });

  return res.status(200).send(updatedAccount);
};

export const destroy = async (req: Request, res: Response) => {
  const { account, user } = req;

  const gitService = gitServiceFactory(user, account!.provider);
  await gitService.deleteApp(account!);

  if (
    env.ENVIRONMENT !== 'onpremise' &&
    !account!.fkParentAccount &&
    account!.subscription.stripeSubscriptionId
  ) {
    const stripeService = new StripeService();
    await stripeService.cancelSubscription(account!.subscription.stripeSubscriptionId);
  }

  await destroyAccount(account!.idAccount);

  await clearAllowedAccountsByUser(user);

  return res.status(204).send();
};
