"use strict";
const moment = require('moment');
const { coreAxios, wrapper } = require('./index');
const queryVulnerabilitiesOverTime = async (repositoryIds, days) => {
    const dateFrom = moment()
        .subtract(days, 'days')
        .format('YYYY-MM-DD');
    const { data } = await coreAxios.get('/vulnerabilities/totalPerPeriod', {
        params: { repositoryIds: repositoryIds.join(), from: dateFrom }
    });
    return data;
};
module.exports = {
    queryVulnerabilitiesOverTime: wrapper(queryVulnerabilitiesOverTime)
};
//# sourceMappingURL=vulnerabilities.js.map