"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GithubError extends Error {
    functionName;
    status;
    method;
    url;
    documentationUrl;
    constructor(message, functionName, status, method, url, documentationUrl) {
        super(message);
        this.name = 'GithubError';
        this.functionName = functionName;
        this.status = status;
        this.method = method;
        this.url = url;
        this.documentationUrl = documentationUrl;
    }
}
exports.default = GithubError;
//# sourceMappingURL=githubError.js.map