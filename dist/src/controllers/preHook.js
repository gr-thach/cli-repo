"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfiguration = exports.getVersion = exports.getScan = exports.uploadUrl = exports.trigger = void 0;
const uuid_1 = require("uuid");
const boom_1 = __importDefault(require("@hapi/boom"));
const merge_1 = __importDefault(require("lodash/merge"));
const preHook_1 = require("../helpers/preHook");
const common_1 = require("../helpers/common");
const cli_1 = require("../helpers/cli");
const scan_1 = require("../helpers/scan");
const scans_1 = require("../helpers/core-api/scans");
const subscription_1 = require("../helpers/subscription");
const interfaces_1 = require("../interfaces");
const trigger = async (req, res) => {
    (0, preHook_1.validateIsOnPremise)();
    const { body: { cliToken, preHookToken, repositoryProviderInternalId, sha, branch, gitArchiveFileName, gitDiffFileName, provider } } = req;
    await (0, preHook_1.validateTokens)(cliToken, preHookToken);
    const repository = await (0, preHook_1.findRepositoryByToken)(cliToken, preHookToken, provider, repositoryProviderInternalId);
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const configuration = {
        bundles: [
            {
                general: ['detect-secrets', 'gr-secrets', 'semgrep']
            }
        ]
    };
    const dashboardUrl = (0, common_1.linkToScan)(repository.account, repository.idRepository, sha);
    const idScan = await (0, scan_1.triggerScan)(sha, branch, repository.account, repository, interfaces_1.ScanType.PRE_HOOK, (0, subscription_1.queuePriority)(repository.account.subscription, interfaces_1.ScanType.PRE_HOOK), gitArchiveFileName, gitDiffFileName, configuration);
    return res.status(200).send({ idScan, dashboardUrl });
};
exports.trigger = trigger;
const uploadUrl = async (req, res) => {
    (0, preHook_1.validateIsOnPremise)();
    const { body: { cliToken, preHookToken } } = req;
    await (0, preHook_1.validateTokens)(cliToken, preHookToken);
    const fileName = (0, uuid_1.v4)();
    const signedUrl = await (0, cli_1.getUploadUrl)(fileName);
    return res.status(200).send({ signedUrl, fileName });
};
exports.uploadUrl = uploadUrl;
const getScan = async (req, res) => {
    (0, preHook_1.validateIsOnPremise)();
    const { query: { cliToken, preHookToken, idScan } } = req;
    await (0, preHook_1.validateTokens)(cliToken, preHookToken);
    let scan;
    if (cliToken) {
        scan = await (0, scans_1.getScanByCliToken)(idScan, cliToken);
    }
    else if (preHookToken) {
        scan = await (0, scans_1.getScan)(idScan);
    }
    if (!scan) {
        throw boom_1.default.notFound('Scan not found');
    }
    if (scan.type !== interfaces_1.ScanType.PRE_HOOK) {
        throw boom_1.default.badRequest("Not allowed to fetch a scan that isn't a pre-hook scan.");
    }
    return res.status(200).send({
        idScan: scan.idScan,
        status: scan.status,
        result: scan.result
    });
};
exports.getScan = getScan;
const getVersion = async (req, res) => {
    (0, preHook_1.validateIsOnPremise)();
    const { query: { provider, version } } = req;
    if (typeof version !== 'string') {
        throw boom_1.default.badRequest('Version should be a string.');
    }
    // Version should be in the format major.minor.patch (e.g. 12.3.4).
    if (!/^\d+\.\d+\.\d+$/g.test(version)) {
        throw boom_1.default.badRequest('Invalid version format.');
    }
    let result;
    if (provider === interfaces_1.GitProvider.GITLAB) {
        if (version === '1.0.0') {
            result = {
                status: 'UP_TO_DATE'
            };
        }
        else {
            result = {
                status: 'UNSUPPORTED_VERSION',
                info: 'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
            };
        }
    }
    else if (provider === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
        if (version === '1.0.0') {
            result = {
                status: 'UP_TO_DATE'
            };
        }
        else {
            result = {
                status: 'UNSUPPORTED_VERSION',
                info: 'This version of the plugin is no longer supported, you need to upgrade to a newer version.'
            };
        }
    }
    else {
        throw boom_1.default.badRequest(`Unexpected provider '${provider}'.`);
    }
    return res.status(200).send(result);
};
exports.getVersion = getVersion;
const getConfiguration = async (req, res) => {
    (0, preHook_1.validateIsOnPremise)();
    const { query: { cliToken, preHookToken, provider, repositoryProviderInternalId } } = req;
    await (0, preHook_1.validateTokens)(cliToken, preHookToken);
    const repository = await (0, preHook_1.findRepositoryByToken)(cliToken, preHookToken, provider, repositoryProviderInternalId);
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    const defaultConfig = { preHook: { enabled: false } };
    const config = (0, merge_1.default)(defaultConfig, repository.account.configuration, repository.configuration);
    if (!repository.isEnabled) {
        config.preHook.enabled = false;
    }
    return res.status(200).send(config.preHook);
};
exports.getConfiguration = getConfiguration;
//# sourceMappingURL=preHook.js.map