"use strict";
const boom = require('@hapi/boom');
const { env } = require('../../../../config');
const useGithubOAuth = env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET && env.GITHUB_OAUTH_REDIRECT_URL;
const useGitlabOAuth = env.GITLAB_OAUTH_CLIENT_ID && env.GITLAB_OAUTH_CLIENT_SECRET && env.GITLAB_OAUTH_REDIRECT_URL;
const useBitbucketOAuth = env.BITBUCKET_OAUTH_CLIENT_ID &&
    env.BITBUCKET_OAUTH_CLIENT_SECRET &&
    env.BITBUCKET_OAUTH_REDIRECT_URL;
const useBitbucketDataCenterOAuth = env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY && env.BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET;
const validateGitProvider = gitProvider => {
    const validGitProviders = ['github', 'gitlab', 'bitbucket', 'bitbucket_data_center'];
    if (!validGitProviders.includes(gitProvider)) {
        throw boom.badRequest(`Invalid git provider '${gitProvider}'.`);
    }
    if (gitProvider === 'github' && !useGithubOAuth) {
        throw boom.badRequest('Github is not enabled.');
    }
    if (gitProvider === 'gitlab' && !useGitlabOAuth) {
        throw boom.badRequest('Gitlab is not enabled.');
    }
    if (gitProvider === 'bitbucket' && !useBitbucketOAuth) {
        throw boom.badRequest('Bitbucket is not enabled.');
    }
    if (gitProvider === 'bitbucket_data_center' && !useBitbucketDataCenterOAuth) {
        throw boom.badRequest('Bitbucket data center is not enabled.');
    }
};
const validateSamlOptions = samlOptions => {
    if (!samlOptions) {
        throw new Error('Saml options are not defined.');
    }
    if (!samlOptions.path) {
        throw new Error('Saml path is not defined.');
    }
    if (!samlOptions.issuer) {
        throw new Error('Saml issuer is not defined.');
    }
    if (!samlOptions.audience) {
        throw new Error('Saml audience is not defined.');
    }
    if (!samlOptions.cert) {
        throw boom.badRequest('No certificate has been configured.');
    }
    if (!samlOptions.entryPoint) {
        throw boom.badRequest('No Identity provider single sign on URL has been configured.');
    }
};
module.exports = {
    validateGitProvider,
    validateSamlOptions
};
//# sourceMappingURL=validation.js.map