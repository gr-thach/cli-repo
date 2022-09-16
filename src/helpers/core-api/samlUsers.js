const get = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { samlUserFragment } = require('./fragments');

const createSamlUser = async samlUser => {
  const query = gql`
    mutation createSamlUser($input: CreateSamlUserInput!) {
      createSamlUser(input: $input) {
        samlUser {
          ...SamlUserFragment
        }
      }
    }
    ${samlUserFragment}
  `;

  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: { input: { samlUser } }
  });

  return get(data, 'data.createSamlUser.samlUser');
};

const updateSamlUser = async (idSamlUser, patch) => {
  const query = gql`
    mutation updateSamlUser($input: UpdateSamlUserInput!) {
      updateSamlUser(input: $input) {
        samlUser {
          ...SamlUserFragment
        }
      }
    }
    ${samlUserFragment}
  `;
  const variables = { input: { idSamlUser, patch } };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return get(data, 'data.updateSamlUser.samlUser');
};

const findSamlUserByExternalId = async (idSamlProvider, externalId) => {
  const query = gql`
    query($fkSamlProvider: UUID!, $externalId: String!) {
      samlUsers(
        condition: { fkSamlProvider: $fkSamlProvider, externalId: $externalId, deletedAt: null }
      ) {
        nodes {
          ...SamlUserFragment
        }
      }
    }
    ${samlUserFragment}
  `;

  const variables = { fkSamlProvider: idSamlProvider, externalId };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  const samlUsers = get(data, 'data.samlUsers.nodes');

  if (!samlUsers || samlUsers.length === 0) {
    return undefined;
  }

  if (samlUsers.length > 1) {
    // This shouldn't be impossible, but if we do get this error we have made a misstake somewhere and
    // managed to generate the same cli token for different accounts.
    const ids = samlUsers.map(samlUser => samlUser.idSamlUser);
    throw new Error(
      `Found multiple saml users with the same external id. Saml user ids were [${ids}].`
    );
  }

  return samlUsers[0];
};

const findSamlUserById = async idSamlUser => {
  const query = gql`
    query($idSamlUser: UUID!) {
      samlUser(idSamlUser: $idSamlUser) {
        ...SamlUserFragment
      }
    }
    ${samlUserFragment}
  `;

  const variables = { idSamlUser };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  const samlUser = get(data, 'data.samlUser');

  if (!samlUser) return null;

  return samlUser;
};

module.exports = {
  createSamlUser: wrapper(createSamlUser),
  updateSamlUser: wrapper(updateSamlUser),
  findSamlUserByExternalId: wrapper(findSamlUserByExternalId),
  findSamlUserById: wrapper(findSamlUserById)
};
