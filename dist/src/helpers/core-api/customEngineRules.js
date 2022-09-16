"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCustomEngineRules = exports.deleteEngineRules = exports.upsertEngineRules = void 0;
const get_1 = __importDefault(require("lodash/get"));
const { coreAxios, wrapper, gql } = require('./index');
exports.upsertEngineRules = wrapper(async (customEngineRules) => {
    const res = await coreAxios.post('/custom-engine-rules', { customEngineRules });
    return res;
});
exports.deleteEngineRules = wrapper(async (customEngineRules) => {
    const { data } = await coreAxios.delete('/custom-engine-rules', {
        data: { customEngineRules }
    });
    return data;
});
exports.findCustomEngineRules = wrapper(async (accountId, engineId) => {
    const query = gql `
    query($accountId: Int!, $engineId: Int!) {
      customEngineRules(condition: { fkAccount: $accountId, fkEngine: $engineId }) {
        nodes {
          idCustomEngineRule
          name
          rule: ruleByFkRule {
            name
          }
          docs
          enable
        }
      }
    }
  `;
    const variables = {
        accountId,
        engineId
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.customEngineRules.nodes', []).map(cer => ({
        ...cer,
        grId: cer.rule.name
    }));
});
//# sourceMappingURL=customEngineRules.js.map