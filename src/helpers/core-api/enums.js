const gqlEnumConstants = {
  ACCOUNT_PROVIDER: {
    GITHUB: 'GITHUB',
    GITLAB: 'GITLAB',
    BITBUCKET: 'BITBUCKET',
    BITBUCKET_DATA_CENTER: 'BITBUCKET_DATA_CENTER'
  },
  ACCOUNT_TYPE: {
    USER: 'USER',
    ORGANIZATION: 'ORGANIZATION'
  },
  SCAN_TYPE: {
    BRANCH: 'BRANCH',
    PULL: 'PULL',
    CLI: 'CLI',
    PRE_HOOK: 'PRE_HOOK'
  },
  PLAN_FEATURES_SPECIAL_VALUES: {
    NONE: 'NONE',
    ALL: 'ALL',
    YES: 'YES',
    NO: 'NO',
    UNLIMITED: 'UNLIMITED'
  }
};

module.exports = gqlEnumConstants;
