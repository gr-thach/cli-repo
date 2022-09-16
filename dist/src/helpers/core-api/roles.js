"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllTeamRoles = exports.findAllRoles = void 0;
const get_1 = __importDefault(require("lodash/get"));
const index_1 = require("./index");
exports.findAllRoles = (0, index_1.wrapper)(async () => {
    const query = (0, index_1.gql) `
      query {
        roles(orderBy: ID_ROLE_ASC, condition: { deletedAt: null }) {
          nodes {
            idRole
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `;
    const { data } = await index_1.coreAxios.post('/graphql', { query });
    return (0, get_1.default)(data, 'data.roles.nodes');
});
exports.findAllTeamRoles = (0, index_1.wrapper)(async () => {
    const query = (0, index_1.gql) `
      query {
        teamRoles(orderBy: ID_TEAM_ROLE_ASC, condition: { deletedAt: null }) {
          nodes {
            idTeamRole
            name
            description
            createdAt
            updatedAt
          }
        }
      }
    `;
    const { data } = await index_1.coreAxios.post('/graphql', { query });
    return (0, get_1.default)(data, 'data.teamRoles.nodes');
});
//# sourceMappingURL=roles.js.map