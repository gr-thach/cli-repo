"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkTrigger = exports.filters = exports.listLast = exports.reTrigger = exports.trigger = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const scan_1 = require("../helpers/scan");
const subscription_1 = require("../helpers/subscription");
const gitServiceFactory_1 = require("../helpers/gitServiceFactory");
const interfaces_1 = require("../interfaces");
const repositories_1 = require("../helpers/core-api/repositories");
const scans_1 = require("../helpers/core-api/scans");
const index_1 = require("../helpers/core-api/index");
const common_1 = require("../helpers/common");
const list = async (req, res) => {
    const { query: { repositoryIds, branch, limit, offset, orderBy = 'updatedAt,desc', search, type, sha, hasVulnerabilities, sender }, permission } = req;
    const parsedRepositoryIds = repositoryIds ? (0, index_1.parseNumberParams)(repositoryIds) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({ scans: [], totalCount: 0 });
    }
    const parsedFilters = (0, common_1.parseListParams)({ sha, type, sender });
    let _search = search;
    let _sha = parsedFilters.sha;
    if (!sha && search && /\b([a-f0-9]{40})\b/.test(String(search))) {
        _sha = [search];
        _search = undefined;
    }
    const data = await (0, scans_1.queryScans)({
        repositoryIds: allowedIds,
        branch: branch || null,
        limit,
        offset,
        orderBy,
        filters: {
            ...parsedFilters,
            sha: _sha,
            search: _search,
            hasVulnerabilities
        }
    });
    return res.status(200).send(data);
};
exports.list = list;
const trigger = async (req, res) => {
    const { params: { repositoryId }, query: { branch }, user, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const scanType = interfaces_1.ScanType.BRANCH; // so far we leave this hardcoded to BRANCH
    const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, repository.provider);
    let sha;
    try {
        sha = await gitService.getBranchSha(repository, branch);
    }
    catch (e) {
        throw boom_1.default.notFound(`Branch ${branch} for repository ${repository.name} couldn't be found on ${repository.provider}`);
    }
    const idScan = await (0, scan_1.triggerScan)(sha, branch, repository.account, repository, scanType, (0, subscription_1.queuePriority)(repository.account.subscription, scanType));
    return res.status(200).send({ idScan });
};
exports.trigger = trigger;
const reTrigger = async (req, res) => {
    const { params: { repositoryId }, query: { scanId }, user, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(Number(repositoryId));
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const scan = await (0, scans_1.getScan)(scanId);
    if (!repository || !scan) {
        throw boom_1.default.notFound(`${!repository ? 'Repository' : 'Scan'} not found`);
    }
    if (repository.idRepository !== scan.repository.idRepository) {
        throw boom_1.default.badRequest("Scan doesn't belong to the provided repository.");
    }
    await (0, scan_1.reTriggerScan)(scan, (0, subscription_1.queuePriority)(repository.account.subscription, scan.type), user, repository.account, repository);
    return res.status(200).send({ idScan: scan.idScan });
};
exports.reTrigger = reTrigger;
const listLast = async (req, res) => {
    const { query: { repositoryIds, limit }, permission } = req;
    const parsedRepositoryIds = repositoryIds ? (0, index_1.parseNumberParams)(String(repositoryIds)) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send([]);
    }
    const scans = await (0, scans_1.queryLastScanPerRepo)(allowedIds, limit);
    return res.status(200).send(scans);
};
exports.listLast = listLast;
const filters = async (req, res) => {
    const { query: { repositoryIds, branch, search, type, sha, hasVulnerabilities, sender }, permission } = req;
    const parsedRepositoryIds = repositoryIds ? (0, index_1.parseNumberParams)(repositoryIds) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({
            type: [],
            sha: [],
            sender: []
        });
    }
    const parsedFilters = (0, common_1.parseListParams)({ sha, type, sender });
    const scanFilters = await (0, scans_1.queryScansFilters)({
        repositoryIds: allowedIds,
        branch,
        filters: {
            ...parsedFilters,
            search,
            hasVulnerabilities
        }
    });
    return res.status(200).send(scanFilters);
};
exports.filters = filters;
const bulkTrigger = async (req, res) => {
    const { body: { repositoryIds }, user, permission } = req;
    const parsedRepositoryIds = repositoryIds ? (0, index_1.parseNumberParams)(repositoryIds) : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({ succeedCount: 0 });
    }
    const repositories = await (0, repositories_1.getRepositoriesByIds)(allowedIds);
    const result = await Promise.allSettled(repositories.map(async (repository) => {
        const { defaultBranch: branch, account } = repository;
        const scanType = interfaces_1.ScanType.BRANCH;
        const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, repository.provider);
        try {
            const sha = await gitService.getBranchSha(repository, branch);
            return await (0, scan_1.triggerScan)(sha, branch, account, repository, scanType, (0, subscription_1.queuePriority)(account.subscription, scanType));
        }
        catch (e) {
            throw boom_1.default.notFound(`Branch ${branch} for repository ${repository.name} couldn't be found on ${repository.provider}`);
        }
    }));
    const succeedCount = Object.values(result).filter(r => r.status === 'fulfilled').length;
    return res.status(200).send({ succeedCount });
};
exports.bulkTrigger = bulkTrigger;
//# sourceMappingURL=scans.js.map