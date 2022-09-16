import boom from '@hapi/boom';
import { Request, Response } from 'express';
import {
  queryActionsByRule,
  queryActions,
  findActionById,
  deleteAction,
  queryActionsCount,
  queryActionsGroupedByRules,
  queryFilters,
  queryActionAndLatestChangeLog
} from '../helpers/core-api/actions';
import { getRepositoryById } from '../helpers/core-api/repositories';
import { actionsFilters } from '../helpers/queryFilter';
import { createActionChangeLog } from '../helpers/core-api/actionChangeLogs';
import { ActionChangeLogType, ActionStatus, ParsedQs } from '../interfaces';
import { updatePendingActionAndFinding } from '../helpers/actions';

export const list = async (req: Request, res: Response) => {
  const {
    query: { repositoryId },
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const filter = actionsFilters({
    idAccount: repository.fkAccount,
    idRepository: repository.idRepository
  });

  const actions = await queryActions(filter);

  return res.status(200).send(actions);
};

interface ActionCountQuery extends ParsedQs {
  status: ActionStatus;
}

export const getActionsCount = async (
  req: Request<any, any, any, ActionCountQuery>,
  res: Response
) => {
  const {
    query: { status },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce();
  if (!allowedIds.length) {
    return res.status(200).send({ total: 0 });
  }

  const total = await queryActionsCount(allowedIds, status);
  return res.status(200).send({ total });
};

interface ActionsByRuleQuery extends ParsedQs {
  actionStatus: ActionStatus;
  actionChangeLogType: ActionChangeLogType;
  offset?: string;
  limit?: string;
  ruleIds?: string[];
  engineRuleIds?: string[];
  language?: string[];
  severityIds?: string[];
  fromStatus?: string;
  toStatus?: string;
  introducedBy?: string;
  requestedBy?: string;
  path?: string;
}

export const getActionsGroupedByRules = async (
  req: Request<any, any, any, ActionsByRuleQuery>,
  res: Response
) => {
  const {
    query: { actionStatus, actionChangeLogType, fromStatus, toStatus, ...rest },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce();
  if (!allowedIds.length) {
    return res.status(200).send(undefined);
  }

  const data = await queryActionsGroupedByRules({
    actionStatus,
    actionChangeLogType,
    repositoryIds: allowedIds,
    filters: {
      fromStatus: fromStatus === 'null' ? null : fromStatus,
      toStatus: toStatus === 'null' ? null : toStatus,
      ...rest
    }
  });
  return res.status(200).send(data);
};

export const getActionFilters = async (
  req: Request<any, any, any, Pick<ActionsByRuleQuery, 'actionStatus' | 'actionChangeLogType'>>,
  res: Response
) => {
  const {
    query: { actionStatus, actionChangeLogType },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce();

  if (!allowedIds.length) {
    return res.status(200).send({
      rule: [],
      engineRule: [],
      currentStatus: [],
      newStatus: [],
      language: [],
      severity: [],
      requestedBy: [],
      introducedBy: [],
      path: []
    });
  }

  const data = await queryFilters({ actionStatus, actionChangeLogType, repositoryIds: allowedIds });
  return res.status(200).send(data);
};

export const getActionsByRule = async (
  req: Request<any, any, any, ActionsByRuleQuery>,
  res: Response
) => {
  const {
    query: { actionStatus, actionChangeLogType, offset, limit, fromStatus, toStatus, ...rest },
    params: { ruleId },
    permission
  } = req;

  if (limit && !Number.isInteger(Number(limit))) {
    throw boom.badRequest('Invalid parameter limit', limit);
  }
  if (offset && !Number.isInteger(Number(offset))) {
    throw boom.badRequest('Invalid parameter limit', offset);
  }

  const allowedIds = permission!.repositoriesEnforce();

  if (!allowedIds.length) {
    return res.status(200).send([]);
  }

  const data = await queryActionsByRule({
    actionStatus,
    actionChangeLogType,
    offset: offset ? Number(offset) : undefined,
    limit: limit ? Number(limit) : undefined,
    ruleId,
    repositoryIds: allowedIds,
    filters: {
      fromStatus: fromStatus === 'null' ? null : fromStatus,
      toStatus: toStatus === 'null' ? null : toStatus,
      ...rest
    }
  });
  return res.status(200).send(data);
};

export const updatePendingAction = async (
  req: Request<any, any, { status: ActionStatus }, any>,
  res: Response
) => {
  const {
    body: { status },
    params: { actionId },
    account,
    userInDb,
    permission
  } = req;

  const actionAndChangeLog = await queryActionAndLatestChangeLog([actionId]);

  if (!actionAndChangeLog.length) {
    throw boom.notFound(`No action exists with id '${actionId}'.`);
  }

  permission!.repositoriesEnforce(actionAndChangeLog[0].fkRepository);

  if (![ActionStatus.APPROVED, ActionStatus.REJECTED].includes(status)) {
    throw boom.badRequest('Action status must be APPROVED or REJECTED');
  }

  const result = await updatePendingActionAndFinding(
    account!.idAccount,
    userInDb!,
    {
      status
    },
    actionAndChangeLog[0]
  );

  return res.status(200).send(result);
};

interface BulkUpdateBody {
  status: ActionStatus;
  actionIds: number[];
}

export const bulkUpdatePendingActions = async (
  req: Request<any, any, { patch: BulkUpdateBody }, any>,
  res: Response
) => {
  const {
    body: { patch },
    account,
    userInDb,
    permission
  } = req;

  const { status, actionIds } = patch;

  const actionAndChangeLog = await queryActionAndLatestChangeLog(actionIds);

  if (!actionAndChangeLog.length) {
    throw boom.badRequest('There was no actions to update');
  }

  if (![ActionStatus.APPROVED, ActionStatus.REJECTED].includes(status)) {
    throw boom.badRequest('Action status must be APPROVED or REJECTED');
  }

  const repositoryIds = actionAndChangeLog.map(({ fkRepository }) => fkRepository);
  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  const updatedResult = await Promise.all(
    actionAndChangeLog
      .filter(action => allowedIds.includes(action.fkRepository))
      .map(action =>
        updatePendingActionAndFinding(
          account!.idAccount,
          userInDb!,
          {
            status
          },
          action
        )
      )
  );

  return res.status(200).send(updatedResult);
};

export const destroy = async (req: Request, res: Response) => {
  const {
    params: { actionId },
    permission,
    userInDb,
    account
  } = req;

  const id = parseInt(actionId, 10);
  const action = await findActionById(id);
  if (!action) {
    throw boom.notFound(`Action with id=${id} not found.`);
  }

  permission!.repositoriesEnforce(action.repository.idRepository);

  await deleteAction(id, account!.idAccount);

  await createActionChangeLog(
    userInDb!.idUser,
    action.idAction,
    ActionChangeLogType.ACTION_DELETED,
    action.action,
    action.action
  );

  return res.status(204).send();
};
