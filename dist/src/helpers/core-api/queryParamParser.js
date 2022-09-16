"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStringParams = exports.parseNumberParams = void 0;
const parseNumberParams = (param, separator = ',') => param.split(separator).map(Number);
exports.parseNumberParams = parseNumberParams;
const parseStringParams = (param, separator = ',') => param.split(separator).map(String);
exports.parseStringParams = parseStringParams;
//# sourceMappingURL=queryParamParser.js.map