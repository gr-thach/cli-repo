import lodashGet from 'lodash/get';
import reportError from '../../sentry';
import {
  GenericAction,
  ScaAction,
  Finding,
  User,
  ActionChangeLogType,
  ActionStatus,
  ActionType,
  Action
} from '../interfaces';
import {
  findSingleAction,
  createAction,
  updateAction,
  ActionAndChangeLog,
  bulkUpdateActions,
  bulkCreateActions,
  queryActionsByFindings
} from './core-api/actions';
import { bulkCreateActionChangeLog, createActionChangeLog } from './core-api/actionChangeLogs';
import { getFindingById, updateFinding } from './core-api/findings';

const getUndefinedProperties = (obj: GenericAction | ScaAction) => {
  return (Object.keys(obj) as Array<keyof typeof obj>).filter(
    key => obj[key] === undefined || obj[key] === null
  );
};

const assertPropertiesNotUndefined = (obj: GenericAction | ScaAction) => {
  const undefinedProperties = getUndefinedProperties(obj);

  if (undefinedProperties.length) {
    throw new Error(
      `Failed to map finding properties to action properties, some properties (${undefinedProperties.join(
        ', '
      )}) are undefined in finding ${JSON.stringify(obj)} `
    );
  }
};

const getGenericActionFilter = (action: GenericAction) => {
  const { fkRepository, fkRule, fkAccount, path, lineContent } = action;

  const filters = {
    ...(fkRepository && { fkRepository: { equalTo: fkRepository } }),
    ...(fkRule && { fkRule: { equalTo: fkRule } }),
    ...(fkAccount && { fkAccount: { equalTo: fkAccount } }),
    ...(path && { path: { equalTo: path } }),
    ...(lineContent && { lineContent: { equalTo: lineContent.trim() } })
  };

  return filters;
};

const getScaActionFilter = (action: ScaAction) => {
  const {
    fkRepository,
    fkRule,
    fkAccount,
    path,
    dependencyName,
    dependencyVersion,
    transitiveDependency
  } = action;

  const filters = {
    ...(fkRepository && { fkRepository: { equalTo: fkRepository } }),
    ...(fkRule && { fkRule: { equalTo: fkRule } }),
    ...(fkAccount && { fkAccount: { equalTo: fkAccount } }),
    ...(path && { path: { equalTo: path } }),
    ...(dependencyName && { dependencyName: { equalTo: dependencyName } }),
    ...(dependencyVersion && { dependencyVersion: { equalTo: dependencyVersion } }),
    ...(typeof transitiveDependency === 'boolean' && {
      transitiveDependency: { equalTo: transitiveDependency }
    })
  };

  return filters;
};

const isScaFinding = (finding: Finding) => {
  return !!lodashGet(finding, 'metadata.dependencyName', false);
};

const isValidLineContent = (lineContent: string | null) => {
  return lineContent && !lineContent.toLowerCase().startsWith('[gr-error]');
};

const makeScaAction = (finding: Finding, idAccount: number): ScaAction => {
  const dependencyName: string | undefined = lodashGet(finding, 'metadata.dependencyName');
  const dependencyVersion = lodashGet(finding, 'metadata.currentVersion');
  const transitiveDependency = finding.lineNumber === 0;

  const action: ScaAction = {
    fkRepository: finding.repository.idRepository,
    fkRule: finding.rule.idRule,
    fkAccount: idAccount,
    path: finding.path,
    dependencyName,
    transitiveDependency,
    // java-dependency-check engine don't have a dependency version field in the metadata (the dependency version is part of the dependency name).
    ...(dependencyVersion && { dependencyVersion: String(dependencyVersion) })
  };

  assertPropertiesNotUndefined(action);

  return action;
};

