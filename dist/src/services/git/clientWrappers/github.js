"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = __importDefault(require("@octokit/rest"));
const app_1 = require("@octokit/app");
const config_1 = require("../../../../config");
class GitHubClientWrapper {
    userOptions;
    applicationOptions;
    installationOptions;
    client;
    constructor(userAccessToken) {
        this.userOptions = {
            headers: {
                authorization: `token ${userAccessToken}`,
                accept: 'application/vnd.github.machine-man-preview+json'
            }
        };
        this.client = new rest_1.default({ baseUrl: config_1.env.GITHUB_API_URL });
    }
    initApplicationOptions() {
        if (this.applicationOptions) {
            return;
        }
        const githubJWT = new app_1.App({
            id: config_1.env.GITHUB_APP_ISSUER_ID,
            privateKey: Buffer.from(config_1.env.GITHUB_APP_PRIVATE_KEY_BASE64, 'base64').toString(),
            baseUrl: `${config_1.env.GITHUB_API_URL}`
        }).getSignedJsonWebToken();
        this.applicationOptions = {
            headers: {
                authorization: `Bearer ${githubJWT}`,
                accept: 'application/vnd.github.machine-man-preview+json'
            }
        };
    }
    async initInstallationOptions(installationId) {
        if (this.installationOptions) {
            return;
        }
        this.initApplicationOptions();
        const { data: { token } } = await this.client.apps.createInstallationToken({
            ...this.applicationOptions,
            installation_id: installationId
        });
        this.installationOptions = {
            headers: {
                authorization: `token ${token}`,
                accept: 'application/vnd.github.machine-man-preview+json'
            }
        };
    }
    asUser() {
        return {
            client: this.client,
            options: this.userOptions
        };
    }
    asApplication() {
        this.initApplicationOptions();
        return {
            client: this.client,
            options: this.applicationOptions
        };
    }
    async asInstallation(installationId) {
        await this.initInstallationOptions(installationId);
        return {
            client: this.client,
            options: this.installationOptions
        };
    }
    async installationFallback(installationId, fn) {
        let result;
        try {
            const { client, options } = this.asUser();
            result = await fn(client, options);
        }
        catch (e) {
            // We only do the fallback on 404 errors
            if (e.status !== 404) {
                throw e;
            }
            const { client, options } = await this.asInstallation(installationId);
            result = await fn(client, options);
        }
        return result;
    }
}
exports.default = GitHubClientWrapper;
//# sourceMappingURL=github.js.map