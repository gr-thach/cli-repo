"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_simple_1 = __importDefault(require("jwt-simple"));
const bitbucket_1 = require("bitbucket");
const config_1 = require("../../../../config");
class BitbucketClientWrapper {
    client;
    bitbucketAppClient;
    constructor(userAccessToken) {
        this.client = new bitbucket_1.Bitbucket({
            baseUrl: config_1.env.BITBUCKET_API_URL,
            auth: {
                token: userAccessToken
            }
        });
    }
    asUser() {
        return this.client;
    }
    asInstallation(accountProviderInternalId) {
        if (!this.bitbucketAppClient) {
            const appName = config_1.env.BITBUCKET_APP_NAME;
            const clientKey = `ari:cloud:bitbucket::app/${accountProviderInternalId}/${appName}`;
            const now = new Date();
            const payload = {
                iss: appName,
                sub: clientKey,
                iat: Math.floor(now.getTime() / 1000),
                exp: Math.floor(now.setHours(now.getHours() + 1) / 1000)
            };
            const token = jwt_simple_1.default.encode(payload, config_1.env.BITBUCKET_APP_SECRET);
            this.bitbucketAppClient = new bitbucket_1.Bitbucket({
                baseUrl: config_1.env.BITBUCKET_API_URL,
                headers: {
                    Authorization: `JWT ${token}`
                }
            });
        }
        return this.bitbucketAppClient;
    }
    async installationFallback(accountProviderInternalId, fn) {
        let result;
        try {
            result = await fn(this.asUser());
        }
        catch (e) {
            // We only do the fallback on 403 errors
            if (e.status !== 403) {
                throw e;
            }
            const client = this.asInstallation(accountProviderInternalId);
            result = await fn(client);
        }
        return result;
    }
}
exports.default = BitbucketClientWrapper;
//# sourceMappingURL=bitbucket.js.map