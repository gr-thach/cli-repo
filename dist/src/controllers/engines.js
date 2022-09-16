"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCustomEngine = exports.listRules = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const acl_1 = require("../helpers/acl");
const engines_1 = require("../helpers/core-api/engines");
const engines_2 = require("../helpers/engines");
const interfaces_1 = require("../interfaces");
const permissions_1 = require("../helpers/permissions");
const permission_1 = __importDefault(require("../services/permissions/permission"));
const accounts_1 = require("../helpers/core-api/accounts");
const accountsV2_1 = require("../helpers/accountsV2");
const list = async (req, res) => {
    const { account } = req;
    return res.status(200).send(await (0, engines_1.listEngines)(account.idAccount));
};
exports.list = list;
const listRules = async (req, res) => {
    const { account } = req;
    return res.status(200).send(await (0, engines_1.listEngineRules)(account.idAccount));
};
exports.listRules = listRules;
const uploadCustomEngine = async (req, res) => {
    const { files, query: { login, provider }, user } = req;
    if (!files) {
        throw boom_1.default.notFound('No files were uploaded.');
    }
    const { allowedAccounts } = await (0, acl_1.getAllowedAccountsByUser)(user);
    const accounts = await (0, accounts_1.findAccountsByIdentifiers)([login], provider);
    const account = (0, accountsV2_1.filterAccountsByAllowedAccounts)(accounts, allowedAccounts);
    if (!account) {
        throw boom_1.default.notFound('Account Not Found');
    }
    const policy = await (0, permissions_1.getPolicyByRequestUserAndAccount)(user, account);
    (await permission_1.default.factory(policy, interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.CUSTOM_ENGINES)).enforce();
    let manifestData;
    try {
        manifestData = await (0, engines_2.extractManifestDataFromCustomEngineFile)(files.engine.data);
    }
    catch (e) {
        throw new Error(`Error uncompressing, parsing and reading the uploaded custom engine zip file. Exception: ${e.message}.`);
    }
    const { newAllowFor, summary } = (0, engines_2.transformAllowFor)(manifestData.allowFor, allowedAccounts);
    if (!summary.included) {
        return res.status(400).send({
            message: "None of the accounts on the allowFor attr could be added because this user has no permissions over them. Therefore, the custom engine won't be imported because it won't run.",
            allowForSummary: summary
        });
    }
    const importResult = await (0, engines_1.importCustomEngine)(account.idAccount, {
        ...manifestData,
        allowFor: newAllowFor
    });
    return res.status(200).send({ ...importResult, allowForSummary: summary });
};
exports.uploadCustomEngine = uploadCustomEngine;
//# sourceMappingURL=engines.js.map