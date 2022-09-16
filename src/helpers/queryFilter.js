const actionsFilters = ({ idAccount, idRepository }) => {
  const filters = {
    fkAccount: { equalTo: idAccount },
    fkRepository: { equalTo: idRepository },
    deletedAt: { isNull: true }
  };

  return filters;
};

const accountIdentifierFilter = provider => {
  if (provider.toUpperCase() === 'BITBUCKET_DATA_CENTER') {
    return `providerMetadata: {
      contains: {
        projectKey: $accountIdentifier
      }
    }`;
  }
  return 'login: { equalTo: $accountIdentifier }';
};

module.exports = {
  actionsFilters,
  accountIdentifierFilter
};
