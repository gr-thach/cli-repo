"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDepartments = exports.queryDepartments = void 0;
const index_1 = require("./index");
exports.queryDepartments = (0, index_1.wrapper)(async (accountId) => {
    const { data } = await index_1.coreAxios.get('/departments', {
        params: {
            accountId
        }
    });
    return data;
});
exports.createDepartments = (0, index_1.wrapper)(async (accountId, department) => {
    const { data } = await index_1.coreAxios.post('/departments', { department }, { params: { accountId } });
    return data;
});
//# sourceMappingURL=departments.js.map