"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApplication = exports.queryApplicationById = exports.queryApplicationsFilters = exports.queryApplications = void 0;
const index_1 = require("./index");
exports.queryApplications = (0, index_1.wrapper)(async (accountId, filters, limit, offset) => {
    const { data } = await index_1.coreAxios.get('/applications', {
        params: {
            ...filters,
            accountId,
            limit,
            offset
        }
    });
    return data;
});
exports.queryApplicationsFilters = (0, index_1.wrapper)(async (accountId, filters, limit, offset) => {
    const { data } = await index_1.coreAxios.get('/applications/filters', {
        params: {
            ...filters,
            accountId,
            limit,
            offset
        }
    });
    return data;
});
exports.queryApplicationById = (0, index_1.wrapper)(async (accountId, applicationId) => {
    const { data } = await index_1.coreAxios.get(`/applications/${applicationId}`, {
        params: {
            accountId
        }
    });
    return data;
});
exports.createApplication = (0, index_1.wrapper)(async (accountId, application) => {
    const { data } = await index_1.coreAxios.post('/applications', { application }, { params: { accountId } });
    return data;
});
//# sourceMappingURL=applications.js.map