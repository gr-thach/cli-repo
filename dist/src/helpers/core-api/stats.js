"use strict";
const { coreAxios, wrapper } = require('./index');
const mainStats = async (repositoryIds) => {
    const { data } = await coreAxios.post('/stats/main', { repositoryIds });
    return data;
};
const statsOverTime = async (repositoryIds, days = 30) => {
    const { data } = await coreAxios.post('/stats/time', { repositoryIds, days });
    return data;
};
module.exports = {
    mainStats: wrapper(mainStats),
    statsOverTime: wrapper(statsOverTime)
};
//# sourceMappingURL=stats.js.map