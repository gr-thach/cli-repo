"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const gitServiceFactory_1 = require("../helpers/gitServiceFactory");
const repositories_1 = require("../helpers/core-api/repositories");
const branch_1 = require("../helpers/branch");
const list = async (req, res) => {
    const { query: { repositoryId, limit, offset, total }, user, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound(`Repository with id=${repositoryId} not found.`);
    }
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, repository.provider);
    const options = limit && offset
        ? {
            limit: Number(limit),
            offset: Number(offset),
            ...(total && { totalCount: Number(total) })
        }
        : undefined;
    const { branches: gitBranches, totalCount } = await gitService.getBranches(repository, options);
    const branches = await (0, branch_1.assignScansToBranches)({
        branches: gitBranches,
        repositoryId: Number(repositoryId)
    });
    return res.status(200).send({ branches, totalCount });
};
exports.list = list;
const find = async (req, res) => {
    const { params: { branch }, query: { repositoryId }, user, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound(`Repository with id=${repositoryId} not found.`);
    }
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, repository.provider);
    try {
        const gitBranch = await gitService.getBranch(repository, branch);
        return res.status(200).send(gitBranch);
    }
    catch {
        throw boom_1.default.notFound(`Couldn't fetch branch with name "${branch}". Please check if the branch exists.`);
    }
};
exports.find = find;
//# sourceMappingURL=branches.js.map