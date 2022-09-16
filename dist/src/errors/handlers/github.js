"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubDefaultErrorHandler = void 0;
const githubError_1 = __importDefault(require("../githubError"));
const githubDefaultErrorHandler = (err, functionName) => {
    throw new githubError_1.default(err.message, functionName, err.status, err.request?.method, err.request?.url, err.documentation_url);
};
exports.githubDefaultErrorHandler = githubDefaultErrorHandler;
//# sourceMappingURL=github.js.map