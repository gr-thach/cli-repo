"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScan = exports.uploadUrl = exports.triggerZipScan = exports.trigger = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const subscription_1 = require("../helpers/subscription");
const scan_1 = require("../helpers/scan");
const interfaces_1 = require("../interfaces");
const common_1 = require("../helpers/common");
const cli_1 = require("../helpers/cli");
const accounts_1 = require("../helpers/core-api/accounts");
const repositories_1 = require("../helpers/core-api/repositories");
const scans_1 = require("../helpers/core-api/scans");
const triggerScanForCli = async (repository, sha, branch, filename) => {
    const dashboardUrl = (0, common_1.linkToScan)(repository.account, repository.idRepository, sha);
    const idScan = await (0, scan_1.triggerScan)(sha, branch, repository.account, repository, interfaces_1.ScanType.CLI, (0, subscription_1.queuePriority)(repository.account.subscription, interfaces_1.ScanType.CLI), filename);
    return { idScan, dashboardUrl };
};
const trigger = async (req, res) => {
    const { body: { clitoken, repository: repositoryName, sha, branch } } = req;
    const repository = await (0, repositories_1.findRepositoryWithAccountByCliToken)(clitoken, repositoryName);
    if (!repository) {
        throw boom_1.default.notFound('Repository not found');
    }
    const result = await triggerScanForCli(repository, sha, branch, undefined);
    return res.status(200).send(result);
};
exports.trigger = trigger;
const triggerZipScan = async (req, res) => {
    const { body: { clitoken, repository: repositoryName, sha, branch, fileName } } = req;
    const repository = await (0, repositories_1.findRepositoryWithAccountByCliToken)(clitoken, repositoryName);
    if (!repository) {
        throw boom_1.default.notFound('Repository not found');
    }
    const result = await triggerScanForCli(repository, sha, branch, fileName);
    return res.status(200).send(result);
};
exports.triggerZipScan = triggerZipScan;
const uploadUrl = async (req, res) => {
    const { body: { clitoken, file } } = req;
    const account = await (0, accounts_1.findBaseAccountByCliToken)(clitoken);
    if (!account) {
        throw boom_1.default.notFound('Account not found');
    }
    const signedUrl = await (0, cli_1.getUploadUrl)(file);
    return res.status(200).send({ signedUrl });
};
exports.uploadUrl = uploadUrl;
const getScan = async (req, res) => {
    const { headers: { clitoken, idscan } } = req;
    const scan = await (0, scans_1.getScanByCliToken)(idscan, clitoken);
    if (!scan)
        throw boom_1.default.notFound('Scan not found');
    return res.status(200).send(scan);
};
exports.getScan = getScan;
//# sourceMappingURL=cli.js.map