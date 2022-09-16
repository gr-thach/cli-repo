"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatRepositories = exports.formatRepository = exports.gql = exports.parseStringParams = exports.parseNumberParams = exports.wrapper = exports.coreAxios = void 0;
const axios_1 = __importDefault(require("axios"));
const get_1 = __importDefault(require("lodash/get"));
const config_1 = require("../../../config");
exports.coreAxios = axios_1.default.create({
    baseURL: `${config_1.env.CORE_API_URI}`,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
});
const wrapper = (fn) => async (...args) => {
    // This is a hacky solution to fix an issue in Axios where Axios throws away the existing
    // stacktrace and creates a new one. So in order to capture some of the orginal stacktrace
    // we create a new error here and use that stack when throwing the error later.
    // See here for more info https://github.com/axios/axios/issues/2387.
    const error = new Error();
    try {
        return await fn(...args);
    }
    catch (e) {
        const err = e;
        if (err.isAxiosError) {
            err.stack = error.stack;
            if ((0, get_1.default)(e, 'response.data.validation')) {
                err.isCoreApiError = true;
            }
            else if ((0, get_1.default)(e, 'response.data.errors')) {
                err.isCoreApiGQLError = true;
            }
            throw e;
        }
        else {
            throw e;
        }
    }
};
exports.wrapper = wrapper;
const parseNumberParams = (param, separator = ',') => param.split(separator).map(Number);
exports.parseNumberParams = parseNumberParams;
const parseStringParams = (param, separator = ',') => param.split(separator).map(String);
exports.parseStringParams = parseStringParams;
const gql = (literals, ...substitutions) => {
    let result = '';
    for (let i = 0; i < substitutions.length; i += 1) {
        result += literals[i];
        result += substitutions[i];
    }
    result += literals[literals.length - 1];
    return result;
};
exports.gql = gql;
const formatRepository = (repository) => {
    if (typeof repository === 'object' &&
        !Array.isArray(repository) &&
        repository !== null &&
        repository.idRepository) {
        const { idMonorepoConfig, provider, ...rest } = repository;
        return {
            ...rest,
            provider: provider.toUpperCase(),
            isMonorepo: !!idMonorepoConfig
        };
    }
    return undefined;
};
exports.formatRepository = formatRepository;
const formatRepositories = (repositories) => repositories.map(exports.formatRepository).filter(r => r !== undefined);
exports.formatRepositories = formatRepositories;
//# sourceMappingURL=index.js.map