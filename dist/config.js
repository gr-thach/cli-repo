"use strict";
const envalid = require('envalid');
const { str, num, port, bool, url, testOnly, makeValidator } = envalid;
const strArray = makeValidator(value => {
    if (typeof value === 'string') {
        return value.length === 0 ? [] : value.split(',');
    }
    return value;
});
const env = envalid.cleanEnv(process.env, {
    PORT: port({ default: 3000 }),
    ENVIRONMENT: str({
        choices: ['testing', 'development', 'staging', 'production', 'onpremise'],
        default: 'development'
    }),
    // Required on "non-development" environments
    AMQP_URI: str({ devDefault: testOnly('') }),
    AMQP_SCAN_QUEUE: str({ default: 'guardrails-scan-queue' }),
    AMQP_QUEUE_MAX_PIORITY: num({ default: 2 }),
    AMQP_QUEUE_DURABLE: bool({ default: true }),
    AMQP_QUEUE_MESSAGE_TTL: num({ default: 14400000 }),
    AMQP_DEAD_LETTER_SCAN_QUEUE: str({ default: 'guardrails-dead-letter-scan-queue' }),
    AMQP_DEAD_LETTER_MAX_RETRY: num({ default: 3 }),
    GITHUB_APP_ISSUER_ID: num({ default: 0 }),
    GITHUB_APP_PRIVATE_KEY_BASE64: str({ devDefault: testOnly('') }),
    GUARDRAILS_BADGES_TOKEN_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_CLI_TOKEN_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_JWT_TOKEN_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_SAML_JWT_TOKEN_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_SESSION_KEY_1: str({ devDefault: testOnly('') }),
    GUARDRAILS_SESSION_KEY_2: str({ devDefault: testOnly('') }),
    GUARDRAILS_GITLAB_TOKENS_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_GITLAB_WEBHOOKS_ENDPOINT: str({ devDefault: testOnly('') }),
    GUARDRAILS_GIT_TOKENS_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_JIRA_TOKENS_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_API_KEY_SECRET: str({ devDefault: testOnly('') }),
    GUARDRAILS_ADMIN_TOKEN: str({ devDefault: testOnly('') }),
    GUARDRAILS_BOT_DISPLAY_NAME: str({
        default: 'guardrails'
    }),
    STRIPE_SECRET_KEY: str({ devDefault: testOnly('') }),
    STRIPE_ENDPOINT_SECRET: str({ devDefault: testOnly('') }),
    GITHUB_OAUTH_CLIENT_ID: str({ devDefault: testOnly('test') }),
    GITHUB_OAUTH_CLIENT_SECRET: str({ devDefault: testOnly('test') }),
    GITHUB_OAUTH_REDIRECT_URL: str({ devDefault: testOnly('test') }),
    GITLAB_OAUTH_CLIENT_ID: str({ devDefault: testOnly('test') }),
    GITLAB_OAUTH_CLIENT_SECRET: str({ devDefault: testOnly('test') }),
    GITLAB_OAUTH_REDIRECT_URL: str({ devDefault: testOnly('test') }),
    BITBUCKET_OAUTH_CLIENT_ID: str({ devDefault: testOnly('test') }),
    BITBUCKET_OAUTH_CLIENT_SECRET: str({ devDefault: testOnly('test') }),
    BITBUCKET_OAUTH_REDIRECT_URL: str({ devDefault: testOnly('test') }),
    BITBUCKET_APP_NAME: str({ devDefault: testOnly('test') }),
    BITBUCKET_APP_SECRET: str({ devDefault: testOnly('test') }),
    BITBUCKET_DATA_CENTER_API_URL: str({ default: '' }),
    BITBUCKET_DATA_CENTER_SITE_URL: str({ default: '' }),
    BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_KEY: str({ default: '' }),
    BITBUCKET_DATA_CENTER_OAUTH_CONSUMER_SECRET: str({ default: '' }),
    BITBUCKET_DATA_CENTER_OAUTH_REDIRECT_URL: str({ default: '' }),
    BITBUCKET_DATA_CENTER_OWN_USER_TOKEN: str({ default: '' }),
    BITBUCKET_DATA_CENTER_WEBHOOKS_SECRET: str({ default: '' }),
    BITBUCKET_DATA_CENTER_WEBHOOKS_ENDPOINT: str({ default: '' }),
    // External url to this api service e.g. "https://api.guardrails.io".
    API_EXTERNAL_URL: url({ devDefault: testOnly('https://test') }),
    // Optional
    MONOREPO_NEW_APPROACH_ENABLED: bool({ default: false }),
    ES_URI: str({ default: '' }),
    GUARDRAILS_SAU_SECRET_KEY: str({ default: '' }),
    GUARDRAILS_SAU_PRIVATE_KEY_BASE64: str({ default: '' }),
    SENTRY_DSN: str({ default: '' }),
    GITHUB_URL: str({ default: 'https://github.com' }),
    GITHUB_API_URL: str({ default: 'https://api.github.com' }),
    GITLAB_URL: str({ default: 'https://gitlab.com' }),
    BITBUCKET_API_URL: str({ default: 'https://api.bitbucket.org/2.0' }),
    BITBUCKET_SITE_URL: str({ default: 'https://bitbucket.org' }),
    GUARDRAILS_GITLAB_OWN_USER_TOKEN: str({ devDefault: testOnly('') }),
    WEBSITE_URL: str({ default: '' }),
    DASHBOARD_URL: str({ default: '' }),
    ONPREMISE_MAX_REPOS: num({ default: 0 }),
    ONPREMISE_MAX_DEVS: num({ default: 0 }),
    CORE_API_URI: str({ devDefault: testOnly('') }),
    CACHE_PROVIDER: str({ default: 'redis' }),
    REDIS_URL: str({ default: 'redis://:@redis:6379/0' }),
    IPV6: bool({ default: false }),
    DISABLE_CORS: bool({ default: false }),
    DISABLE_SECURE_COOKIES: bool({ default: false }),
    DISABLE_HTTPONLY_COOKIES: bool({ default: false }),
    ACL_CACHE_EXPIRE_TIME: num({ default: 7200 }),
    ACL_WRITE_ACCESS_REPOS_MODE: bool({ default: false }),
    GUARDRAILS_PRE_HOOK_TOKEN: str({ default: '' }),
    DISABLE_COMMIT_STATUS: bool({ default: false }),
    AUTH_ALLOWED_EMAIL_DOMAINS: strArray({ default: undefined }),
    NEW_RELIC_METADATA_KUBERNETES_CONTAINER_IMAGE_NAME: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_GITHUB: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_CERT_FOR_GITHUB: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_GITLAB: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_CERT_FOR_GITLAB: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_BITBUCKET: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_CERT_FOR_BITBUCKET: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_BITBUCKET_DATA_CENTER: str({ default: '' }),
    SAML_IDENTITY_PROVIDER_CERT_FOR_BITBUCKET_DATA_CENTER: str({ default: '' }),
    STORAGE_HOST: str({ default: '' }),
    STORAGE_ACCESS_KEY: str({ default: '' }),
    STORAGE_SECRET_KEY: str({ default: '' }),
    USE_NEW_QUERY_FINDINGS: bool({ default: false })
});
const constants = (environment => {
    const constantsByEnvironment = {
        default: {
            websiteUrl: env.WEBSITE_URL || 'https://guardrails.io',
            dashboardBaseUrl: env.DASHBOARD_URL || 'https://dashboard.guardrails.io',
            slackDevopsWebhookUrl: 'https://hooks.slack.com/services/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',
            slackGrowthWebhookUrl: 'https://hooks.slack.com/services/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',
            botDisplayName: env.GUARDRAILS_BOT_DISPLAY_NAME
        },
        staging: {
            websiteUrl: env.WEBSITE_URL || 'https://develop.guardrails.io',
            dashboardBaseUrl: env.DASHBOARD_URL || 'https://dashboard.staging.k8s.guardrails.io',
            botDisplayName: 'guardrails-staging'
        },
        development: {
            websiteUrl: env.WEBSITE_URL || 'https://www.dev.guardrails.io',
            dashboardBaseUrl: env.DASHBOARD_URL || 'https://dashboard.dev.guardrails.io',
            botDisplayName: 'guardrails-development'
        },
        testing: {
            websiteUrl: env.WEBSITE_URL || 'https://www.dev.guardrails.io',
            dashboardBaseUrl: env.DASHBOARD_URL || 'https://dashboard.dev.guardrails.io'
        },
        onpremise: {
            websiteUrl: env.WEBSITE_URL,
            dashboardBaseUrl: env.DASHBOARD_URL,
            saml: {
                github: {
                    entryPoint: env.SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_GITHUB,
                    cert: env.SAML_IDENTITY_PROVIDER_CERT_FOR_GITHUB
                },
                gitlab: {
                    entryPoint: env.SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_GITLAB,
                    cert: env.SAML_IDENTITY_PROVIDER_CERT_FOR_GITLAB
                },
                bitbucket: {
                    entryPoint: env.SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_BITBUCKET,
                    cert: env.SAML_IDENTITY_PROVIDER_CERT_FOR_BITBUCKET
                },
                bitbucket_data_center: {
                    entryPoint: env.SAML_IDENTITY_PROVIDER_SINGLE_SIGN_ON_URL_FOR_BITBUCKET_DATA_CENTER,
                    cert: env.SAML_IDENTITY_PROVIDER_CERT_FOR_BITBUCKET_DATA_CENTER
                }
            }
        }
    };
    return { ...constantsByEnvironment.default, ...constantsByEnvironment[environment] };
})(env.ENVIRONMENT);
module.exports = { env, constants };
//# sourceMappingURL=config.js.map