// This is action properties for sast and other findings.
const makeGenericAction = (finding: Finding, idAccount: number): GenericAction => {
  const action: GenericAction = {
    fkRepository: finding.repository.idRepository,
    fkRule: finding.rule.idRule,
    fkAccount: idAccount,
    path: finding.path,
    lineContent: finding.lineContent && finding.lineContent.trim()
  };

  assertPropertiesNotUndefined(action);

  return action;
};

export type ActionByFindingResponse = {
  existingActionWithFinding?: Action;
  action: ScaAction | GenericAction;
  finding: Finding;
};

export const findActionByFinding = async (
  finding: Finding,
  idAccount: number
): Promise<ActionByFindingResponse | undefined> => {
  if (!idAccount) {
    throw new Error('idAccount parameter was not set.');
  }

  let action: GenericAction | ScaAction;
  let filter;

  if (isScaFinding(finding)) {
    action = makeScaAction(finding, idAccount);
    filter = getScaActionFilter(action);
  } else if (isValidLineContent(finding.lineContent)) {
    action = makeGenericAction(finding, idAccount);
    filter = getGenericActionFilter(action);
  } else {
    await reportError(
      new Error(
        `Skipping creating/updating action. Finding (${finding.idFinding}) is not of type SCA and doesn't contain a valid line content.`
      )
    );
    return undefined;
  }

  const existingActionWithFinding: Action | undefined = await findSingleAction(filter);
  return { existingActionWithFinding, action, finding };
};

export const upsertActionByFinding = async (
  finding: Finding,
  status: ActionType,
  idAccount: number,
  user: User
) => {
  const result = await findActionByFinding(finding, finding.repository.fkAccount);
  if (!result) return undefined;

  const { existingActionWithFinding, action } = result;
  if (existingActionWithFinding) {
    const updatedAction = await updateAction(existingActionWithFinding.idAction, idAccount, {
      action: status
    });

    await createActionChangeLog(
      user.idUser,
      existingActionWithFinding.idAction,
      ActionChangeLogType.ACTION_UPDATED,
      existingActionWithFinding.action,
      updatedAction.action
    );

    return updatedAction;
  }

  const newAction = await createAction({
    ...action,
    action: status,
    lineNumber: finding.lineNumber, // Save line number on actions, in case we need it in the future.
    fkFinding: finding.idFinding // Keep a reference to the finding that we based the action on (in case we need to migrate the action in the future).
  });

  await createActionChangeLog(
    user.idUser,
    newAction.idAction,
    ActionChangeLogType.ACTION_CREATED,
    null,
    status
  );

  return newAction;
};

export const bulkUpsertActionByFinding = async ({
  findings,
  newStatus,
  accountId,
  userId
}: {
  findings: Finding[];
  newStatus: ActionType;
  accountId: number;
  userId: string;
}) => {
  const scaFindingIds = findings.filter(isScaFinding).map(({ idFinding }) => idFinding);

  const validScaActions = scaFindingIds.length
    ? await queryActionsByFindings(scaFindingIds, 'sca')
    : [];

  const genericFindingIds = findings
    .filter(f => isValidLineContent(f.lineContent))
    .map(({ idFinding }) => idFinding);

  const validGenericActions = genericFindingIds.length
    ? await queryActionsByFindings(genericFindingIds, 'generic')
    : [];

  const newActions = validScaActions
    .concat(validGenericActions)
    .filter(({ idAction }) => !idAction);

  const existingActions = validScaActions
    .concat(validGenericActions)
    .filter(({ idAction, action }) => idAction && action);

  if (existingActions.length) {
    await bulkUpdateActions(
      existingActions.map(({ idAction }) => idAction!),
      accountId,
      {
        action: newStatus
      }
    );

    await bulkCreateActionChangeLog(
      existingActions.map(action => ({
        actionId: action.idAction!,
        userId,
        type: ActionChangeLogType.ACTION_UPDATED,
        fromStatus: action.action!,
        toStatus: newStatus
      }))
    );
  }

  if (newActions.length) {
    const actionsData = newActions.map(({ idFinding }) => {
      const finding = findings.find(f => f.idFinding === idFinding);
      const dependencyVersion = lodashGet(finding, 'metadata.currentVersion');

      return {
        fkRepository: finding?.repository.idRepository,
        fkRule: finding?.rule.idRule,
        fkAccount: finding?.repository.fkAccount,
        path: finding?.path,
        action: newStatus,
        lineNumber: finding?.lineNumber,
        fkFinding: finding?.idFinding,
        ...(finding?.lineContent ? { lineContent: finding.lineContent.trim() } : {}),
        dependencyName: lodashGet(finding, 'metadata.dependencyName'),
        transitiveDependency: finding?.lineNumber === 0,
        ...(dependencyVersion && { dependencyVersion: String(dependencyVersion) })
      };
    });
    const createdActionIds = await bulkCreateActions(actionsData);

    if (createdActionIds.length)
      await bulkCreateActionChangeLog(
        createdActionIds.map(({ idAction }) => ({
          userId,
          actionId: idAction,
          type: ActionChangeLogType.ACTION_CREATED,
          fromStatus: null,
          toStatus: newStatus
        }))
      );
  }
};

