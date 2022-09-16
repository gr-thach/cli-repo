"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryLatestScansByRepoBranch = exports.reTriggerScan = exports.triggerScan = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const uuid_1 = require("uuid");
const queue_1 = require("../queue");
const common_1 = require("./common");
const scans_1 = require("./core-api/scans");
const scanStatus_1 = require("./core-api/scanStatus");
const gitServiceFactory_1 = require("./gitServiceFactory");
const interfaces_1 = require("../interfaces");
const getScanMessage = (scanType) => {
    switch (scanType) {
        case interfaces_1.ScanType.PRE_HOOK:
            return 'Scan triggered via server-side Git pre-hook';
        case interfaces_1.ScanType.CLI:
            return 'On-demand scan triggered via the CLI';
        case interfaces_1.ScanType.BRANCH:
            return 'On-demand scan triggered via the Dashboard';
        default:
            throw Error(`Unexpected scan type '${scanType}'.`);
    }
};
const triggerScan = async (sha, branch, account, repository, scanType, priority, filename, diffFileName, config) => {
    if (!account)
        throw boom_1.default.notFound('Account not found');
    if (!repository)
        throw boom_1.default.notFound('Repository not found');
    const { idScan } = await (0, scans_1.createScan)({
        idScan: (0, uuid_1.v4)(),
        fkRepository: repository.idRepository,
        type: scanType,
        branch,
        sha,
        githookMetadata: {
            sender: {
                avatar_url: 'https://avatars2.githubusercontent.com/u/31360611?v=4',
                login: 'N/A'
            },
            config,
            ref: `${branch}-${(0, common_1.getAccountIdentifierValue)(account)}`,
            commit: {
                message: getScanMessage(scanType)
            }
        },
        fkScanStatus: await (0, scanStatus_1.getQueuedScanStatusId)(),
        queuedAt: new Date().toJSON(),
        createdAt: new Date().toJSON(),
        updatedAt: new Date().toJSON()
    });
    await (0, queue_1.sendToRabbitQueue)({
        idScan,
        ...(filename && { filename }),
        ...(diffFileName && { diffFileName })
    }, priority);
    return idScan;
};
exports.triggerScan = triggerScan;
const reTriggerScan = async (scan, priority, user, account, repository) => {
    if (scan.type === interfaces_1.ScanType.PULL) {
        const gitService = (0, gitServiceFactory_1.gitServiceFactory)(user, account.provider);
        await gitService.setQueuedStatus(account, repository, scan.sha);
    }
    const now = new Date().toJSON();
    await (0, scans_1.updateScan)(scan.idScan, {
        fkScanStatus: await (0, scanStatus_1.getQueuedScanStatusId)(),
        queuedAt: now,
        updatedAt: now
    });
    await (0, queue_1.sendToRabbitQueue)({
        idScan: scan.idScan
    }, priority);
};
exports.reTriggerScan = reTriggerScan;
const queryLatestScansByRepoBranch = async ({ repositoryId, branch }) => {
    return (0, scans_1.queryScans)({
        repositoryIds: [repositoryId],
        branch: branch.name,
        orderBy: 'finishedAt,desc',
        limit: 5,
        offset: null,
        filters: null
    });
};
exports.queryLatestScansByRepoBranch = queryLatestScansByRepoBranch;
//# sourceMappingURL=scan.js.map