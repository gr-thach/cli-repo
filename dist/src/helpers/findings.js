"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchUpdateFindings = exports.updateActionAndPatchFindingStatus = exports.getCodeBlock = exports.parseStatusQueryParam = exports.isValidStatusParam = exports.isStatusTransitionAllowed = exports.findFindingInScan = void 0;
const get_1 = __importDefault(require("lodash/get"));
const interfaces_1 = require("../interfaces");
const cache_1 = __importDefault(require("../services/cache"));
const gitServiceFactory_1 = require("./gitServiceFactory");
const config_1 = require("../../config");
const scans_1 = require("./core-api/scans");
const findings_1 = require("./core-api/findings");
const actions_1 = require("./actions");
const findFindingInScan = (scan, idFinding) => {
    if (scan.engineRuns) {
        // eslint-disable-next-line no-restricted-syntax
        for (const engineRun of scan.engineRuns) {
            if (engineRun.engineRunsFindings) {
                // eslint-disable-next-line no-restricted-syntax
                for (const engineRunsFinding of engineRun.engineRunsFindings) {
                    if (engineRunsFinding.finding && engineRunsFinding.finding.idFinding === idFinding) {
                        return engineRunsFinding.finding;
                    }
                }
            }
        }
    }
    return null;
};
exports.findFindingInScan = findFindingInScan;
const isStatusTransitionAllowed = (currentStatus, newStatus) => {
    if (currentStatus === newStatus) {
        return false;
    }
    if (!currentStatus && newStatus !== interfaces_1.ActionType.MARK_AS_VULNERABILITY) {
        return false;
    }
    return [
        interfaces_1.ActionType.WONT_FIX,
        interfaces_1.ActionType.FALSE_POSITIVE,
        interfaces_1.ActionType.MARK_AS_FIXED,
        interfaces_1.ActionType.MARK_AS_VULNERABILITY
    ].includes(newStatus);
};
exports.isStatusTransitionAllowed = isStatusTransitionAllowed;
const isValidStatusParam = (status) => {
    let isValid = true;
    if (status && status !== 'null') {
        const arr = status.split(',');
        if (!arr.length) {
            isValid = false;
        }
        else {
            arr.forEach(s => {
                if (!Object.values({ ...interfaces_1.ActionType, ...interfaces_1.FindingAutomaticStatus }).includes(s)) {
                    isValid = false;
                }
            });
        }
    }
    return isValid;
};
exports.isValidStatusParam = isValidStatusParam;
const parseStatusQueryParam = (statusParam) => {
    if (!statusParam) {
        return undefined;
    }
    if (statusParam === 'null') {
        return null;
    }
    return statusParam.toLowerCase().split(',');
};
exports.parseStatusQueryParam = parseStatusQueryParam;
const getCodeBlock = async (finding, repository, user) => {
    const { idFinding, path, lineNumber } = finding;
    const { provider } = repository;
    const lastScan = await (0, scans_1.getLastFindingScan)(idFinding);
    if (!lastScan) {
        return interfaces_1.FindingCodeBlockError.NO_SCAN;
    }
    const { sha } = lastScan;
    const cache = new cache_1.default(config_1.env.CACHE_PROVIDER).getInstance();
    const cacheKey = `codeBlock-${idFinding}-${sha}-${path}-${lineNumber}`;
    let codeBlock = await cache.get(cacheKey);
    if (!codeBlock) {
        const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, provider);
        try {
            const content = await gitService.getContent(repository, sha, path);
            if (content) {
                let lines = content.split('\n');
                if (lineNumber) {
                    const ln = lineNumber - 1;
                    lines = lines.slice(ln - 3 >= 0 ? ln - 3 : 0, ln + 4);
                }
                else {
                    lines = lines.slice(0, 6);
                }
                codeBlock = lines
                    .map(line => (line.length > 350 ? line.substring(0, 350) : line))
                    .join('\n');
                cache.set(cacheKey, codeBlock, 60 * 60 * 2); // 2 hours
            }
            else {
                codeBlock = undefined;
            }
        }
        catch (e) {
            if (provider === interfaces_1.GitProvider.GITHUB && (0, get_1.default)(e, 'errors[0].code') === 'too_large') {
                codeBlock = interfaces_1.FindingCodeBlockError.FILE_TOO_LARGE;
            }
            else {
                codeBlock = interfaces_1.FindingCodeBlockError.UNKNOWN;
            }
        }
    }
    return codeBlock;
};
exports.getCodeBlock = getCodeBlock;
const updateActionAndPatchFindingStatus = async (finding, newStatus, user, idAccount) => {
    if (!(0, exports.isStatusTransitionAllowed)(finding.status, newStatus)) {
        return {
            updated: false,
            finding
        };
    }
    await (0, actions_1.upsertActionByFinding)(finding, newStatus, idAccount, user);
    const fixed = [interfaces_1.ActionType.MARK_AS_FIXED, interfaces_1.FindingAutomaticStatus.FIXED].includes(newStatus);
    const updatedFinding = await (0, findings_1.updateFinding)(finding.idFinding, {
        status: newStatus,
        fixedAt: fixed ? new Date().toJSON() : null,
        fixedBy: fixed ? user.login : null,
        ...(!finding.introducedBy &&
            newStatus === interfaces_1.ActionType.MARK_AS_VULNERABILITY && {
            introducedBy: 'N/A',
            introducedAt: finding.createdAt
        })
    });
    return { updated: true, finding: updatedFinding };
};
exports.updateActionAndPatchFindingStatus = updateActionAndPatchFindingStatus;
const batchUpdateFindings = async ({ newStatus, idAccount, excludedIds, user, total, ...params }) => {
    const chunkSize = 500;
    const findingChunks = [];
    for (let offset = 0; offset < total; offset += chunkSize) {
        // eslint-disable-next-line no-await-in-loop
        const findingIds = await (0, findings_1.queryFindingIds)({ ...params, limit: chunkSize, offset });
        // eslint-disable-next-line no-await-in-loop
        const findings = await (0, findings_1.getFindingsByIds)(findingIds.map(({ idFinding }) => idFinding).filter((id) => !excludedIds.includes(id)));
        findingChunks.push(findings);
    }
    const results = [];
    for (let i = 0; i < findingChunks.length; i++) {
        const findings = findingChunks[i];
        const validFindings = findings.filter(finding => (0, exports.isStatusTransitionAllowed)(finding.status, newStatus));
        if (!validFindings.length) {
            results.push({ updated: false, totalUpdatedFindings: 0 });
        }
        else {
            // eslint-disable-next-line no-await-in-loop
            await (0, actions_1.bulkUpsertActionByFinding)({
                findings: validFindings,
                newStatus,
                accountId: idAccount,
                userId: user.idUser
            });
            const fixed = [interfaces_1.ActionType.MARK_AS_FIXED, interfaces_1.FindingAutomaticStatus.FIXED].includes(newStatus);
            // eslint-disable-next-line no-await-in-loop
            const [, totalUpdatedFindings] = await (0, findings_1.bulkUpdateFindings)(validFindings.map(({ idFinding }) => idFinding), {
                status: newStatus,
                fixedAt: fixed ? new Date().toJSON() : null,
                fixedBy: fixed ? user.login : null
            });
            results.push({ updated: true, totalUpdatedFindings: totalUpdatedFindings || 0 });
        }
    }
    return results;
};
exports.batchUpdateFindings = batchUpdateFindings;
//# sourceMappingURL=findings.js.map