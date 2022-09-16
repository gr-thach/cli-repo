"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BitbucketError extends Error {
    functionName;
    status;
    method;
    url;
    constructor(message, functionName, status, method, url) {
        super(message);
        this.name = 'BitbucketError';
        this.functionName = functionName;
        this.status = status;
        this.method = method;
        this.url = url;
    }
}
exports.default = BitbucketError;
//# sourceMappingURL=bitbucketError.js.map