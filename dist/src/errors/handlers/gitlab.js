"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitlabGetUserRoleErrorHandler = exports.gitlabDefaultErrorHandler = void 0;
const interfaces_1 = require("../../interfaces");
const gitlabError_1 = __importDefault(require("../gitlabError"));
const gitlabDefaultErrorHandler = (err, functionName) => {
    throw new gitlabError_1.default(err.description || err.message, functionName, err.response?.statusCode, err.request?.options?.method, err.request?.requestUrl);
};
exports.gitlabDefaultErrorHandler = gitlabDefaultErrorHandler;
const gitlabGetUserRoleErrorHandler = (err) => {
    // A 404 can happen if a Gitlab user is not a member of a Gitlab group.
    // A user can have access to a repository inside a Gitlab group, but not being a member of that Gitlab group.
    // So if a user is not a member of a group, then we fall back to developer role.
    if (err.response && err.response.statusCode === 404) {
        if (err.description) {
            let errDescription = `GitLabError when trying to retrieve the user's role: ${err.description}`;
            if (err.request && err.request.options) {
                errDescription += ` over ${err.request.options.method} / ${err.request.requestUrl}`;
            }
            // eslint-disable-next-line no-console
            console.error(errDescription);
        }
        return interfaces_1.UserRoleName.DEVELOPER;
    }
    return (0, exports.gitlabDefaultErrorHandler)(err, 'getUserRole');
};
exports.gitlabGetUserRoleErrorHandler = gitlabGetUserRoleErrorHandler;
//# sourceMappingURL=gitlab.js.map