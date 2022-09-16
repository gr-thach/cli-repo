import { Request, Response } from 'express';
import { mainStats, statsOverTime } from '../helpers/core-api/stats';

export const main = async (
  req: Request<any, any, any, { repositoryId: string }>,
  res: Response
) => {
  const {
    query: { repositoryId },
    permission
  } = req;

  const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;

  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send({});
  }

  const stats = await mainStats(allowedIds);

  return res.status(200).send(stats);
};

export const listByTime = async (
  req: Request<any, any, any, { repositoryId: string; days: string }>,
  res: Response
) => {
  const {
    query: { repositoryId, days },
    permission
  } = req;

  const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;

  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send({});
  }

  const stats = await statsOverTime(allowedIds, Number(days));

  return res.status(200).send(stats);
};