export const createChangeStatusRequestAction = async (
  finding: Finding,
  status: ActionType,
  idAccount: number,
  user: User,
  comments: string
) => {
  const result = await findActionByFinding(finding, finding.repository.fkAccount);
  if (!result) return undefined;

  const { existingActionWithFinding, action } = result;

  if (existingActionWithFinding) {
    const updatedAction = await updateAction(existingActionWithFinding.idAction, idAccount, {
      action: status,
      status: ActionStatus.PENDING
    });

    const fromStatus =
      finding.status && Object.keys(ActionType).includes(finding.status) ? finding.status : null;

    await createActionChangeLog(
      user.idUser,
      existingActionWithFinding.idAction,
      ActionChangeLogType.ACTION_REQUESTED,
      fromStatus,
      updatedAction.action,
      comments
    );

    return updatedAction;
  }

  const newAction = await createAction({
    ...action,
    action: status,
    lineNumber: finding.lineNumber,
    fkFinding: finding.idFinding,
    status: ActionStatus.PENDING
  });

  await createActionChangeLog(
    user.idUser,
    newAction.idAction,
    ActionChangeLogType.ACTION_REQUESTED,
    null,
    status,
    comments
  );

  return newAction;
};

export const updatePendingActionAndFinding = async (
  accountId: number,
  user: User,
  patch: {
    status: ActionStatus;
  },
  actionAndChangeLog: ActionAndChangeLog
) => {
  const updatedAction = await updateAction(actionAndChangeLog.actionId, accountId, {
    status: patch.status
  });

  if (patch.status === ActionStatus.APPROVED) {
    const finding = await getFindingById(actionAndChangeLog.findingId);

    await createActionChangeLog(
      user.idUser,
      actionAndChangeLog.actionId,
      ActionChangeLogType.ACTION_APPROVED,
      actionAndChangeLog.fromStatus,
      actionAndChangeLog.toStatus
    );

    const fixed = actionAndChangeLog.toStatus === ActionType.MARK_AS_FIXED;

    await updateFinding(finding.idFinding, {
      status: actionAndChangeLog.toStatus,
      fixedAt: fixed ? new Date().toJSON() : null,
      fixedBy: fixed ? user.login : null,
      ...(!finding.introducedBy &&
        actionAndChangeLog.toStatus === ActionType.MARK_AS_VULNERABILITY && {
          introducedBy: 'N/A',
          introducedAt: finding.createdAt
        })
    });
  } else if (patch.status === ActionStatus.REJECTED) {
    await createActionChangeLog(
      user.idUser,
      actionAndChangeLog.actionId,
      ActionChangeLogType.ACTION_REJECTED,
      actionAndChangeLog.fromStatus,
      actionAndChangeLog.toStatus
    );
  }

  return updatedAction;
};
