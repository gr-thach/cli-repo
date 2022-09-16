"use strict";
const { coreAxios } = require('./index');
const { wrapper } = require('./index');
const queryDependencies = async ({ repositoryIds, filters }) => {
    const { data } = await coreAxios.post('/dependencies', {
        ...filters,
        repositoryIds: repositoryIds.join()
    });
    return data;
};
module.exports = {
    queryDependencies: wrapper(queryDependencies)
};
//# sourceMappingURL=dependencies.js.map