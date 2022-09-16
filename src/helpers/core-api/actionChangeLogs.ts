import { wrapper, coreAxios } from './index';
import { ActionChangeLogType, FindingStatus } from '../../interfaces';

export const findActionChangeLogsByActionId = wrapper(async (actionId: number) => {
  const { data } = await coreAxios.get('/actionChangeLogs', {
    params: { actionId }
  });

  return data;
});

export const createActionChangeLog = wrapper(
  async (
    userId: string,
    actionId: number,
    type: ActionChangeLogType,
    fromStatus: FindingStatus | null,
    toStatus: FindingStatus,
    comments?: string
  ) => {
    return coreAxios.post('/actionChangeLogs', {
      userId,
      actionId,
      type,
      fromStatus,
      toStatus,
      comments
    });
  }
);

export type ActionChangeLogsCreate = {
  userId: string;
  actionId: number;
  type: ActionChangeLogType;
  fromStatus: FindingStatus | null;
  toStatus: FindingStatus;
  comments?: string;
};

export const bulkCreateActionChangeLog = wrapper(
  async (actionChangeLogs: ActionChangeLogsCreate[]) => {
    return coreAxios.post('/actionChangeLogs/bulk', {
      actionChangeLogs
    });
  }
);
