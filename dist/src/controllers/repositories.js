"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkPatch = exports.filters = exports.stats = exports.update = exports.config = exports.find = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const common_1 = require("../helpers/common");
const repositories_1 = require("../helpers/core-api/repositories");
const repository_1 = require("../helpers/repository");
const vulnerabilities_1 = require("../helpers/core-api/vulnerabilities");
const core_api_1 = require("../helpers/core-api");
const yml_1 = require("../helpers/yml");
const interfaces_1 = require("../interfaces");
const permission_1 = __importDefault(require("../services/permissions/permission"));
const repositories_2 = __importDefault(require("../services/repositories"));
const list = async (req, res) => {
    const { query: { limit, offset, orderBy = 'updatedAt,desc', teamId, pkg_ecosystem, license, search, dependency, isPrivate, language, isEnabled, monorepoId }, permission } = req;
    const allowedIds = permission.repositoriesEnforce();
    if (allowedIds.length === 0) {
        return res.status(200).send({
            repositories: [],
            totalCount: 0
        });
    }
    const { repositories, totalCount } = await (0, repositories_1.queryRepositoriesByIds)(allowedIds, {
        teamId,
        orderBy,
        limit,
        offset,
        dependency,
        license,
        pkgEcosystem: pkg_ecosystem,
        isPrivate,
        language: (0, common_1.parseListParam)(language),
        isEnabled,
        monorepoId,
        ...(monorepoId ? { path: search } : { name: search })
    });
    const writePermission = await permission_1.default.factory(permission.policy, interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.REPOSITORIES);
    return res.status(200).send({
        repositories: repositories.map(repository => ({
            ...repository,
            write: writePermission.getAllowedIds(repository.idRepository).length > 0
        })),
        totalCount
    });
};
exports.list = list;
const find = async (req, res) => {
    const { 
    // TODO: change to repositoryId
    params: { repoId: repositoryId }, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const writePermission = await permission_1.default.factory(permission.policy, interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.REPOSITORIES);
    const write = writePermission.getAllowedIds(repository.idRepository).length > 0;
    return res.status(200).send({ ...repository, write });
};
exports.find = find;
const config = async (req, res) => {
    const { 
    // TODO: change to repositoryId
    body: { repoId: repositoryId, configuration }, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    let parsedConfiguration;
    try {
        parsedConfiguration = (0, yml_1.validateInstallationConfig)(configuration);
    }
    catch (e) {
        const errName = e.name;
        if (errName === 'ValidationError') {
            throw boom_1.default.badRequest("Some fields didn't pass validation", {
                details: e.details.map((detail) => ({
                    message: detail.message,
                    path: detail.path
                }))
            });
        }
        else if (errName === 'YAMLException' || errName === 'SyntaxError') {
            throw boom_1.default.badData(e.message);
        }
        else {
            throw e;
        }
    }
    try {
        await (0, repositories_1.updateRepository)(Number(repositoryId), {
            configuration: parsedConfiguration,
            updatedAt: new Date().toJSON()
        });
    }
    catch (e) {
        throw boom_1.default.badRequest(e.message);
    }
    return res.sendStatus(200);
};
exports.config = config;
const update = async (req, res) => {
    const { params: { repositoryId }, body: { isEnabled }, permission, user } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const service = new repositories_2.default(user);
    const updatedRepo = await service.enableRepository(repository, isEnabled);
    return res.status(200).send(updatedRepo);
};
exports.update = update;
const stats = async (req, res) => {
    const { query: { repositoryIds, days = '30' }, permission } = req;
    const parsedRepositoryIds = repositoryIds ? (0, core_api_1.parseNumberParams)(repositoryIds) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    let statsOverTime = [];
    if (allowedIds.length) {
        statsOverTime = await (0, vulnerabilities_1.queryVulnerabilitiesOverTime)(allowedIds, Number(days));
    }
    return res.status(200).send((0, repository_1.formatRepositoriesStatsResponse)(statsOverTime, Number(days)));
};
exports.stats = stats;
const filters = async (req, res) => {
    const { query: { search, isPrivate, language, isEnabled, monorepoId }, permission } = req;
    const allowedIds = permission.repositoriesEnforce();
    if (!allowedIds.length) {
        return res.status(200).send({
            language: []
        });
    }
    const repoFilters = await (0, repositories_1.queryRepoFilters)(allowedIds, {
        isPrivate,
        language: (0, common_1.parseListParam)(language),
        isEnabled,
        monorepoId,
        ...(monorepoId ? { path: search } : { name: search })
    });
    return res.status(200).send(repoFilters);
};
exports.filters = filters;
const bulkPatch = async (req, res) => {
    const { body: { repositoryIds, isEnabled }, permission, user } = req;
    const parsedRepositoryIds = repositoryIds ? (0, core_api_1.parseNumberParams)(repositoryIds) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    const repositories = await (0, repositories_1.getRepositoriesByIds)(allowedIds);
    const success = [];
    const service = new repositories_2.default(user);
    await Promise.all(repositories.map(repository => (async () => {
        let hasError = false;
        try {
            await service.enableRepository(repository, isEnabled);
        }
        catch (error) {
            hasError = true;
        }
        if (!hasError) {
            success.push(repository.idRepository);
        }
    })()));
    return res.status(200).send(success);
};
exports.bulkPatch = bulkPatch;
//# sourceMappingURL=repositories.js.map