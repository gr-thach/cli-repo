"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findRepositoryByToken = exports.validateIsOnPremise = exports.validateTokens = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const accounts_1 = require("./core-api/accounts");
const config_1 = require("../../config");
const repositories_1 = require("./core-api/repositories");
// There are two ways of authenticating with pre-hook.
// 1. Using cli token, this is used by Bitbucket pre-hook because the token is entered in the Bitbucket UI in the project or repo settings.
//    which means that we can't have a single token because then users could trigger scans for repositories that they don't have access to.
// 2. Using pre-hook token, this is used by Gitlab pre-hook, this is because the pre-hook is installed inside the Gitlab instance on a global level,
//    so it is only possible to have a single token for all repositories in the Gitlab instance. The pre-hook token is entered in the replicated config
//    and in the pre-hook config inside the Gitlab instance.
const validateTokens = async (cliToken, preHookToken) => {
    if (cliToken && preHookToken) {
        throw boom_1.default.badRequest('You are not allowed to authenticate with both a cli token and a pre-hook token.');
    }
    else if (cliToken) {
        const account = await (0, accounts_1.findBaseAccountByCliToken)(cliToken);
        if (!account) {
            throw boom_1.default.badRequest('Invalid cli token.');
        }
    }
    else if (preHookToken) {
        if (preHookToken !== config_1.env.GUARDRAILS_PRE_HOOK_TOKEN) {
            throw boom_1.default.badRequest('Invalid pre-hook token.');
        }
    }
    else {
        throw boom_1.default.badRequest('Requires cli token or pre-hook token.');
    }
};
exports.validateTokens = validateTokens;
const validateIsOnPremise = () => {
    if (config_1.env.ENVIRONMENT !== 'onpremise') {
        throw boom_1.default.badRequest('Endpoint is only available in on-premise installations.');
    }
};
exports.validateIsOnPremise = validateIsOnPremise;
const findRepositoryByToken = async (cliToken, preHookToken, provider, repositoryProviderInternalId) => {
    let repository;
    if (cliToken) {
        repository = (0, repositories_1.findRepositoryWithAccountByCliTokenAndProviderInternalId)(cliToken, repositoryProviderInternalId);
    }
    else if (preHookToken) {
        repository = (0, repositories_1.findRepositoryWithAccountByProviderInternalId)(repositoryProviderInternalId, provider);
    }
    else {
        throw boom_1.default.badRequest('Requires cli token or pre-hook token.');
    }
    if (!repository) {
        throw boom_1.default.notFound('Repository not found.');
    }
    return repository;
};
exports.findRepositoryByToken = findRepositoryByToken;
//# sourceMappingURL=preHook.js.map