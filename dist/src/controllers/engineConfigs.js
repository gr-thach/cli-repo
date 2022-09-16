"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const engineConfig_1 = require("../helpers/engineConfig");
const engineConfigs_1 = require("../helpers/core-api/engineConfigs");
const list = async (req, res) => {
    const { account } = req;
    const engineSpecs = await (0, engineConfig_1.listEngineConfig)(account.idAccount);
    return res.send(engineSpecs);
};
exports.list = list;
const create = async (req, res) => {
    const { params: { engineId }, body: { rules, envVars }, query: { configSpecId }, account } = req;
    let engineConfig;
    const configSpec = await (0, engineConfigs_1.fetchCustomConfigSpec)(String(configSpecId));
    if (!configSpec) {
        throw boom_1.default.badRequest('Error: config spec not found for this account');
    }
    try {
        engineConfig = await (0, engineConfig_1.createEngineConfig)(Number(engineId), account.idAccount, { rules, envVars }, configSpec);
    }
    catch (e) {
        throw boom_1.default.badRequest(e.message);
    }
    return res.status(201).send(engineConfig);
};
exports.create = create;
const update = async (req, res) => {
    const { params: { engineId }, body: { rules, envVars }, query: { engineConfigId, configSpecId }, account } = req;
    const accountEngineConfig = await (0, engineConfigs_1.getEngineAccountConfig)(String(engineConfigId), account.idAccount);
    if (!accountEngineConfig) {
        throw boom_1.default.notFound(`Engine config with id ${engineConfigId} and accountId ${account.idAccount} not found`);
    }
    const configSpec = await (0, engineConfigs_1.fetchCustomConfigSpec)(String(configSpecId));
    if (!configSpec) {
        throw boom_1.default.badRequest('Error: config spec not found for this account');
    }
    let engineConfig;
    try {
        engineConfig = await (0, engineConfig_1.updateEngineConfig)(Number(engineId), String(engineConfigId), account.idAccount, {
            rules,
            envVars
        }, configSpec);
    }
    catch (e) {
        throw boom_1.default.badRequest(e.message);
    }
    return res.status(201).send(engineConfig);
};
exports.update = update;
//# sourceMappingURL=engineConfigs.js.map