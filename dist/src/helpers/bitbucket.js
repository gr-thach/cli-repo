"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBitbucketAcccountsAndRepos = void 0;
const interfaces_1 = require("../interfaces");
const accounts_1 = require("./core-api/accounts");
const getBitbucketAcccountsAndRepos = async (workspaces, gitService) => {
    const results = await Promise.all(workspaces
        .filter(workspace => workspace.uuid)
        .map(workspace => Promise.all([
        (0, accounts_1.findAccountWithReposByProviderInternalId)(workspace.uuid, interfaces_1.GitProvider.BITBUCKET),
        gitService.getRepositories({ providerInternalId: workspace.uuid }),
        Promise.resolve(workspace)
    ])));
    return results;
};
exports.getBitbucketAcccountsAndRepos = getBitbucketAcccountsAndRepos;
//# sourceMappingURL=bitbucket.js.map