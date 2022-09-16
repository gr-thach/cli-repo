const {
  ACCOUNT_TYPE: { ORGANIZATION, USER },
  ACCOUNT_PROVIDER: { BITBUCKET_DATA_CENTER }
} = require('./core-api/enums');

const assertIsBitbucketOrgProject = project => {
  if (!project) {
    throw new Error('Expected Bitbucket Data Center project to be defined.');
  }

  if (!project.id) {
    throw new Error('Expected Bitbucket Data Center project to have an id.');
  }

  if (!project.key) {
    throw new Error(
      `Expected Bitbucket Data Center project (${project.id}) to have a project key.`
    );
  }

  if (!project.name) {
    throw new Error(
      `Expected Bitbucket Data Center project (${project.id}) to not have a project name.`
    );
  }

  if (project.type !== 'NORMAL') {
    throw new Error(
      `Expected Bitbucket Data Center project (${project.id}) to be of type NORMAL, got ${project.type}.`
    );
  }
};

const assertIsBitbucketPersonalProject = personalProject => {
  if (!personalProject) {
    throw new Error('Expected Bitbucket Data Center personal project to be defined.');
  }

  if (!personalProject.id) {
    throw new Error('Expected Bitbucket Data Center personal project to have an id.');
  }

  if (!personalProject.key) {
    throw new Error(
      `Expected Bitbucket Data Center personal project (${personalProject.id}) to have a project key.`
    );
  }

  if (!personalProject.name) {
    throw new Error(
      `Expected Bitbucket Data Center personal project (${personalProject.id}) to not have a project name.`
    );
  }

  if (personalProject.type !== 'PERSONAL') {
    throw new Error(
      `Expected Bitbucket Data Center personal project (${personalProject.id}) to be of type PERSONAL, got ${personalProject.type}.`
    );
  }

  if (!personalProject.owner) {
    throw new Error(
      `Expected Bitbucket Data Center personal project (${personalProject.id}) to have an owner defined.`
    );
  }

  if (!personalProject.owner.id) {
    throw new Error(
      `Expected Bitbucket Data Center personal project (${personalProject.id}) to have an owner id defined.`
    );
  }
};

const assertIsUserAccount = account => {
  if (!account.idAccount) {
    throw new Error('Expected user account to have an idAccount');
  }

  if (!account.providerInternalId) {
    throw new Error('Expected user account to have a providerInternalId');
  }

  if (account.provider !== BITBUCKET_DATA_CENTER) {
    throw new Error('Expected user account provider to be BITBUCKET_DATA_CENTER');
  }

  if (account.type !== USER) {
    throw new Error('Expected user account to be of type USER');
  }
};

const assertAccountMatchesPersonalProject = (account, project) => {
  assertIsUserAccount(account);
  assertIsBitbucketPersonalProject(project);

  if (String(project.id) !== account.providerInternalId) {
    throw new Error(
      `Expected account (${account.idAccount}, ${account.providerInternalId}, ${account.type}, ${account.provider}) to match Bitbucket data center project (${project.id}).`
    );
  }
};

const assertIsOrganizationAccount = account => {
  if (!account.idAccount) {
    throw new Error('Expected organization account to have an idAccount');
  }

  if (!account.providerInternalId) {
    throw new Error('Expected organization account to have a providerInternalId');
  }

  if (account.provider !== BITBUCKET_DATA_CENTER) {
    throw new Error('Expected organization account provider to be BITBUCKET_DATA_CENTER');
  }

  if (account.type !== ORGANIZATION) {
    throw new Error('Expected organization account to be of type ORGANIZATION');
  }
};

const assertAccountMatchesOrgProject = (account, project) => {
  assertIsOrganizationAccount(account);
  assertIsBitbucketOrgProject(project);

  if (String(project.id) !== account.providerInternalId) {
    throw new Error(
      `Expected account (${account.idAccount}, ${account.providerInternalId}, ${account.type}, ${account.provider}) to match Bitbucket data center project (${project.id}).`
    );
  }
};

const containsMatchingOrgProject = (account, projects) => {
  assertIsOrganizationAccount(account);

  return projects.some(project => {
    assertIsBitbucketOrgProject(project);
    return String(project.id) === account.providerInternalId;
  });
};

const assertAccountsHasMatchingOrgProject = (accounts, projects) => {
  accounts.forEach(account => {
    if (!containsMatchingOrgProject(account, projects)) {
      throw new Error(
        `Expected to find a matching Project for account (${account.idAccount}) but non was found.`
      );
    }
  });
};

const assertIsBitbucketOrgProjects = projects => {
  projects.forEach(project => assertIsBitbucketOrgProject(project));
};

module.exports = {
  assertAccountsHasMatchingOrgProject,
  assertIsBitbucketOrgProjects,
  assertIsBitbucketOrgProject,
  assertAccountMatchesOrgProject,
  assertIsBitbucketPersonalProject,
  assertAccountMatchesPersonalProject
};
