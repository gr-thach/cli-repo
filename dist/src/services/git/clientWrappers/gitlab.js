"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("@gitbeaker/node");
const config_1 = require("../../../../config");
class GitLabClientWrapper {
    client;
    gitLabApiOwnUserClient;
    constructor(userAccessToken) {
        this.client = new node_1.Gitlab({
            oauthToken: userAccessToken,
            host: config_1.env.GITLAB_URL
        });
    }
    asUser() {
        return this.client;
    }
    async asInstallation() {
        if (!this.gitLabApiOwnUserClient) {
            // We need to create another instance to try to get the "Own user" id (used for on-premise)
            this.gitLabApiOwnUserClient = new node_1.Gitlab({
                token: config_1.env.GUARDRAILS_GITLAB_OWN_USER_TOKEN,
                host: config_1.env.GITLAB_URL
            });
        }
        return this.gitLabApiOwnUserClient;
    }
    async installationFallback(fn) {
        let result;
        try {
            result = await fn(this.asUser());
        }
        catch (e) {
            // We only do the fallback on 404 errors
            if (e.response && e.response.statusCode !== 404) {
                throw e;
            }
            const client = await this.asInstallation();
            result = await fn(client);
        }
        return result;
    }
}
exports.default = GitLabClientWrapper;
//# sourceMappingURL=gitlab.js.map