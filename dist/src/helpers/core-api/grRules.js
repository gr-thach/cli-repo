"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGrRules = void 0;
const get_1 = __importDefault(require("lodash/get"));
const index_1 = require("./index");
exports.listGrRules = (0, index_1.wrapper)(async () => {
    const query = (0, index_1.gql) `
    query {
      rules(orderBy: NAME_ASC) {
        nodes {
          idRule
          name
          title
          enable
        }
      }
    }
  `;
    const { data } = await index_1.coreAxios.post('/graphql', { query });
    return (0, get_1.default)(data, 'data.rules.nodes');
});
//# sourceMappingURL=grRules.js.map