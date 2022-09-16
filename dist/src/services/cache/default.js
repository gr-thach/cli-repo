"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */
class DefaultCache {
    async get(key) {
        console.log('Abstract method get of DefaultCache does nothing', key);
        return undefined;
    }
    async set(key, value, expire) {
        console.log('Abstract method set of DefaultCache does nothing', key, value, expire);
    }
    async del(key) {
        console.log('Abstract method del of DefaultCache does nothing', key);
    }
}
exports.default = DefaultCache;
//# sourceMappingURL=default.js.map