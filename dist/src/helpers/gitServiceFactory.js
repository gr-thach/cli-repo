"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitServiceFactoryWithAccessToken = exports.gitServiceFactory = void 0;
const interfaces_1 = require("../interfaces");
const github_1 = __importDefault(require("../services/git/github"));
const gitlab_1 = __importDefault(require("../services/git/gitlab"));
const bitbucket_1 = __importDefault(require("../services/git/bitbucket"));
const bitbucketDataCenter_1 = __importDefault(require("../services/git/bitbucketDataCenter"));
const gitServiceFactory = (user, provider) => {
    if (provider.toUpperCase() === interfaces_1.GitProvider.GITHUB) {
        return new github_1.default(user.githubAccessToken, user.githubNickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.GITLAB) {
        return new gitlab_1.default(user.gitlabAccessToken, user.gitlabNickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.BITBUCKET) {
        return new bitbucket_1.default(user.bitbucketAccessToken, user.bitbucketNickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
        return new bitbucketDataCenter_1.default(user.bitbucketDataCenterAccessToken, user.bitbucketDataCenterNickname, user.bitbucketDataCenterAccessTokenSecret);
    }
    throw Error(`Invalid provider [${provider}]`);
};
exports.gitServiceFactory = gitServiceFactory;
const gitServiceFactoryWithAccessToken = (provider, accessToken, nickname, accessTokenSecret = null) => {
    if (provider.toUpperCase() === interfaces_1.GitProvider.GITHUB) {
        return new github_1.default(accessToken, nickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.GITLAB) {
        return new gitlab_1.default(accessToken, nickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.BITBUCKET) {
        return new bitbucket_1.default(accessToken, nickname);
    }
    if (provider.toUpperCase() === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
        return new bitbucketDataCenter_1.default(accessToken, nickname, accessTokenSecret || '');
    }
    throw Error(`Invalid provider [${provider}]`);
};
exports.gitServiceFactoryWithAccessToken = gitServiceFactoryWithAccessToken;
//# sourceMappingURL=gitServiceFactory.js.map