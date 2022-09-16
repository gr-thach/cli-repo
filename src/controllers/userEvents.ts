import { Request, Response } from 'express';
import { uniqueUsersInPeriod } from '../helpers/core-api/userEvents';

export const getUniqueUsersInPeriod = async (
  req: Request<any, any, any, { from: string; to: string }>,
  res: Response
) => {
  const {
    query: { from, to },
    account
  } = req;

  const users = await uniqueUsersInPeriod(account!.idAccount, from, to);

  return res.status(200).send({ users });
};
