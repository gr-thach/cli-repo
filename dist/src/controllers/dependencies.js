"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const dependencies_1 = require("../helpers/core-api/dependencies");
const list = async (req, res) => {
    const { 
    // TODO: Change repoId to repositoryId
    query: { hasVulnerability, repoId: repositoryId, license, limit = '10', offset }, permission, account } = req;
    const allowedIds = permission.repositoriesEnforce(repositoryId ? Number(repositoryId) : undefined);
    if (!allowedIds.length) {
        return res.status(200).send({
            dependencies: [],
            totalCount: 0
        });
    }
    const filters = {
        accountId: account.idAccount,
        limit,
        offset
    };
    if (hasVulnerability) {
        filters.hasVulnerability = Boolean(hasVulnerability);
    }
    if (repositoryId) {
        filters.repoId = Number(repositoryId);
    }
    if (license) {
        filters.license = license;
    }
    const repoFilters = await (0, dependencies_1.queryDependencies)({
        repositoryIds: allowedIds,
        filters
    });
    return res.status(200).send(repoFilters);
};
exports.list = list;
//# sourceMappingURL=dependencies.js.map