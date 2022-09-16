"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUIDParams = exports.toArray = exports.parseListParams = exports.parseListParam = exports.parseOrderByToGraphQL = exports.getContextFromAxiosError = exports.base64Decode = exports.aesDecrypt = exports.aesEncrypt = exports.isValidEmail = exports.getDomain = exports.corsOrigin = exports.linkToScan = exports.linkToCode = exports.constructAccountPIDUrl = exports.shortGitProvider = exports.getAccountIdentifierValue = exports.EMAIL_REGEXP = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const get_1 = __importDefault(require("lodash/get"));
const snakeCase_1 = __importDefault(require("lodash/snakeCase"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const config_1 = require("../../config");
const interfaces_1 = require("../interfaces");
exports.EMAIL_REGEXP = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const getAccountIdentifier = (provider) => {
    switch (provider.toUpperCase()) {
        case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
            return 'providerMetadata.projectKey';
        default:
            return 'login';
    }
};
const getAccountIdentifierValue = (account) => {
    return (0, get_1.default)(account, getAccountIdentifier(account.provider), account.login);
};
exports.getAccountIdentifierValue = getAccountIdentifierValue;
const shortGitProvider = (provider) => {
    switch (provider.toUpperCase()) {
        case interfaces_1.GitProvider.GITHUB:
            return 'gh';
        case interfaces_1.GitProvider.GITLAB:
            return 'gl';
        case interfaces_1.GitProvider.BITBUCKET:
            return 'bb';
        case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
            return 'bbdc';
        default:
            throw Error('invalid provider');
    }
};
exports.shortGitProvider = shortGitProvider;
const constructAccountPIDUrl = (account) => {
    const accountIdentifier = (0, exports.getAccountIdentifierValue)(account);
    return `${(0, exports.shortGitProvider)(account.provider)}/${accountIdentifier}`;
};
exports.constructAccountPIDUrl = constructAccountPIDUrl;
const linkToCode = (account, repositoryName, codePath, codeLineNumber, sha) => {
    const { provider } = account;
    const accountIdentifier = (0, exports.getAccountIdentifierValue)(account);
    switch (provider.toUpperCase()) {
        case interfaces_1.GitProvider.GITHUB:
            return `${config_1.env.GITHUB_URL}/${decodeURIComponent(accountIdentifier)}/${repositoryName}/blob/${sha}/${codePath}${codeLineNumber ? `#L${codeLineNumber}` : ''}`;
        case interfaces_1.GitProvider.GITLAB:
            return `${config_1.env.GITLAB_URL}/${decodeURIComponent(accountIdentifier)}/${repositoryName}/blob/${sha}/${codePath}${codeLineNumber ? `#L${codeLineNumber}` : ''}`;
        case interfaces_1.GitProvider.BITBUCKET:
            return `${config_1.env.BITBUCKET_SITE_URL}/${decodeURIComponent(accountIdentifier)}/${repositoryName}/src/${sha}/${codePath}${codeLineNumber ? `#lines-${codeLineNumber}` : ''}`;
        case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
            return `${config_1.env.BITBUCKET_DATA_CENTER_SITE_URL}/projects/${decodeURIComponent(accountIdentifier)}/repos/${repositoryName}/browse/${codePath}?at=${sha}${codeLineNumber ? `#${codeLineNumber}` : ''}`;
        default:
            throw Error(`Invalid git provider '${provider}'`);
    }
};
exports.linkToCode = linkToCode;
const linkToScan = (account, idRepository, sha) => {
    const pid = (0, exports.constructAccountPIDUrl)(account);
    return `${config_1.constants.dashboardBaseUrl}/${pid}/repos/${idRepository}/scans?sha=${sha}`;
};
exports.linkToScan = linkToScan;
// returns the domain and port
const corsOrigin = () => {
    if (config_1.env.DISABLE_CORS)
        return false;
    return [config_1.constants.dashboardBaseUrl];
};
exports.corsOrigin = corsOrigin;
// returns the domain only
const getDomain = () => {
    // we use the api external url to obtain the domain where the cookie can be set to
    if (config_1.env.API_EXTERNAL_URL.includes('://')) {
        return config_1.env.API_EXTERNAL_URL.split(':')[1].replace('//', '');
    }
    throw new Error('Invalid API_EXTERNAL_URL, it must be a valid url including protocol, i.e.: https://api.example.com');
};
exports.getDomain = getDomain;
const isValidEmail = (email) => {
    return exports.EMAIL_REGEXP.test(email);
};
exports.isValidEmail = isValidEmail;
const algorithm = 'aes-256-cbc';
const aesEncrypt = (text, secret) => {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, secret, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}|${encrypted.toString('hex')}`;
};
exports.aesEncrypt = aesEncrypt;
const aesDecrypt = (text, secret) => {
    const [iv, encryptedData] = text.split('|');
    const ivBuffer = Buffer.from(iv, 'hex');
    const encryptedText = Buffer.from(encryptedData, 'hex');
    const decipher = crypto_1.default.createDecipheriv(algorithm, secret, ivBuffer);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
exports.aesDecrypt = aesDecrypt;
const base64Decode = (data) => {
    return Buffer.from(data, 'base64').toString('ascii');
};
exports.base64Decode = base64Decode;
const jsonStringifyIfNotString = (data) => {
    if (typeof data === 'string' || data === null || data === undefined) {
        return data;
    }
    return JSON.stringify(data, null, 2);
};
const truncateString = (str, maxLength) => {
    if (str && typeof str === 'string' && str.length > maxLength) {
        return `${str.substring(0, maxLength)}...`;
    }
    return str;
};
const getContextFromAxiosError = (axiosError) => {
    const context = {};
    const { config, response } = axiosError;
    if (config) {
        let body = jsonStringifyIfNotString(config.data);
        body = truncateString(body, 3000);
        context.request = {
            baseURL: config.baseURL,
            url: config.url,
            method: config.method,
            body
        };
    }
    if (response) {
        const { status, data } = response;
        let body = jsonStringifyIfNotString(data);
        body = truncateString(body, 3000);
        context.response = {
            status,
            body
        };
    }
    return context;
};
exports.getContextFromAxiosError = getContextFromAxiosError;
const parseOrderByToGraphQL = (orderByParam) => {
    if (!orderByParam) {
        return undefined;
    }
    const [columnRaw, orderRaw] = orderByParam.split(',');
    const column = columnRaw.trim();
    const order = orderRaw.trim().toUpperCase();
    if (!['ASC', 'DESC'].includes(order)) {
        throw boom_1.default.badRequest('Invalid orderBy. Direction must be ASC or DESC');
    }
    return `${(0, snakeCase_1.default)(column).toUpperCase()}_${order}`;
};
exports.parseOrderByToGraphQL = parseOrderByToGraphQL;
const parseListParam = (param) => {
    return param ? param.split(',') : undefined;
};
exports.parseListParam = parseListParam;
const parseListParams = (params) => {
    const parsed = {};
    Object.keys(params).forEach(key => {
        parsed[key] = (0, exports.parseListParam)(params[key]);
    });
    return parsed;
};
exports.parseListParams = parseListParams;
const toArray = (arrOrElem) => {
    if (arrOrElem === undefined) {
        return [];
    }
    return Array.isArray(arrOrElem) ? arrOrElem : [arrOrElem];
};
exports.toArray = toArray;
const validateUUIDParams = (fieldsKeyValuePairs = {}) => {
    const invalidFields = [];
    Object.keys(fieldsKeyValuePairs).forEach(key => {
        if (!fieldsKeyValuePairs[key] || !(0, uuid_1.validate)(fieldsKeyValuePairs[key])) {
            invalidFields.push(key);
        }
    });
    if (invalidFields.length) {
        throw boom_1.default.badRequest(`The parameters [${invalidFields.join(', ')}] should be a valid UUID`);
    }
};
exports.validateUUIDParams = validateUUIDParams;
//# sourceMappingURL=common.js.map