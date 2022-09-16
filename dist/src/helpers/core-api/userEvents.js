"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueUsersInPeriod = void 0;
const { coreAxios, wrapper } = require('./index');
exports.uniqueUsersInPeriod = wrapper(async (accountId, periodStart, periodEnd) => {
    const { data } = await coreAxios.get(`/userEvents/${accountId}/uniqueUsersInPeriod`, {
        params: { periodStart, periodEnd }
    });
    return data;
});
//# sourceMappingURL=userEvents.js.map