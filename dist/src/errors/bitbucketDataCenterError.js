"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BitbucketDataCenterError extends Error {
    functionName;
    status;
    method;
    url;
    constructor(message, functionName, status, method, url) {
        super(message);
        this.name = 'BitbucketDataCenterError';
        this.functionName = functionName;
        this.status = status;
        this.method = method;
        this.url = url;
    }
}
exports.default = BitbucketDataCenterError;
//# sourceMappingURL=bitbucketDataCenterError.js.map