"use strict";
const { ACCOUNT_TYPE: { ORGANIZATION, USER }, ACCOUNT_PROVIDER: { GITLAB } } = require('./core-api/enums');
const assertIsOrganizationAccount = account => {
    if (!account.idAccount) {
        throw new Error('Expected organization account to have an idAccount');
    }
    if (!account.providerInternalId) {
        throw new Error('Expected organization account to have a providerInternalId');
    }
    if (account.provider !== GITLAB) {
        throw new Error('Expected organization account provider to be GITLAB');
    }
    if (account.type !== ORGANIZATION) {
        throw new Error('Expected organization account to be of type ORGANIZATION');
    }
};
const assertIsGitlabGroup = group => {
    if (!group.id) {
        throw new Error('Expected Gitlab group to have an id.');
    }
    if (!group.path && !group.full_path) {
        throw new Error(`Expected Gitlab group (${group.id}) to have either a path or a full_path.`);
    }
    if (group.username) {
        throw new Error(`Expected Gitlab group (${group.id}) to not have a username defined, is this a Gitlab user and not a group?.`);
    }
};
const assertAccountMatchesGitlabGroup = (account, group) => {
    assertIsOrganizationAccount(account);
    assertIsGitlabGroup(group);
    if (String(group.id) !== account.providerInternalId) {
        throw new Error(`Expected account (${account.idAccount}, ${account.providerInternalId}, ${account.type}, ${account.provider}) to match Gitlab group (${group.id}).`);
    }
};
const containsMatchingGitlabGroup = (account, groups) => {
    assertIsOrganizationAccount(account);
    return groups.some(group => {
        assertIsGitlabGroup(group);
        return String(group.id) === account.providerInternalId;
    });
};
// Groups is the Gitlab group objects that we get from the Gitlab API.
// Organization Accounts are the accounts that is stored in our database in the Accounts table.
const assertHasMatchingGitlabGroup = (organizationAccounts, groups) => {
    organizationAccounts.forEach(account => {
        if (!containsMatchingGitlabGroup(account, groups)) {
            throw new Error(`Expected to find a matching Gitlab group for account (${account.idAccount}) but non was found.`);
        }
    });
};
const assertIsUserAccount = account => {
    if (!account.idAccount) {
        throw new Error('Expected account of type user to have an idAccount');
    }
    if (!account.providerInternalId) {
        throw new Error('Expected account of type user to have a providerInternalId');
    }
    if (account.provider !== GITLAB) {
        throw new Error('Expected account of type user to have GITLAB provider');
    }
    if (account.type !== USER) {
        throw new Error('Expected account of type user to be of type USER');
    }
};
const assertIsGitlabUser = gitlabUser => {
    if (!gitlabUser.id) {
        throw new Error("Gitlab user doesn't have an id.");
    }
    if (gitlabUser.kind !== 'user') {
        throw new Error(`Expected Gitlab user (${gitlabUser.id}) to be of kind 'user'.`);
    }
    if (!gitlabUser.username) {
        throw new Error(`Expected Gitlab user (${gitlabUser.id}) to have a username.`);
    }
};
// GitlabUser is the user object we get from the Gitlab API.
// Account is the account of type user that is stored in our database in the Accounts table.
const assertAccountMatchesGitlabUser = (account, gitlabUser) => {
    assertIsUserAccount(account);
    assertIsGitlabUser(gitlabUser);
    if (String(gitlabUser.id) !== account.providerInternalId) {
        throw new Error(`Expected account (${account.idAccount}, ${account.providerInternalId}, ${account.type}, ${account.provider}) to match Gitlab user (${gitlabUser.id}).`);
    }
};
module.exports = {
    assertHasMatchingGitlabGroup,
    assertAccountMatchesGitlabUser,
    assertAccountMatchesGitlabGroup,
    assertIsGitlabUser,
    assertIsGitlabGroup
};
//# sourceMappingURL=assertGitlab.js.map