"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePendingActionAndFinding = exports.createChangeStatusRequestAction = exports.bulkUpsertActionByFinding = exports.upsertActionByFinding = exports.findActionByFinding = void 0;
const get_1 = __importDefault(require("lodash/get"));
const sentry_1 = __importDefault(require("../../sentry"));
const interfaces_1 = require("../interfaces");
const actions_1 = require("./core-api/actions");
const actionChangeLogs_1 = require("./core-api/actionChangeLogs");
const findings_1 = require("./core-api/findings");
const getUndefinedProperties = (obj) => {
    return Object.keys(obj).filter(key => obj[key] === undefined || obj[key] === null);
};
const assertPropertiesNotUndefined = (obj) => {
    const undefinedProperties = getUndefinedProperties(obj);
    if (undefinedProperties.length) {
        throw new Error(`Failed to map finding properties to action properties, some properties (${undefinedProperties.join(', ')}) are undefined in finding ${JSON.stringify(obj)} `);
    }
};
const getGenericActionFilter = (action) => {
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
const getScaActionFilter = (action) => {
    const { fkRepository, fkRule, fkAccount, path, dependencyName, dependencyVersion, transitiveDependency } = action;
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
const isScaFinding = (finding) => {
    return !!(0, get_1.default)(finding, 'metadata.dependencyName', false);
};
const isValidLineContent = (lineContent) => {
    return lineContent && !lineContent.toLowerCase().startsWith('[gr-error]');
};
const makeScaAction = (finding, idAccount) => {
    const dependencyName = (0, get_1.default)(finding, 'metadata.dependencyName');
    const dependencyVersion = (0, get_1.default)(finding, 'metadata.currentVersion');
    const transitiveDependency = finding.lineNumber === 0;
    const action = {
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
const makeGenericAction = (finding, idAccount) => {
    const action = {
        fkRepository: finding.repository.idRepository,
        fkRule: finding.rule.idRule,
        fkAccount: idAccount,
        path: finding.path,
        lineContent: finding.lineContent && finding.lineContent.trim()
    };
    assertPropertiesNotUndefined(action);
    return action;
};
const findActionByFinding = async (finding, idAccount) => {
    if (!idAccount) {
        throw new Error('idAccount parameter was not set.');
    }
    let action;
    let filter;
    if (isScaFinding(finding)) {
        action = makeScaAction(finding, idAccount);
        filter = getScaActionFilter(action);
    }
    else if (isValidLineContent(finding.lineContent)) {
        action = makeGenericAction(finding, idAccount);
        filter = getGenericActionFilter(action);
    }
    else {
        await (0, sentry_1.default)(new Error(`Skipping creating/updating action. Finding (${finding.idFinding}) is not of type SCA and doesn't contain a valid line content.`));
        return undefined;
    }
    const existingActionWithFinding = await (0, actions_1.findSingleAction)(filter);
    return { existingActionWithFinding, action, finding };
};
exports.findActionByFinding = findActionByFinding;
const upsertActionByFinding = async (finding, status, idAccount, user) => {
    const result = await (0, exports.findActionByFinding)(finding, finding.repository.fkAccount);
    if (!result)
        return undefined;
    const { existingActionWithFinding, action } = result;
    if (existingActionWithFinding) {
        const updatedAction = await (0, actions_1.updateAction)(existingActionWithFinding.idAction, idAccount, {
            action: status
        });
        await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, existingActionWithFinding.idAction, interfaces_1.ActionChangeLogType.ACTION_UPDATED, existingActionWithFinding.action, updatedAction.action);
        return updatedAction;
    }
    const newAction = await (0, actions_1.createAction)({
        ...action,
        action: status,
        lineNumber: finding.lineNumber,
        fkFinding: finding.idFinding // Keep a reference to the finding that we based the action on (in case we need to migrate the action in the future).
    });
    await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, newAction.idAction, interfaces_1.ActionChangeLogType.ACTION_CREATED, null, status);
    return newAction;
};
exports.upsertActionByFinding = upsertActionByFinding;
const bulkUpsertActionByFinding = async ({ findings, newStatus, accountId, userId }) => {
    const scaFindingIds = findings.filter(isScaFinding).map(({ idFinding }) => idFinding);
    const validScaActions = scaFindingIds.length
        ? await (0, actions_1.queryActionsByFindings)(scaFindingIds, 'sca')
        : [];
    const genericFindingIds = findings
        .filter(f => isValidLineContent(f.lineContent))
        .map(({ idFinding }) => idFinding);
    const validGenericActions = genericFindingIds.length
        ? await (0, actions_1.queryActionsByFindings)(genericFindingIds, 'generic')
        : [];
    const newActions = validScaActions
        .concat(validGenericActions)
        .filter(({ idAction }) => !idAction);
    const existingActions = validScaActions
        .concat(validGenericActions)
        .filter(({ idAction, action }) => idAction && action);
    if (existingActions.length) {
        await (0, actions_1.bulkUpdateActions)(existingActions.map(({ idAction }) => idAction), accountId, {
            action: newStatus
        });
        await (0, actionChangeLogs_1.bulkCreateActionChangeLog)(existingActions.map(action => ({
            actionId: action.idAction,
            userId,
            type: interfaces_1.ActionChangeLogType.ACTION_UPDATED,
            fromStatus: action.action,
            toStatus: newStatus
        })));
    }
    if (newActions.length) {
        const actionsData = newActions.map(({ idFinding }) => {
            const finding = findings.find(f => f.idFinding === idFinding);
            const dependencyVersion = (0, get_1.default)(finding, 'metadata.currentVersion');
            return {
                fkRepository: finding?.repository.idRepository,
                fkRule: finding?.rule.idRule,
                fkAccount: finding?.repository.fkAccount,
                path: finding?.path,
                action: newStatus,
                lineNumber: finding?.lineNumber,
                fkFinding: finding?.idFinding,
                ...(finding?.lineContent ? { lineContent: finding.lineContent.trim() } : {}),
                dependencyName: (0, get_1.default)(finding, 'metadata.dependencyName'),
                transitiveDependency: finding?.lineNumber === 0,
                ...(dependencyVersion && { dependencyVersion: String(dependencyVersion) })
            };
        });
        const createdActionIds = await (0, actions_1.bulkCreateActions)(actionsData);
        if (createdActionIds.length)
            await (0, actionChangeLogs_1.bulkCreateActionChangeLog)(createdActionIds.map(({ idAction }) => ({
                userId,
                actionId: idAction,
                type: interfaces_1.ActionChangeLogType.ACTION_CREATED,
                fromStatus: null,
                toStatus: newStatus
            })));
    }
};
exports.bulkUpsertActionByFinding = bulkUpsertActionByFinding;
const createChangeStatusRequestAction = async (finding, status, idAccount, user, comments) => {
    const result = await (0, exports.findActionByFinding)(finding, finding.repository.fkAccount);
    if (!result)
        return undefined;
    const { existingActionWithFinding, action } = result;
    if (existingActionWithFinding) {
        const updatedAction = await (0, actions_1.updateAction)(existingActionWithFinding.idAction, idAccount, {
            action: status,
            status: interfaces_1.ActionStatus.PENDING
        });
        const fromStatus = finding.status && Object.keys(interfaces_1.ActionType).includes(finding.status) ? finding.status : null;
        await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, existingActionWithFinding.idAction, interfaces_1.ActionChangeLogType.ACTION_REQUESTED, fromStatus, updatedAction.action, comments);
        return updatedAction;
    }
    const newAction = await (0, actions_1.createAction)({
        ...action,
        action: status,
        lineNumber: finding.lineNumber,
        fkFinding: finding.idFinding,
        status: interfaces_1.ActionStatus.PENDING
    });
    await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, newAction.idAction, interfaces_1.ActionChangeLogType.ACTION_REQUESTED, null, status, comments);
    return newAction;
};
exports.createChangeStatusRequestAction = createChangeStatusRequestAction;
const updatePendingActionAndFinding = async (accountId, user, patch, actionAndChangeLog) => {
    const updatedAction = await (0, actions_1.updateAction)(actionAndChangeLog.actionId, accountId, {
        status: patch.status
    });
    if (patch.status === interfaces_1.ActionStatus.APPROVED) {
        const finding = await (0, findings_1.getFindingById)(actionAndChangeLog.findingId);
        await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, actionAndChangeLog.actionId, interfaces_1.ActionChangeLogType.ACTION_APPROVED, actionAndChangeLog.fromStatus, actionAndChangeLog.toStatus);
        const fixed = actionAndChangeLog.toStatus === interfaces_1.ActionType.MARK_AS_FIXED;
        await (0, findings_1.updateFinding)(finding.idFinding, {
            status: actionAndChangeLog.toStatus,
            fixedAt: fixed ? new Date().toJSON() : null,
            fixedBy: fixed ? user.login : null,
            ...(!finding.introducedBy &&
                actionAndChangeLog.toStatus === interfaces_1.ActionType.MARK_AS_VULNERABILITY && {
                introducedBy: 'N/A',
                introducedAt: finding.createdAt
            })
        });
    }
    else if (patch.status === interfaces_1.ActionStatus.REJECTED) {
        await (0, actionChangeLogs_1.createActionChangeLog)(user.idUser, actionAndChangeLog.actionId, interfaces_1.ActionChangeLogType.ACTION_REJECTED, actionAndChangeLog.fromStatus, actionAndChangeLog.toStatus);
    }
    return updatedAction;
};
exports.updatePendingActionAndFinding = updatePendingActionAndFinding;
//# sourceMappingURL=actions.js.map