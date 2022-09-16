"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncGitlabAccounts = exports.compareRepo = exports.getGitlabAcccountsAndRepos = exports.enableDisableOnGitlab = exports.checkGitlabGroups = void 0;
const interfaces_1 = require("../interfaces");
const gitlab_1 = __importDefault(require("../services/git/gitlab"));
const scan_1 = require("./scan");
const scans_1 = require("./core-api/scans");
const accounts_1 = require("./core-api/accounts");
const assertGitlab_1 = require("./assertGitlab");
const checkGitlabGroups = async (user) => {
    const gitlabUser = await gitlab_1.default.getAuthenticatedUser(user.gitlabAccessToken);
    gitlabUser.path = gitlabUser.username;
    gitlabUser.kind = 'user';
    const groups = await gitlab_1.default.getGroups(user.gitlabAccessToken);
    return {
        groups,
        gitlabUser
    };
};
exports.checkGitlabGroups = checkGitlabGroups;
const enableDisableOnGitlab = async (gitlabAccessToken, repository, isEnabled) => {
    const gitlabService = new gitlab_1.default(gitlabAccessToken, '');
    if (isEnabled === true) {
        await gitlabService.addHooksAndMemberToGitlabProjects({
            account: repository.account,
            repositories: [repository]
        });
        // When a repo is enable, we check if it has been scanned before. If it hasn't, then the repo is automatically scan once
        const scanCount = await (0, scans_1.queryScanCountPerRepo)(repository.idRepository);
        if (scanCount === 0) {
            const sha = await gitlabService.getBranchSha(repository, repository.defaultBranch);
            await (0, scan_1.triggerScan)(sha, repository.defaultBranch, repository.account, repository, interfaces_1.ScanType.BRANCH, 0);
        }
    }
    else {
        await gitlabService.removeHooksAndMemberFromGitlabProjects({
            repositories: [repository]
        });
    }
};
exports.enableDisableOnGitlab = enableDisableOnGitlab;
const getAccountAndRepos = async (groupOrUser, type, gitService) => {
    return Promise.all([
        (0, accounts_1.findAccountWithReposByProviderInternalId)(String(groupOrUser.id), interfaces_1.GitProvider.GITLAB, type),
        gitService.getRepositories({ providerInternalId: String(groupOrUser.id), type }),
        Promise.resolve(groupOrUser)
    ]);
};
const getGitlabAcccountsAndRepos = async (groups, gitlabUser, gitService) => {
    // for each group they have access to, get the DB accounts and the git repos
    // plus (for gitlab) get the user account with the user repos
    const results = await Promise.all([
        ...groups.map(group => getAccountAndRepos(group, interfaces_1.AccountType.ORGANIZATION, gitService)),
        getAccountAndRepos(gitlabUser, interfaces_1.AccountType.USER, gitService)
    ]);
    // extract the user account to do an assert for org accounts and user separatedly
    const userResults = results.pop();
    // If we haven't created a organization account for the Gitlab group yet then
    // the account will be undefined, so we must filter away those accounts.
    const filteredResults = results.filter(accountWithGitRepo => accountWithGitRepo[0]);
    // Do a sanity check that each account matches a Gitlab group, so we don't accedentially leak accounts.
    (0, assertGitlab_1.assertHasMatchingGitlabGroup)(filteredResults.map(orgAccount => orgAccount[0]), groups);
    if (userResults && userResults[0]) {
        (0, assertGitlab_1.assertAccountMatchesGitlabUser)(userResults[0], gitlabUser);
    }
    // put it back
    if (userResults) {
        results.push(userResults);
    }
    return results;
};
exports.getGitlabAcccountsAndRepos = getGitlabAcccountsAndRepos;
const compareRepo = (repo, gitRepo) => {
    return (repo.name !== gitRepo.path ||
        repo.isPrivate !== (gitRepo.visibility === 'private') ||
        repo.description !== gitRepo.description ||
        repo.fullName !== gitRepo.path_with_namespace ||
        (gitRepo.default_branch && repo.defaultBranch !== gitRepo.default_branch));
};
exports.compareRepo = compareRepo;
const syncGitlabAccounts = async (user, accountHelper) => {
    const { groups, gitlabUser } = await (0, exports.checkGitlabGroups)(user);
    await Promise.all([
        await accountHelper.syncGitlabGroups(groups),
        await accountHelper.syncGitlabUser(gitlabUser)
    ]);
    return { groups, gitlabUser };
};
exports.syncGitlabAccounts = syncGitlabAccounts;
//# sourceMappingURL=gitlab.js.map