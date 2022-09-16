"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryActionsByFindings = exports.queryFilters = exports.queryActionAndLatestChangeLog = exports.deleteAction = exports.queryActionsByRule = exports.queryActionsGroupedByRules = exports.queryActionsCount = exports.findActionById = exports.findSingleAction = exports.queryActions = exports.bulkCreateActions = exports.bulkUpdateActions = exports.updateAction = exports.createAction = void 0;
const get_1 = __importDefault(require("lodash/get"));
const index_1 = require("./index");
const fragments_1 = require("./fragments");
exports.createAction = (0, index_1.wrapper)(async (action) => {
    const { data } = await index_1.coreAxios.post(`/v2/actions`, {
        action: { ...action, createdAt: new Date().toJSON(), updatedAt: new Date().toJSON() }
    });
    return data;
});
exports.updateAction = (0, index_1.wrapper)(async (idAction, accountId, patch) => {
    const { data } = await index_1.coreAxios.patch(`/actions/${idAction}`, { patch }, { params: { accountId } });
    return data;
});
exports.bulkUpdateActions = (0, index_1.wrapper)(async (actionIds, accountId, patch) => {
    const { data } = await index_1.coreAxios.patch(`/actions`, { patch, actionIds }, { params: { accountId } });
    return data;
});
exports.bulkCreateActions = (0, index_1.wrapper)(async (actions) => {
    const { data } = await index_1.coreAxios.post(`/actions/bulk`, { actions });
    return data;
});
exports.queryActions = (0, index_1.wrapper)(async (filters) => {
    const query = (0, index_1.gql) `
    query($filters: ActionFilter!) {
      actions(filter: $filters) {
        nodes {
          ...ActionFragment
        }
      }
    }
    ${fragments_1.actionFragment}
  `;
    const variables = {
        filters
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.actions.nodes', []);
});
exports.findSingleAction = (0, index_1.wrapper)(async (filters) => {
    const actions = await (0, exports.queryActions)(filters);
    if (actions.length === 0) {
        return undefined;
    }
    if (actions.length > 1) {
        throw new Error(`Found more than one action matching filter: ${JSON.stringify(filters)}`);
    }
    return actions[0];
});
exports.findActionById = (0, index_1.wrapper)(async (idAction) => {
    const query = (0, index_1.gql) `
    query($idAction: Int!) {
      actions(condition: { idAction: $idAction, deletedAt: null }) {
        nodes {
          ...ActionFragment
        }
      }
    }
    ${fragments_1.actionFragment}
  `;
    const variables = { idAction };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    const actions = (0, get_1.default)(data, 'data.actions.nodes');
    if (!actions || actions.length === 0) {
        return null;
    }
    if (actions.length > 1) {
        throw new Error(`Found more than one action with id ${idAction}.`);
    }
    return actions[0];
});
exports.queryActionsCount = (0, index_1.wrapper)(async (repositoryIds, status) => {
    const { data } = await index_1.coreAxios.post('/actions/count', {
        status,
        repositoryIds
    });
    return data.total;
});
exports.queryActionsGroupedByRules = (0, index_1.wrapper)(async ({ actionStatus, actionChangeLogType, ...rest }) => {
    const { data } = await index_1.coreAxios.post('/actions/groupByRules', {
        actionStatus: actionStatus.toLowerCase(),
        actionChangeLogType: actionChangeLogType.toLowerCase(),
        ...rest
    });
    return data;
});
exports.queryActionsByRule = (0, index_1.wrapper)(async ({ ruleId, actionStatus, actionChangeLogType, ...query }) => {
    const { data } = await index_1.coreAxios.post(`/actions/groupByRules/${ruleId}`, {
        actionStatus: actionStatus.toLowerCase(),
        actionChangeLogType: actionChangeLogType.toLowerCase(),
        ...query
    });
    return data;
});
exports.deleteAction = (0, index_1.wrapper)((idAction, accountId) => (0, exports.updateAction)(idAction, accountId, { deletedAt: new Date().toJSON() }));
exports.queryActionAndLatestChangeLog = (0, index_1.wrapper)(async (actionIds) => {
    const { data } = await index_1.coreAxios.get('/actions/changelog', { params: { actionIds } });
    return data;
});
exports.queryFilters = (0, index_1.wrapper)(async ({ actionStatus, actionChangeLogType, repositoryIds }) => {
    const { data } = await index_1.coreAxios.post('/actions/filters', {
        repositoryIds,
        actionStatus: actionStatus.toLowerCase(),
        actionChangeLogType: actionChangeLogType.toLowerCase()
    });
    return data;
});
exports.queryActionsByFindings = (0, index_1.wrapper)(async (findingIds, type) => {
    const { data } = await index_1.coreAxios.post('/actions/byFindings', {
        findingIds: findingIds,
        type
    });
    return data;
});
//# sourceMappingURL=actions.js.map