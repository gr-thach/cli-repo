"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const default_1 = __importDefault(require("./default"));
const config_1 = require("../../../config");
class RedisCache extends default_1.default {
    client;
    constructor() {
        super();
        if (config_1.env.IPV6) {
            this.client = new ioredis_1.default({ family: 6, host: 'redis' });
        }
        else {
            this.client = new ioredis_1.default(config_1.env.REDIS_URL);
        }
    }
    async get(key) {
        const result = await this.client.get(key);
        return result;
    }
    async set(key, value, expire) {
        await this.client.set(key, value);
        if (Number.isInteger(expire)) {
            await this.client.expire(key, expire);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
}
exports.default = RedisCache;
//# sourceMappingURL=redis.js.map