"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkRequestChangeStatus = exports.requestChangeStatus = exports.codeBlock = exports.filters = exports.links = exports.bulkPatch = exports.patchOne = exports.updateFindings = exports.find = exports.getFindingsCount = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const findings_1 = require("../helpers/core-api/findings");
const queryParamParser_1 = require("../helpers/core-api/queryParamParser");
const common_1 = require("../helpers/common");
const findings_2 = require("../helpers/findings");
const findingLinks_1 = require("../helpers/findingLinks");
const repositories_1 = require("../helpers/core-api/repositories");
const interfaces_1 = require("../interfaces");
const scans_1 = require("../helpers/core-api/scans");
const actions_1 = require("../helpers/actions");
const severityMapping = {
    'N/A': '1000',
    INFORMATIONAL: '1001',
    LOW: '1002',
    MEDIUM: '1003',
    HIGH: '1004',
    CRITICAL: '1005'
};
const list = async (req, res) => {
    const { query: { repositoryIds, branchName, scanId, isParanoid, ruleIds, engineRuleIds, language, severityIds, status: statusParam, type, introducedBy, path, hasTicket }, permission } = req;
    let parsedRepositoryIds = repositoryIds
        ? (0, queryParamParser_1.parseNumberParams)(repositoryIds)
        : undefined;
    const parsedSeverityIds = severityIds
        ? (0, queryParamParser_1.parseStringParams)(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
        : undefined;
    const noResults = {
        data: [],
        count: {
            total: 0,
            open: 0,
            resolved: 0,
            fixed: 0,
            findings: 0
        }
    };
    if (scanId) {
        const scan = await (0, scans_1.getScan)(scanId);
        if (!scan) {
            throw boom_1.default.notFound('Scan not found.');
        }
        // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
        // then we can short-circuit here as no results will match.
        if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
            return res.status(200).send(noResults);
        }
        parsedRepositoryIds = [scan.repository.idRepository];
    }
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    // we do not want to return an error since the user can have no repo registered yet
    if (!allowedIds.length) {
        return res.status(200).send(noResults);
    }
    if (!(0, findings_2.isValidStatusParam)(statusParam)) {
        throw boom_1.default.badRequest("Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum");
    }
    const status = (0, findings_2.parseStatusQueryParam)(statusParam);
    const parsedFilters = (0, common_1.parseListParams)({
        ruleIds,
        engineRuleIds,
        language,
        type,
        introducedBy,
        path
    });
    const response = await (0, findings_1.queryGroupedFindings)({
        repositoryIds: allowedIds,
        branchName,
        scanId,
        isParanoid,
        filters: {
            ...parsedFilters,
            severityIds: parsedSeverityIds,
            status,
            hasTicket
        }
    });
    return res.status(200).send(response);
};
exports.list = list;
const getFindingsCount = async (req, res) => {
    const { query: { repositoryId, branchName }, permission } = req;
    const allowedIds = permission.repositoriesEnforce(Number(repositoryId));
    // we do not want to return an error since the user can have no repo registered yet
    if (!allowedIds.length) {
        return res.status(200).send({});
    }
    const response = await (0, findings_1.getFindingsCount)(allowedIds[0], branchName);
    return res.status(200).send(response);
};
exports.getFindingsCount = getFindingsCount;
const find = async (req, res) => {
    const { params: { ruleId }, query: { repositoryIds, branchName, scanId, isParanoid, ruleIds, engineRuleIds, language, severityIds, status: statusParam, type, introducedBy, path, hasTicket, limit, offset }, permission } = req;
    let parsedRepositoryIds = repositoryIds ? (0, queryParamParser_1.parseNumberParams)(repositoryIds) : undefined;
    const parsedSeverityIds = severityIds
        ? (0, queryParamParser_1.parseStringParams)(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
        : undefined;
    if (scanId) {
        const scan = await (0, scans_1.getScan)(scanId);
        if (!scan) {
            throw boom_1.default.notFound('Scan not found.');
        }
        // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
        // then we can short-circuit here as no results will match.
        if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
            return res.status(200).send([]);
        }
        parsedRepositoryIds = [scan.repository.idRepository];
    }
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    // we do not want to return an error since the user can have no repo registered yet
    if (!allowedIds.length) {
        return res.status(200).send([]);
    }
    if (!(0, findings_2.isValidStatusParam)(statusParam)) {
        throw boom_1.default.badRequest("Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum");
    }
    const status = (0, findings_2.parseStatusQueryParam)(statusParam);
    const parsedFilters = (0, common_1.parseListParams)({
        ruleIds,
        engineRuleIds,
        language,
        type,
        introducedBy,
        path
    });
    const response = await (0, findings_1.queryFindings)({
        repositoryIds: allowedIds,
        branchName,
        isParanoid,
        scanId,
        ruleId,
        filters: {
            ...parsedFilters,
            severityIds: parsedSeverityIds,
            status,
            hasTicket
        },
        limit,
        offset
    });
    return res.status(200).send(response);
};
exports.find = find;
const updateFindings = async (req, res) => {
    const { query: { repositoryIds, branchName, scanId, isParanoid, engineRuleIds, language, severityIds, status: statusParam, type, introducedBy, path, hasTicket }, body: { total, status: newStatus, excludedIds, ruleIds }, permission, account, userInDb } = req;
    let parsedRepositoryIds = repositoryIds ? (0, queryParamParser_1.parseNumberParams)(repositoryIds) : undefined;
    if (scanId) {
        const scan = await (0, scans_1.getScan)(scanId);
        if (!scan) {
            throw boom_1.default.notFound('Scan not found.');
        }
        // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
        // then we can short-circuit here as no results will match.
        if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
            return res.status(200).send({ totalUpdatedFindings: 0 });
        }
        parsedRepositoryIds = [scan.repository.idRepository];
    }
    const parsedSeverityIds = severityIds
        ? (0, queryParamParser_1.parseStringParams)(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
        : undefined;
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({ totalUpdatedFindings: 0 });
    }
    if (!(0, findings_2.isValidStatusParam)(statusParam)) {
        throw boom_1.default.badRequest("Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum");
    }
    const status = (0, findings_2.parseStatusQueryParam)(statusParam);
    const parsedFilters = (0, common_1.parseListParams)({
        engineRuleIds,
        language,
        type,
        introducedBy,
        path
    });
    const updateResults = await (0, findings_2.batchUpdateFindings)({
        repositoryIds: allowedIds,
        branchName,
        isParanoid: !!isParanoid,
        scanId,
        filters: {
            ...parsedFilters,
            severityIds: parsedSeverityIds,
            status,
            hasTicket,
            ruleIds
        },
        total,
        newStatus,
        idAccount: account.idAccount,
        user: userInDb,
        excludedIds
    });
    let totalUpdated = 0;
    updateResults
        .filter(r => r.updated)
        .forEach(({ totalUpdatedFindings }) => {
        totalUpdated += totalUpdatedFindings;
    });
    return res.status(200).send({ totalUpdatedFindings: totalUpdated });
};
exports.updateFindings = updateFindings;
const patchOne = async (req, res) => {
    const { params: { findingId }, body: { status }, permission, userInDb, account } = req;
    if (account.findingConfiguration?.requireApprovalOnUpdate) {
        throw boom_1.default.forbidden('The approval process has been enabled. Please use this endpoint to update finding status: v2/findings/{idFinding}/request-change');
    }
    const finding = await (0, findings_1.getFindingById)(findingId);
    if (!finding) {
        throw boom_1.default.notFound(`No finding exist with id '${findingId}'.`);
    }
    permission.repositoriesEnforce(finding.repository.idRepository);
    const { updated, finding: updatedFinding } = await (0, findings_2.updateActionAndPatchFindingStatus)(finding, status, userInDb, account.idAccount);
    if (!updated) {
        throw boom_1.default.badRequest(`You are not allowed to change a finding/vulnerability status from ${finding.status} to ${status}.`);
    }
    return res.status(200).send(updatedFinding);
};
exports.patchOne = patchOne;
const bulkPatch = async (req, res) => {
    const { body: { findingIds, patch }, permission, userInDb, account } = req;
    if (account.findingConfiguration?.requireApprovalOnUpdate) {
        throw boom_1.default.forbidden('The approval process has been enabled. Please use this endpoint to update finding status: v2/findings/bulk-request-change');
    }
    const findings = await (0, findings_1.getFindingsByIds)(findingIds);
    const repositoryIds = findings.map(finding => finding.fkRepository);
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    const updatedFindingsResult = await Promise.all(findings
        .filter(f => allowedIds.includes(f.repository.idRepository))
        .map(finding => (0, findings_2.updateActionAndPatchFindingStatus)(finding, patch.status, userInDb, account.idAccount)));
    // get only the updated ones
    const updatedFindings = updatedFindingsResult.filter(r => r.updated).map(r => r.finding);
    if (!updatedFindings.length) {
        throw boom_1.default.badRequest("There was not findings/vulnerabilities to update. This happens when all changes aren't allowed. Please refer to the documentation or contact support.");
    }
    return res.status(200).send({ updatedFindings });
};
exports.bulkPatch = bulkPatch;
const links = async (req, res) => {
    const { query: { findingId, scanId }, permission } = req;
    const finding = await (0, findings_1.getFindingById)(findingId);
    if (!finding) {
        throw boom_1.default.notFound(`Finding with id '${findingId}' doesn't exist.`);
    }
    permission.repositoriesEnforce(finding.fkRepository);
    const { providerCodeLink } = await (0, findingLinks_1.getFindingLinks)(finding, scanId);
    return res.status(200).send({ providerCodeLink });
};
exports.links = links;
const filters = async (req, res) => {
    const { query: { repositoryIds, branchName, scanId, isParanoid, ruleIds, engineRuleIds, language, severityIds, status: statusParam, type, introducedBy, path, hasTicket }, permission } = req;
    let parsedRepositoryIds = repositoryIds ? (0, queryParamParser_1.parseNumberParams)(repositoryIds) : undefined;
    const parsedSeverityIds = severityIds
        ? (0, queryParamParser_1.parseStringParams)(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
        : undefined;
    const noResults = {
        engineRule: [],
        introducedBy: [],
        language: [],
        severity: [],
        path: [],
        rule: [],
        status: [],
        type: []
    };
    if (scanId) {
        const scan = await (0, scans_1.getScan)(scanId);
        if (!scan) {
            throw boom_1.default.notFound('Scan not found.');
        }
        // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
        // then we can short-circuit here as no results will match.
        if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
            return res.status(200).send(noResults);
        }
        parsedRepositoryIds = [scan.repository.idRepository];
    }
    const allowedIds = permission.repositoriesEnforce(parsedRepositoryIds);
    // we do not want to return an error since the user can have no repo registered yet
    if (!allowedIds.length) {
        return res.status(200).send(noResults);
    }
    if (!(0, findings_2.isValidStatusParam)(statusParam)) {
        throw boom_1.default.badRequest("Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum");
    }
    const status = (0, findings_2.parseStatusQueryParam)(statusParam);
    const parsedFilters = (0, common_1.parseListParams)({
        ruleIds,
        engineRuleIds,
        language,
        type,
        introducedBy,
        path
    });
    const response = await (0, findings_1.queryFindingsFilters)({
        repositoryIds: allowedIds,
        branchName,
        scanId,
        isParanoid,
        filters: {
            ...parsedFilters,
            severityIds: parsedSeverityIds,
            status,
            hasTicket
        }
    });
    return res.status(200).send(response);
};
exports.filters = filters;
const codeBlock = async (req, res) => {
    const { params: { findingId }, user, permission } = req;
    const finding = await (0, findings_1.getFindingById)(findingId);
    if (!finding) {
        throw boom_1.default.notFound(`Finding with id '${findingId}' doesn't exist.`);
    }
    permission.repositoriesEnforce(finding.fkRepository);
    const repository = await (0, repositories_1.getRepositoryWithAccountById)(finding.repository.idRepository);
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const content = await (0, findings_2.getCodeBlock)(finding, repository, user);
    let language = 'general';
    if (finding.engineRule) {
        language = finding.engineRule.engine.language;
    }
    else if (finding.customEngineRule) {
        language = finding.customEngineRule.engine.language;
    }
    return res.status(200).send({
        content: content || '',
        language,
        error: content && Object.values(interfaces_1.FindingCodeBlockError).includes(content)
    });
};
exports.codeBlock = codeBlock;
const requestChangeStatus = async (req, res) => {
    const { params: { findingId }, body: { status, comments }, permission, userInDb, account } = req;
    if (!account.findingConfiguration?.requireApprovalOnUpdate) {
        throw boom_1.default.forbidden('The approval process has been disabled. Please use this endpoint to update vulnerability status: v2/findings/{idFinding}');
    }
    const finding = await (0, findings_1.getFindingById)(findingId);
    if (!finding) {
        throw boom_1.default.notFound(`No finding exist with id '${findingId}'.`);
    }
    permission.repositoriesEnforce(finding.repository.idRepository);
    if (!(0, findings_2.isStatusTransitionAllowed)(finding.status, status)) {
        throw boom_1.default.badRequest(`You are not allowed to change a finding/vulnerability status from ${finding.status} to ${status}.`);
    }
    const requestedAction = await (0, actions_1.createChangeStatusRequestAction)(finding, status, account.idAccount, userInDb, comments);
    return res.status(200).send(requestedAction);
};
exports.requestChangeStatus = requestChangeStatus;
const bulkRequestChangeStatus = async (req, res) => {
    const { body: { findingIds, patch }, permission, userInDb, account } = req;
    if (!account.findingConfiguration?.requireApprovalOnUpdate) {
        throw boom_1.default.forbidden('The approval process has been disabled. Please use this endpoint to update vulnerability status: v2/findings/bulk');
    }
    const findings = await (0, findings_1.getFindingsByIds)(findingIds);
    const repositoryIds = findings.map(finding => finding.fkRepository);
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    const updatedFindingsResult = await Promise.all(findings
        .filter(f => allowedIds.includes(f.repository.idRepository) &&
        (0, findings_2.isStatusTransitionAllowed)(f.status, patch.status))
        .map(finding => (0, actions_1.createChangeStatusRequestAction)(finding, patch.status, account.idAccount, userInDb, patch.comments)));
    if (!updatedFindingsResult.length) {
        throw boom_1.default.badRequest("There was not findings/vulnerabilities to update. This happens when all changes aren't allowed. Please refer to the documentation or contact support.");
    }
    return res.status(200).send({ updatedFindings: updatedFindingsResult });
};
exports.bulkRequestChangeStatus = bulkRequestChangeStatus;
//# sourceMappingURL=findings.js.map