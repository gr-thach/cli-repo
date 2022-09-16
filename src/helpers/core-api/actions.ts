import get from 'lodash/get';
import { Action, ActionStatus, ActionType, BaseAction } from '../../interfaces/actions';

import { wrapper, gql, coreAxios } from './index';
import { actionFragment } from './fragments';
import { ActionChangeLogType, FindingStatus } from '../../interfaces';

interface CreateAction {
  fkFinding: string;
  action: ActionType;
  lineNumber?: number;
  status?: ActionStatus;
  lineContent?: string | null;
}

export const createAction = wrapper(async (action: BaseAction & CreateAction) => {
  const { data } = await coreAxios.post(`/v2/actions`, {
    action: { ...action, createdAt: new Date().toJSON(), updatedAt: new Date().toJSON() }
  });

  return data;
});
interface PatchAction {
  deletedAt: string;
  action: ActionType;
  status: ActionStatus;
}

export const updateAction = wrapper(
  async (idAction: number, accountId: number, patch: Partial<PatchAction>) => {
    const { data } = await coreAxios.patch(
      `/actions/${idAction}`,
      { patch },
      { params: { accountId } }
    );

    return data;
  }
);

export const bulkUpdateActions = wrapper(
  async (actionIds: number[], accountId: number, patch: Partial<PatchAction>) => {
    const { data } = await coreAxios.patch(
      `/actions`,
      { patch, actionIds },
      { params: { accountId } }
    );

    return data;
  }
);

export const bulkCreateActions = wrapper(
  async (actions: Array<BaseAction & CreateAction>): Promise<{ idAction: number }[]> => {
    const { data } = await coreAxios.post(`/actions/bulk`, { actions });

    return data;
  }
);

export const queryActions = wrapper(async filters => {
  const query = gql`
    query($filters: ActionFilter!) {
      actions(filter: $filters) {
        nodes {
          ...ActionFragment
        }
      }
    }
    ${actionFragment}
  `;

  const variables = {
    filters
  };

  const { data } = await coreAxios.post('/graphql', { query, variables });

  return get(data, 'data.actions.nodes', []);
});

export const findSingleAction = wrapper(async filters => {
  const actions = await queryActions(filters);

  if (actions.length === 0) {
    return undefined;
  }

  if (actions.length > 1) {
    throw new Error(`Found more than one action matching filter: ${JSON.stringify(filters)}`);
  }

  return actions[0];
});

export const findActionById = wrapper(async (idAction: number) => {
  const query = gql`
    query($idAction: Int!) {
      actions(condition: { idAction: $idAction, deletedAt: null }) {
        nodes {
          ...ActionFragment
        }
      }
    }
    ${actionFragment}
  `;

  const variables = { idAction };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  const actions = get(data, 'data.actions.nodes');

  if (!actions || actions.length === 0) {
    return null;
  }

  if (actions.length > 1) {
    throw new Error(`Found more than one action with id ${idAction}.`);
  }

  return actions[0];
});

export const queryActionsCount = wrapper(async (repositoryIds: number[], status: ActionStatus) => {
  const { data } = await coreAxios.post('/actions/count', {
    status,
    repositoryIds
  });

  return data.total;
});

interface ActionListParams {
  actionStatus: ActionStatus;
  actionChangeLogType: ActionChangeLogType;
  ruleId: number;
  offset?: number;
  limit?: number;
  filters: Record<string, undefined | null | string[] | string>;
  repositoryIds: number[];
}

export const queryActionsGroupedByRules = wrapper(
  async ({
    actionStatus,
    actionChangeLogType,
    ...rest
  }: Omit<ActionListParams, 'limit' | 'offset' | 'ruleId'>) => {
    const { data } = await coreAxios.post('/actions/groupByRules', {
      actionStatus: actionStatus.toLowerCase(),
      actionChangeLogType: actionChangeLogType.toLowerCase(),
      ...rest
    });

    return data;
  }
);

export const queryActionsByRule = wrapper(
  async ({ ruleId, actionStatus, actionChangeLogType, ...query }: ActionListParams) => {
    const { data } = await coreAxios.post(`/actions/groupByRules/${ruleId}`, {
      actionStatus: actionStatus.toLowerCase(),
      actionChangeLogType: actionChangeLogType.toLowerCase(),
      ...query
    });

    return data;
  }
);

export const deleteAction = wrapper((idAction: number, accountId: number) =>
  updateAction(idAction, accountId, { deletedAt: new Date().toJSON() })
);

export interface ActionAndChangeLog {
  actionId: number;
  action: ActionType;
  fkRepository: number;
  findingId: string;
  fromStatus: FindingStatus | null;
  toStatus: FindingStatus;
}

export const queryActionAndLatestChangeLog = wrapper(
  async (actionIds: number[]): Promise<ActionAndChangeLog[]> => {
    const { data } = await coreAxios.get('/actions/changelog', { params: { actionIds } });

    return data;
  }
);

interface FiltersParams {
  repositoryIds: number[];
  actionStatus: ActionStatus;
  actionChangeLogType: ActionChangeLogType;
}

export const queryFilters = wrapper(
  async ({ actionStatus, actionChangeLogType, repositoryIds }: FiltersParams) => {
    const { data } = await coreAxios.post('/actions/filters', {
      repositoryIds,
      actionStatus: actionStatus.toLowerCase(),
      actionChangeLogType: actionChangeLogType.toLowerCase()
    });

    return data;
  }
);

export type ActionByFindingResponse = Partial<Action> & {
  idFinding: string;
};

export const queryActionsByFindings = wrapper(
  async (findingIds: string[], type: string): Promise<Array<ActionByFindingResponse>> => {
    const { data } = await coreAxios.post('/actions/byFindings', {
      findingIds: findingIds,
      type
    });

    return data;
  }
);
