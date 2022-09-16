"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateActionChangeLog = exports.createActionChangeLog = exports.findActionChangeLogsByActionId = void 0;
const index_1 = require("./index");
exports.findActionChangeLogsByActionId = (0, index_1.wrapper)(async (actionId) => {
    const { data } = await index_1.coreAxios.get('/actionChangeLogs', {
        params: { actionId }
    });
    return data;
});
exports.createActionChangeLog = (0, index_1.wrapper)(async (userId, actionId, type, fromStatus, toStatus, comments) => {
    return index_1.coreAxios.post('/actionChangeLogs', {
        userId,
        actionId,
        type,
        fromStatus,
        toStatus,
        comments
    });
});
exports.bulkCreateActionChangeLog = (0, index_1.wrapper)(async (actionChangeLogs) => {
    return index_1.coreAxios.post('/actionChangeLogs/bulk', {
        actionChangeLogs
    });
});
//# sourceMappingURL=actionChangeLogs.js.map