"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEngineConfig = exports.createEngineConfig = exports.listEngineConfig = void 0;
const engineConfigs_1 = require("./core-api/engineConfigs");
const customEngineRule_1 = require("./customEngineRule");
const listEngineConfig = async (accountId) => {
    const engineSpecList = await (0, engineConfigs_1.queryCustomConfigSpecs)(accountId);
    const customConfigs = await (0, engineConfigs_1.listEngineAccountConfig)(accountId);
    return engineSpecList.reduce((list, spec) => {
        const config = customConfigs.find(c => c.specId === spec.specId);
        if (config) {
            list.push({ ...config, format: spec.format });
        }
        else {
            list.push(spec);
        }
        return list;
    }, []);
};
exports.listEngineConfig = listEngineConfig;
const createEngineConfig = async (engineId, accountId, { rules, envVars }, configSpec) => {
    const customConfig = await (0, engineConfigs_1.createEngineAccountConfig)(engineId, configSpec.specId, accountId, {
        rules,
        envVars
    });
    if (rules) {
        await (0, customEngineRule_1.persistEngineRules)(rules, accountId, engineId, configSpec.validation);
    }
    return customConfig;
};
exports.createEngineConfig = createEngineConfig;
const updateEngineConfig = async (engineId, engineConfigId, accountId, { rules, envVars }, configSpec) => {
    const customConfig = await (0, engineConfigs_1.updateEngineAccountConfig)(engineConfigId, { rules, envVars });
    await (0, customEngineRule_1.persistEngineRules)(rules, accountId, engineId, configSpec.validation);
    return customConfig;
};
exports.updateEngineConfig = updateEngineConfig;
//# sourceMappingURL=engineConfig.js.map