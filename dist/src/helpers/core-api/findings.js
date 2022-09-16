"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFindingsByIds = exports.getFindingById = exports.bulkUpdateFindings = exports.updateFinding = exports.queryFindingScans = exports.queryFindingsFilters = exports.getFindingsCount = exports.queryGroupedFindings = exports.queryFindingIds = exports.queryFindings = void 0;
const get_1 = __importDefault(require("lodash/get"));
const index_1 = require("./index");
const fragments_1 = require("./fragments");
const config_1 = require("../../../config");
exports.queryFindings = (0, index_1.wrapper)(async ({ repositoryIds, branchName, isParanoid, scanId, ruleId, filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
limit, offset }) => {
    if (config_1.env.USE_NEW_QUERY_FINDINGS) {
        const { data } = await index_1.coreAxios.post('/v2/findings/getFindings', {
            ...filters,
            ruleId,
            repositoryIds,
            branchName,
            isParanoid,
            scanId,
            limit,
            offset
        });
        return data;
    }
    const { data } = await index_1.coreAxios.post('/findings', {
        ...filters,
        ruleId,
        repositoryIds,
        branchName,
        isParanoid,
        scanId,
        limit,
        offset
    });
    return data;
});
exports.queryFindingIds = (0, index_1.wrapper)(async ({ repositoryIds, branchName, isParanoid, scanId, ruleId, filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
limit, offset }) => {
    const { data } = await index_1.coreAxios.post(`/findings/ids`, {
        ...filters,
        ruleId,
        repositoryIds,
        branchName,
        isParanoid,
        scanId,
        limit,
        offset
    });
    return data;
});
exports.queryGroupedFindings = (0, index_1.wrapper)(async ({ repositoryIds, branchName, scanId, isParanoid, filters // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
 }) => {
    if (config_1.env.USE_NEW_QUERY_FINDINGS) {
        const { data } = await index_1.coreAxios.post('/v2/findings/getFindingsGroupByRules', {
            ...filters,
            repositoryIds,
            branchName,
            scanId,
            isParanoid
        });
        return data;
    }
    const { data } = await index_1.coreAxios.post('/findings/groupByRules', {
        ...filters,
        repositoryIds,
        branchName,
        scanId,
        isParanoid
    });
    return data;
});
exports.getFindingsCount = (0, index_1.wrapper)(async (repositoryId, branchName) => {
    const { data } = await index_1.coreAxios.post('/findings/count', {
        repositoryId,
        branchName
    });
    return data;
});
exports.queryFindingsFilters = (0, index_1.wrapper)(async ({ repositoryIds, branchName, scanId, filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
isParanoid }) => {
    const { data } = await index_1.coreAxios.post('/findings/filters', {
        ...filters,
        repositoryIds,
        branchName,
        scanId,
        isParanoid
    });
    return data;
});
exports.queryFindingScans = (0, index_1.wrapper)(async ({ idFinding, offset, limit }) => {
    // Get all scans that the finding can be found in.
    const { data } = await index_1.coreAxios.get(`/findings/${idFinding}/scans`, {
        params: {
            offset,
            limit
        }
    });
    return data;
});
exports.updateFinding = (0, index_1.wrapper)(async (idFinding, patch) => {
    const query = (0, index_1.gql) `
      mutation updateFinding($input: UpdateFindingInput!) {
        updateFinding(input: $input) {
          finding {
            ...FindingFragment
            engineRule: engineRuleByFkEngineRule {
              idEngineRule
              name
            }
          }
        }
      }
      ${fragments_1.findingFragment}
    `;
    const variables = {
        input: {
            idFinding,
            patch: {
                ...patch,
                updatedAt: new Date().toJSON()
            }
        }
    };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.updateFinding.finding');
});
const bulkUpdateFindings = async (findingIds, patch) => {
    const { data } = await index_1.coreAxios.patch('/findings/bulk', {
        findingIds,
        patch
    });
    return data;
};
exports.bulkUpdateFindings = bulkUpdateFindings;
exports.getFindingById = (0, index_1.wrapper)(async (idFinding) => {
    const query = (0, index_1.gql) `
      query($idFinding: UUID!) {
        finding(idFinding: $idFinding) {
          ...FindingFragment
          engineRule: engineRuleByFkEngineRule {
            idEngineRule
            name
            engine: engineByFkEngine {
              language
            }
          }
          customEngineRule: customEngineRuleByFkCustomEngineRule {
            idCustomEngineRule
            name
            engine: engineByFkEngine {
              language
            }
          }
        }
      }
      ${fragments_1.findingFragment}
    `;
    const variables = { idFinding };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.finding');
});
exports.getFindingsByIds = (0, index_1.wrapper)(async (findingIds) => {
    const query = (0, index_1.gql) `
      query($findingIds: [UUID!]) {
        findings(filter: { idFinding: { in: $findingIds } }) {
          nodes {
            ...FindingFragment
          }
        }
      }
      ${fragments_1.findingFragment}
    `;
    const variables = { findingIds };
    const { data } = await index_1.coreAxios.post('/graphql', { query, variables });
    return (0, get_1.default)(data, 'data.findings.nodes', []);
});
//# sourceMappingURL=findings.js.map