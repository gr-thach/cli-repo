"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncBitbucketDataCenterAccounts = exports.syncDefaultBranches = exports.compareRepo = exports.getBitbucketDataCenterAcccountsAndRepos = void 0;
const get_1 = __importDefault(require("lodash/get"));
const interfaces_1 = require("../interfaces");
const accounts_1 = require("./core-api/accounts");
const assertBitbucketDataCenter_1 = require("./assertBitbucketDataCenter");
const repositories_1 = require("./core-api/repositories");
const sentry_1 = __importDefault(require("../../sentry"));
const syncBitbucketDataCenterAccounts_1 = __importDefault(require("../sync/bitbucketDataCenter/syncBitbucketDataCenterAccounts"));
const getBitbucketDataCenterAcccountsAndRepos = async (projects, personalProject, gitService) => {
    const results = await Promise.all([
        ...projects.map(project => Promise.all([
            (0, accounts_1.findAccountWithReposByProviderInternalId)(String(project.id), interfaces_1.GitProvider.BITBUCKET_DATA_CENTER, interfaces_1.AccountType.ORGANIZATION),
            gitService.getRepositories({ projectKey: project.key }),
            Promise.resolve(project)
        ])),
        Promise.all([
            (0, accounts_1.findAccountWithReposByProviderInternalId)(String(personalProject.id), interfaces_1.GitProvider.BITBUCKET_DATA_CENTER, interfaces_1.AccountType.USER),
            gitService.getRepositories({ projectKey: personalProject.key }),
            Promise.resolve(personalProject)
        ])
    ]);
    // extract the user account to do an assert for org accounts and user separatedly
    const userResults = results.pop();
    // If we haven't created a organization account for the Bitbucket group yet then
    // the account will be undefined, so we must filter away those accounts.
    const filteredResults = results.filter(accountWithGitRepo => accountWithGitRepo[0]);
    // Do a sanity check that each account matches a Bitbucket data center project, so we don't accedentially leak accounts.
    (0, assertBitbucketDataCenter_1.assertAccountsHasMatchingOrgProject)(filteredResults.map(orgAccount => orgAccount[0]), projects);
    // If this is the first time the user is logging in into Guardrails then
    // the account will be undefined (as we haven't created it yet), that's why we need this check here.
    if (userResults && userResults[0]) {
        (0, assertBitbucketDataCenter_1.assertAccountMatchesPersonalProject)(userResults[0], personalProject);
    }
    // put it back
    if (userResults) {
        results.push(userResults);
    }
    return results;
};
exports.getBitbucketDataCenterAcccountsAndRepos = getBitbucketDataCenterAcccountsAndRepos;
const compareRepo = (repo, gitRepo) => {
    return (repo.name !== gitRepo.slug ||
        repo.isPrivate === gitRepo.public ||
        // repo.description !== gitRepo.description ||
        repo.fullName !== `projects/${gitRepo.project.key}/repos/${gitRepo.slug}`
    // (gitRepo.default_branch && gitRepo.default_branch !== repo.defaultBranch)
    );
};
exports.compareRepo = compareRepo;
const syncDefaultBranch = async (repo, gitRepo, gitService) => {
    const gitDefaultBranch = (0, get_1.default)(gitRepo, 'default_branch', null);
    if (!gitDefaultBranch) {
        const defaultBranch = await gitService.getDefaultBranch(repo);
        if (defaultBranch && defaultBranch !== repo.defaultBranch) {
            try {
                await (0, repositories_1.updateRepository)(repo.idRepository, {
                    defaultBranch,
                    updatedAt: new Date().toJSON()
                });
            }
            catch (e) {
                (0, sentry_1.default)(e);
            }
        }
    }
};
const syncDefaultBranches = async (repos, gitRepos, account, gitService) => {
    return Promise.all(repos.map(repo => {
        const gitRepo = gitRepos.find(x => repo.providerInternalId === String(x.id));
        return gitRepo ? syncDefaultBranch({ ...repo, account }, gitRepo, gitService) : undefined;
    }));
};
exports.syncDefaultBranches = syncDefaultBranches;
const syncBitbucketDataCenterAccounts = async (user, gitService) => {
    const projects = await gitService.getProjects();
    const personalProject = await gitService.getPersonalProject();
    const syncBitbucketDataCenter = new syncBitbucketDataCenterAccounts_1.default(user);
    await syncBitbucketDataCenter.sync(projects, personalProject);
    return { projects, personalProject };
};
exports.syncBitbucketDataCenterAccounts = syncBitbucketDataCenterAccounts;
//# sourceMappingURL=bitbucketDataCenter.js.map