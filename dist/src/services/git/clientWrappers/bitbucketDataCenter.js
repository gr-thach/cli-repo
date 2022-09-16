"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../../../config");
const bitbucketDataCenterClient_1 = __importDefault(require("../../../clients/bitbucketDataCenterClient"));
const common_1 = require("../../../helpers/common");
class BitbucketDataCenterClientWrapper {
    client;
    patClient;
    constructor(userAccessToken, userAccessTokenSecret) {
        this.client = new bitbucketDataCenterClient_1.default(config_1.env.BITBUCKET_DATA_CENTER_API_URL, {
            type: 'oauth',
            consumerKey: config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY,
            consumerSecret: (0, common_1.base64Decode)(config_1.env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET),
            accessToken: userAccessToken,
            accessTokenSecret: userAccessTokenSecret
        });
    }
    asUser() {
        return this.client;
    }
    asInstallation() {
        if (!this.patClient) {
            this.patClient = new bitbucketDataCenterClient_1.default(config_1.env.BITBUCKET_DATA_CENTER_API_URL, {
                type: 'pat',
                pat: config_1.env.BITBUCKET_DATA_CENTER_OWN_USER_TOKEN
            });
        }
        return this.patClient;
    }
    async installationFallback(fn) {
        let result;
        try {
            result = await fn(this.asUser());
        }
        catch (e) {
            // We only do the fallback on 403 errors
            if (e.status !== 403) {
                throw e;
            }
            const client = await this.asInstallation();
            result = await fn(client);
        }
        return result;
    }
}
exports.default = BitbucketDataCenterClientWrapper;
//# sourceMappingURL=bitbucketDataCenter.js.map