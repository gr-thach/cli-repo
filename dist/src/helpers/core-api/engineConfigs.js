"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCustomConfigSpec = exports.queryCustomConfigSpecs = exports.listEngineAccountConfig = exports.updateEngineAccountConfig = exports.createEngineAccountConfig = exports.getEngineAccountConfig = void 0;
const get_1 = __importDefault(require("lodash/get"));
const uuid_1 = require("uuid");
const index_1 = require("./index");
const fragments_1 = require("./fragments");
exports.getEngineAccountConfig = (0, index_1.wrapper)(async (idEngineConfig, accountId) => {
    const query = (0, index_1.gql) `
    query($idEngineConfig: UUID!, $accountId: Int!) {
      engineAccountConfigs(
        condition: { idEngineAccountConfig: $idEngineConfig, fkAccount: $accountId }
        first: 1
      ) {
        nodes {
          ...EngineAccountConfigFragment
        }
      }
    }
    ${fragments_1.engineAccountConfigFragment}
  `;
    const variables = { idEngineConfig, accountId };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.engineAccountConfigs.nodes[0]');
});
exports.createEngineAccountConfig = (0, index_1.wrapper)(async (engineId, fkEngineConfigSpec, accountId, { rules, envVars }) => {
    const query = (0, index_1.gql) `
      mutation createEngineAccountConfig($input: CreateEngineAccountConfigInput!) {
        createEngineAccountConfig(input: $input) {
          engineAccountConfig {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${fragments_1.engineAccountConfigFragment}
    `;
    const variables = {
        input: {
            engineAccountConfig: {
                idEngineAccountConfig: (0, uuid_1.v4)(),
                rules,
                envVars,
                fkAccount: accountId,
                fkEngine: engineId,
                fkEngineConfigSpec,
                createdAt: new Date().toJSON(),
                updatedAt: new Date().toJSON()
            }
        }
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.createEngineAccountConfig.engineAccountConfig');
});
exports.updateEngineAccountConfig = (0, index_1.wrapper)(async (idEngineConfig, patch) => {
    if (!patch) {
        throw new Error(`Patch was null or undefined when updating engine account config '${idEngineConfig}'.`);
    }
    const query = (0, index_1.gql) `
      mutation updateEngineAccountConfig($input: UpdateEngineAccountConfigInput!) {
        updateEngineAccountConfig(input: $input) {
          engineAccountConfig {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${fragments_1.engineAccountConfigFragment}
    `;
    const variables = {
        input: {
            idEngineAccountConfig: idEngineConfig,
            patch: {
                ...patch,
                updatedAt: new Date().toJSON()
            }
        }
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.updateEngineAccountConfig.engineAccountConfig');
});
exports.listEngineAccountConfig = (0, index_1.wrapper)(async (accountId) => {
    const query = (0, index_1.gql) `
      query($accountId: Int!) {
        engineAccountConfigs(condition: { fkAccount: $accountId }) {
          nodes {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${fragments_1.engineAccountConfigFragment}
    `;
    const variables = {
        accountId
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.engineAccountConfigs.nodes');
});
exports.queryCustomConfigSpecs = (0, index_1.wrapper)(async (accountId) => {
    const query = (0, index_1.gql) `
      query($filter: EngineConfigSpecFilter!) {
        engineConfigSpecs(filter: $filter) {
          nodes {
            specId: idEngineConfigSpec
            format: validator
            validation
            filename
            engine: engineByFkEngine {
              idEngine
              name
              language
            }
          }
        }
      }
    `;
    const variables = {
        filter: {
            // we look for all specs from default engines and custom engines that this account has access to
            engineByFkEngine: {
                or: [{ fkAccount: { equalTo: accountId } }, { fkAccount: { isNull: true } }]
            }
        }
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.engineConfigSpecs.nodes');
});
exports.fetchCustomConfigSpec = (0, index_1.wrapper)(async (idEngineConfigSpec) => {
    const query = (0, index_1.gql) `
      query($id: UUID!) {
        engineConfigSpecs(condition: { idEngineConfigSpec: $id, deletedAt: null }) {
          nodes {
            specId: idEngineConfigSpec
            format: validator
            validation
            filename
            engine: engineByFkEngine {
              idEngine
              name
              language
            }
          }
        }
      }
    `;
    const variables = { id: idEngineConfigSpec };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.engineConfigSpecs.nodes[0]');
});
//# sourceMappingURL=engineConfigs.js.map