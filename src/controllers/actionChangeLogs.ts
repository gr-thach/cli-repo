import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { findActionById } from '../helpers/core-api/actions';
import { findActionChangeLogsByActionId } from '../helpers/core-api/actionChangeLogs';
import { Action } from '../interfaces/actions';

export const list = async (req: Request, res: Response) => {
  const {
    query: { actionId },
    permission
  } = req;

  const action: Action | null = await findActionById(Number(actionId));
  if (!action) {
    throw boom.badRequest('Action not found.');
  }

  permission!.repositoriesEnforce(action.repository.idRepository);

  const actionChangeLogs = await findActionChangeLogsByActionId(action.idAction);

  return res.status(200).send(actionChangeLogs);
};
