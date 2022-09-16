"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPolicyForAccounts = exports.getPermissionPolicies = void 0;
const index_1 = require("./index");
exports.getPermissionPolicies = (0, index_1.wrapper)(async (accountId, planCode, roles, resources, action) => {
    const { data } = await index_1.coreAxios.get('/permissions', {
        params: { accountId, planCode, roles, resources, action }
    });
    return data;
});
exports.createPolicyForAccounts = (0, index_1.wrapper)(async (accountIds) => {
    const { data } = await index_1.coreAxios.post('/permissions/createPolicyForAccounts', {
        accountIds
    });
    return data;
});
//# sourceMappingURL=permissions.js.map