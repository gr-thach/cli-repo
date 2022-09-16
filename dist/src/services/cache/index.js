"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("./redis"));
const default_1 = __importDefault(require("./default"));
class Cache {
    provider;
    static instances;
    constructor(provider) {
        this.provider = provider;
        if (!Cache.instances) {
            Cache.instances = {};
        }
        if (!Cache.instances[provider]) {
            switch (provider) {
                case 'redis':
                    Cache.instances[provider] = new redis_1.default();
                    break;
                default:
                    Cache.instances[provider] = new default_1.default(); // fallback
            }
        }
    }
    getInstance() {
        return Cache.instances[this.provider];
    }
}
exports.default = Cache;
//# sourceMappingURL=index.js.map