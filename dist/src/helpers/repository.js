"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateRepositoriesLimitReachedError = exports.getAllowedRepositoryIdsGroupedByTeamRole = exports.getAllAccountsRepositoryIds = exports.formatRepositoriesStatsResponse = exports.shouldUpdateRepository = exports.isPrivateReposLimitReached = exports.populateGitReposToDBRepos = exports.getProviderSpecificFieldsForCreate = exports.getProviderSpecificFieldsForUpdate = void 0;
const crypto_1 = __importDefault(require("crypto"));
const moment_1 = __importDefault(require("moment"));
const boom_1 = __importDefault(require("@hapi/boom"));
const client_1 = require("@slack/client");
const get_1 = __importDefault(require("lodash/get"));
const sentry_1 = __importDefault(require("../../sentry"));
const config_1 = require("../../config");
const repositories_1 = require("./core-api/repositories");
const users_1 = require("./core-api/users");
const stats_1 = require("./stats");
const subscription_1 = require("./subscription");
const gitlab_1 = require("./gitlab");
const bitbucketDataCenter_1 = require("./bitbucketDataCenter");
const interfaces_1 = require("../interfaces");
const user_1 = require("./user");
const generateBadgeToken = (identifier) => {
    const hmacForBadgesToken = () => crypto_1.default.createHmac('sha256', config_1.env.GUARDRAILS_BADGES_TOKEN_SECRET);
    return hmacForBadgesToken()
        .update(identifier.toLowerCase())
        .digest('hex');
};
const getProviderSpecificFieldsForUpdate = (provider, gitRepo, isLegacyPlan, existingRepo) => {
    let repo;
    if (provider === interfaces_1.GitProvider.GITHUB) {
        repo = gitRepo;
        let isEnabled;
        if (existingRepo) {
            isEnabled = existingRepo.isEnabled;
            if (!isEnabled && existingRepo.createdAt === existingRepo.updatedAt && !isLegacyPlan) {
                isEnabled = true;
            }
        }
        return {
            name: repo.name,
            ...(isEnabled !== undefined && { isEnabled }),
            isPrivate: !!repo.private,
            description: repo.description,
            fullName: repo.full_name,
            language: repo.language,
            defaultBranch: repo.default_branch,
            updatedAt: new Date().toJSON()
        };
    }
    if (provider === interfaces_1.GitProvider.GITLAB) {
        repo = gitRepo;
        return {
            name: repo.path,
            isPrivate: repo.visibility === 'private',
            description: repo.description,
            fullName: repo.path_with_namespace,
            language: undefined,
            defaultBranch: repo.default_branch,
            updatedAt: new Date().toJSON()
        };
    }
    if (provider === interfaces_1.GitProvider.BITBUCKET) {
        repo = gitRepo;
        if (!repo.name) {
            throw new Error('Expected to find the name on git repository.');
        }
        return {
            name: repo.name,
            isPrivate: !!repo.is_private,
            description: repo.description,
            fullName: repo.full_name || repo.name,
            language: repo.language,
            defaultBranch: (0, get_1.default)(gitRepo, 'mainbranch.name'),
            updatedAt: new Date().toJSON()
        };
    }
    if (provider === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
        repo = gitRepo;
        if (!repo.id) {
            throw new Error('Expected to find a id on git repository.');
        }
        if (!repo.slug) {
            throw new Error('Expected to find a slug on git repository.');
        }
        return {
            name: repo.slug,
            isPrivate: !repo.public,
            // description: repo.description,
            fullName: `projects/${repo.project.key}/repos/${repo.slug}`,
            language: undefined,
            // defaultBranch: repo.default_branch,
            updatedAt: new Date().toJSON()
        };
    }
    throw new Error(`Invalid provider: "${provider}"`);
};
exports.getProviderSpecificFieldsForUpdate = getProviderSpecificFieldsForUpdate;
const getProviderSpecificFieldsForCreate = (provider, gitRepo) => {
    let repo;
    const updateFields = (0, exports.getProviderSpecificFieldsForUpdate)(provider, gitRepo);
    if (provider === interfaces_1.GitProvider.GITHUB) {
        repo = gitRepo;
        return {
            ...updateFields,
            badgeToken: generateBadgeToken(repo.full_name),
            providerInternalId: String(repo.id)
        };
    }
    if (provider === interfaces_1.GitProvider.GITLAB) {
        repo = gitRepo;
        return {
            ...updateFields,
            badgeToken: generateBadgeToken(repo.path),
            providerInternalId: String(repo.id)
        };
    }
    if (provider === interfaces_1.GitProvider.BITBUCKET) {
        repo = gitRepo;
        if (!repo.name) {
            throw new Error('Expected to find the name on git repository.');
        }
        if (!repo.uuid) {
            throw new Error('Expected to find the uuid on git repository.');
        }
        return {
            ...updateFields,
            badgeToken: generateBadgeToken(repo.name),
            providerInternalId: repo.uuid
        };
    }
    if (provider === interfaces_1.GitProvider.BITBUCKET_DATA_CENTER) {
        repo = gitRepo;
        if (!repo.id) {
            throw new Error('Expected to find a id on git repository.');
        }
        return {
            ...updateFields,
            badgeToken: generateBadgeToken(String(repo.id)),
            providerInternalId: String(repo.id)
        };
    }
    throw new Error(`Invalid provider: "${provider}"`);
};
exports.getProviderSpecificFieldsForCreate = getProviderSpecificFieldsForCreate;
const populateGitReposToDBRepos = (account, gitRepos, isLegacyPlan) => {
    if (!Array.isArray(gitRepos)) {
        throw new Error('gitRepos is not an array');
    }
    const { idAccount, provider } = account;
    return gitRepos.map(gitRepo => ({
        provider: provider,
        ...(0, exports.getProviderSpecificFieldsForCreate)(provider, gitRepo),
        // for new github repos that are not in a legacy plan, we enable by default
        isEnabled: provider === interfaces_1.GitProvider.GITHUB && !isLegacyPlan,
        fkAccount: idAccount,
        createdAt: new Date().toJSON()
    }));
};
exports.populateGitReposToDBRepos = populateGitReposToDBRepos;
const isPrivateReposLimitReached = async (repository) => {
    const repositories = await (0, repositories_1.findRepositoriesByAccountId)(repository.fkAccount);
    const totalPrivateRepositoriesCount = repositories.reduce((acc, currentRepository) => {
        if (config_1.env.ENVIRONMENT === 'onpremise') {
            return acc + (currentRepository.isEnabled ? 1 : 0);
        }
        return acc + (currentRepository.isPrivate && currentRepository.isEnabled ? 1 : 0);
    }, 0);
    const accountMaxPrivateReposAllowed = (await (0, subscription_1.getFeatureValue)(repository.account.subscription, interfaces_1.PlanFeatureName.PRIVATE_REPOSITORIES));
    // limit reached
    if (totalPrivateRepositoriesCount >= accountMaxPrivateReposAllowed) {
        return {
            totalPrivateRepositoriesCount,
            accountMaxPrivateReposAllowed
        };
    }
    return false;
};
exports.isPrivateReposLimitReached = isPrivateReposLimitReached;
const shouldUpdateRepository = (repo, gitRepo, provider, isLegacyPlan) => {
    switch (provider) {
        case interfaces_1.GitProvider.GITHUB:
            return !repo.isEnabled && repo.createdAt === repo.updatedAt && !isLegacyPlan;
        case interfaces_1.GitProvider.GITLAB:
            return (0, gitlab_1.compareRepo)(repo, gitRepo);
        case interfaces_1.GitProvider.BITBUCKET_DATA_CENTER:
            return (0, bitbucketDataCenter_1.compareRepo)(repo, gitRepo);
        default:
            return false;
    }
};
exports.shouldUpdateRepository = shouldUpdateRepository;
const formatRepositoriesStatsResponse = (stats, days = 30) => {
    const orderedResponse = {};
    const mergedStatsByRepositoryFk = {};
    const lastThirtyDays = (0, stats_1.createLastNDaysArray)(days);
    stats.forEach(row => {
        const repoId = String(row.fkRepository);
        if (!mergedStatsByRepositoryFk[repoId]) {
            mergedStatsByRepositoryFk[repoId] = {};
        }
        const d = (0, moment_1.default)(row.timegroup).format('YYYY-MM-DD');
        mergedStatsByRepositoryFk[repoId][d] = row.totalVulnerabilities;
    });
    Object.keys(mergedStatsByRepositoryFk).forEach(repoId => {
        let previous = 0;
        orderedResponse[repoId] = {};
        Object.keys(lastThirtyDays).forEach(date => {
            if (mergedStatsByRepositoryFk[repoId][date] === undefined) {
                orderedResponse[repoId][date] = previous;
            }
            else {
                orderedResponse[repoId][date] = mergedStatsByRepositoryFk[repoId][date];
                previous = mergedStatsByRepositoryFk[repoId][date];
            }
        });
    });
    return orderedResponse;
};
exports.formatRepositoriesStatsResponse = formatRepositoriesStatsResponse;
const getAllAccountsRepositoryIds = async (accountId) => {
    const allAccountRepositories = await (0, repositories_1.findRepositoriesByAccountId)(accountId);
    return allAccountRepositories.map(r => r.idRepository);
};
exports.getAllAccountsRepositoryIds = getAllAccountsRepositoryIds;
const getAllowedRepositoryIdsGroupedByTeamRole = async (userId, accountId) => {
    const allowedRepositoriesGroupByTeamRole = await (0, users_1.queryRepositoriesByUserOnTeam)(userId, accountId);
    if (!allowedRepositoriesGroupByTeamRole.length) {
        return null;
    }
    return allowedRepositoriesGroupByTeamRole.reduce((acc, { name: teamRoleName, fkRepository }) => {
        acc[teamRoleName].push(fkRepository);
        return acc;
    }, {
        team_developer: [],
        team_security_engineer: [],
        team_admin: []
    });
};
exports.getAllowedRepositoryIdsGroupedByTeamRole = getAllowedRepositoryIdsGroupedByTeamRole;
const privateRepositoriesLimitReachedError = async ({ repositoryId, user, totalPrivateRepositoriesCount, accountMaxPrivateReposAllowed }) => {
    if (config_1.env.ENVIRONMENT === 'production' || config_1.env.ENVIRONMENT === 'staging') {
        try {
            const { login } = (0, user_1.parseUser)(user);
            const webhook = new client_1.IncomingWebhook(config_1.env.ENVIRONMENT === 'production'
                ? config_1.constants.slackGrowthWebhookUrl
                : config_1.constants.slackDevopsWebhookUrl);
            const message = `:warning: ${login} tried to enable repo with id ${repositoryId} | private enabled repos: ${totalPrivateRepositoriesCount} / plan limit: ${accountMaxPrivateReposAllowed}`;
            await webhook.send(message);
        }
        catch (e) {
            await (0, sentry_1.default)(e);
        }
    }
    throw boom_1.default.paymentRequired('Your plan does not allow more private repositories');
};
exports.privateRepositoriesLimitReachedError = privateRepositoriesLimitReachedError;
//# sourceMappingURL=repository.js.map