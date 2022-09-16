"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitbucketDataCenterGetUserRoleErrorHandler = exports.bitbucketDataCenterGetDefaultBranchRoleErrorHandler = exports.bitbucketDataCenterDefaultErrorHandler = void 0;
const interfaces_1 = require("../../interfaces");
const bitbucketDataCenterError_1 = __importDefault(require("../bitbucketDataCenterError"));
const bitbucketDataCenterDefaultErrorHandler = (err, functionName) => {
    throw new bitbucketDataCenterError_1.default(err.description || err.message, functionName, err.response?.status, err.config?.method, err.config?.url);
};
exports.bitbucketDataCenterDefaultErrorHandler = bitbucketDataCenterDefaultErrorHandler;
const bitbucketDataCenterGetDefaultBranchRoleErrorHandler = (err) => {
    if (err.response && err.response.status === 404) {
        return undefined;
    }
    return (0, exports.bitbucketDataCenterDefaultErrorHandler)(err, 'getDefaultBranch');
};
exports.bitbucketDataCenterGetDefaultBranchRoleErrorHandler = bitbucketDataCenterGetDefaultBranchRoleErrorHandler;
const bitbucketDataCenterGetUserRoleErrorHandler = (err) => {
    if (err.response && err.response.status === 401) {
        // eslint-disable-next-line no-console
        console.error(`BitbucketDataCenterError when trying to retrieve the user's role: ${err.message}`);
        return interfaces_1.UserRoleName.DEVELOPER;
    }
    return (0, exports.bitbucketDataCenterDefaultErrorHandler)(err, 'getUserRole');
};
exports.bitbucketDataCenterGetUserRoleErrorHandler = bitbucketDataCenterGetUserRoleErrorHandler;
//# sourceMappingURL=bitbucketDataCenter.js.map