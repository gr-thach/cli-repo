"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.destroy = exports.bulkUpdatePendingActions = exports.updatePendingAction = exports.getActionsByRule = exports.getActionFilters = exports.getActionsGroupedByRules = exports.getActionsCount = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const actions_1 = require("../helpers/core-api/actions");
const repositories_1 = require("../helpers/core-api/repositories");
const queryFilter_1 = require("../helpers/queryFilter");
const actionChangeLogs_1 = require("../helpers/core-api/actionChangeLogs");
const interfaces_1 = require("../interfaces");
const actions_2 = require("../helpers/actions");
const list = async (req, res) => {
    const { query: { repositoryId }, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const filter = (0, queryFilter_1.actionsFilters)({
        idAccount: repository.fkAccount,
        idRepository: repository.idRepository
    });
    const actions = await (0, actions_1.queryActions)(filter);
    return res.status(200).send(actions);
};
exports.list = list;
const getActionsCount = async (req, res) => {
    const { query: { status }, permission } = req;
    const allowedIds = permission.repositoriesEnforce();
    if (!allowedIds.length) {
        return res.status(200).send({ total: 0 });
    }
    const total = await (0, actions_1.queryActionsCount)(allowedIds, status);
    return res.status(200).send({ total });
};
exports.getActionsCount = getActionsCount;
const getActionsGroupedByRules = async (req, res) => {
    const { query: { actionStatus, actionChangeLogType, fromStatus, toStatus, ...rest }, permission } = req;
    const allowedIds = permission.repositoriesEnforce();
    if (!allowedIds.length) {
        return res.status(200).send(undefined);
    }
    const data = await (0, actions_1.queryActionsGroupedByRules)({
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
exports.getActionsGroupedByRules = getActionsGroupedByRules;
const getActionFilters = async (req, res) => {
    const { query: { actionStatus, actionChangeLogType }, permission } = req;
    const allowedIds = permission.repositoriesEnforce();
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
    const data = await (0, actions_1.queryFilters)({ actionStatus, actionChangeLogType, repositoryIds: allowedIds });
    return res.status(200).send(data);
};
exports.getActionFilters = getActionFilters;
const getActionsByRule = async (req, res) => {
    const { query: { actionStatus, actionChangeLogType, offset, limit, fromStatus, toStatus, ...rest }, params: { ruleId }, permission } = req;
    if (limit && !Number.isInteger(Number(limit))) {
        throw boom_1.default.badRequest('Invalid parameter limit', limit);
    }
    if (offset && !Number.isInteger(Number(offset))) {
        throw boom_1.default.badRequest('Invalid parameter limit', offset);
    }
    const allowedIds = permission.repositoriesEnforce();
    if (!allowedIds.length) {
        return res.status(200).send([]);
    }
    const data = await (0, actions_1.queryActionsByRule)({
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
exports.getActionsByRule = getActionsByRule;
const updatePendingAction = async (req, res) => {
    const { body: { status }, params: { actionId }, account, userInDb, permission } = req;
    const actionAndChangeLog = await (0, actions_1.queryActionAndLatestChangeLog)([actionId]);
    if (!actionAndChangeLog.length) {
        throw boom_1.default.notFound(`No action exists with id '${actionId}'.`);
    }
    permission.repositoriesEnforce(actionAndChangeLog[0].fkRepository);
    if (![interfaces_1.ActionStatus.APPROVED, interfaces_1.ActionStatus.REJECTED].includes(status)) {
        throw boom_1.default.badRequest('Action status must be APPROVED or REJECTED');
    }
    const result = await (0, actions_2.updatePendingActionAndFinding)(account.idAccount, userInDb, {
        status
    }, actionAndChangeLog[0]);
    return res.status(200).send(result);
};
exports.updatePendingAction = updatePendingAction;
const bulkUpdatePendingActions = async (req, res) => {
    const { body: { patch }, account, userInDb, permission } = req;
    const { status, actionIds } = patch;
    const actionAndChangeLog = await (0, actions_1.queryActionAndLatestChangeLog)(actionIds);
    if (!actionAndChangeLog.length) {
        throw boom_1.default.badRequest('There was no actions to update');
    }
    if (![interfaces_1.ActionStatus.APPROVED, interfaces_1.ActionStatus.REJECTED].includes(status)) {
        throw boom_1.default.badRequest('Action status must be APPROVED or REJECTED');
    }
    const repositoryIds = actionAndChangeLog.map(({ fkRepository }) => fkRepository);
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    const updatedResult = await Promise.all(actionAndChangeLog
        .filter(action => allowedIds.includes(action.fkRepository))
        .map(action => (0, actions_2.updatePendingActionAndFinding)(account.idAccount, userInDb, {
        status
    }, action)));
    return res.status(200).send(updatedResult);
};
exports.bulkUpdatePendingActions = bulkUpdatePendingActions;
const destroy = async (req, res) => {
    const { params: { actionId }, permission, userInDb, account } = req;
    const id = parseInt(actionId, 10);
    const action = await (0, actions_1.findActionById)(id);
    if (!action) {
        throw boom_1.default.notFound(`Action with id=${id} not found.`);
    }
    permission.repositoriesEnforce(action.repository.idRepository);
    await (0, actions_1.deleteAction)(id, account.idAccount);
    await (0, actionChangeLogs_1.createActionChangeLog)(userInDb.idUser, action.idAction, interfaces_1.ActionChangeLogType.ACTION_DELETED, action.action, action.action);
    return res.status(204).send();
};
exports.destroy = destroy;
//# sourceMappingURL=actions.js.map