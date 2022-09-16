"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bitbucketGetUserRoleErrorHandler = exports.bitbucketDefaultErrorHandler = void 0;
const interfaces_1 = require("../../interfaces");
const bitbucketError_1 = __importDefault(require("../bitbucketError"));
const bitbucketDefaultErrorHandler = (err, functionName) => {
    throw new bitbucketError_1.default(err.error?.error?.message || err.message, functionName, err.status, err.request?.method, err.request?.url);
};
exports.bitbucketDefaultErrorHandler = bitbucketDefaultErrorHandler;
const bitbucketGetUserRoleErrorHandler = (err) => {
    // eslint-disable-next-line no-console
    console.error(`BitbucketDataCenterError when trying to retrieve the user's role: ${err.message}`, { error: err });
    return interfaces_1.UserRoleName.DEVELOPER;
};
exports.bitbucketGetUserRoleErrorHandler = bitbucketGetUserRoleErrorHandler;
//# sourceMappingURL=bitbucket.js.map