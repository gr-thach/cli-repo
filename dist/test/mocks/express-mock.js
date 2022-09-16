"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEndpoint = void 0;
const getEndpoint = (app, method, path) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [urlPath, callback] of app[method].mock.calls) {
        if (path === urlPath) {
            return callback;
        }
    }
    throw new Error(`No endpoint found with path '${path}'.`);
};
exports.getEndpoint = getEndpoint;
//# sourceMappingURL=express-mock.js.map