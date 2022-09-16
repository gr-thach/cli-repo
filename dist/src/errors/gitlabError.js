"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GitlabError extends Error {
    functionName;
    status;
    method;
    url;
    constructor(message, functionName, status, method, url) {
        super(message);
        this.name = 'GitlabError';
        this.functionName = functionName;
        this.status = status;
        this.method = method;
        this.url = url;
    }
}
exports.default = GitlabError;
//# sourceMappingURL=gitlabError.js.map