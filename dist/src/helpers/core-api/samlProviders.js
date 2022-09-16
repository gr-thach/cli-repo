"use strict";
const get = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { samlProviderFragment } = require('./fragments');
const createSamlProvider = async (samlProvider) => {
    const query = gql `
    mutation createSamlProvider($input: CreateSamlProviderInput!) {
      createSamlProvider(input: $input) {
        samlProvider {
          ...SamlProviderFragment
        }
      }
    }
    ${samlProviderFragment}
  `;
    const { data } = await coreAxios.post('/graphql', {
        query,
        variables: { input: { samlProvider } }
    });
    return get(data, 'data.createSamlProvider.samlProvider');
};
const updateSamlProvider = async (idSamlProvider, patch) => {
    const query = gql `
    mutation updateSamlProvider($input: UpdateSamlProviderInput!) {
      updateSamlProvider(input: $input) {
        samlProvider {
          ...SamlProviderFragment
        }
      }
    }
    ${samlProviderFragment}
  `;
    const variables = { input: { idSamlProvider, patch } };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.updateSamlProvider.samlProvider');
};
const findSamlProviderById = async (idSamlProvider) => {
    const query = gql `
    query($idSamlProvider: UUID!) {
      samlProvider(idSamlProvider: $idSamlProvider) {
        ...SamlProviderFragment
      }
    }
    ${samlProviderFragment}
  `;
    const variables = { idSamlProvider };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    const samlProvider = get(data, 'data.samlProvider');
    if (!samlProvider) {
        return null;
    }
    return samlProvider;
};
const findSamlProviderByAccountId = async (accountId) => {
    const query = gql `
    query($fkAccount: Int!) {
      samlProviders(condition: { fkAccount: $fkAccount }) {
        nodes {
          ...SamlProviderFragment
        }
      }
    }
    ${samlProviderFragment}
  `;
    const variables = { fkAccount: accountId };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    const samlProviders = get(data, 'data.samlProviders.nodes');
    if (!samlProviders || samlProviders.length === 0) {
        return undefined;
    }
    if (samlProviders.length > 1) {
        // This shouldn't be impossible, but if we do get this error we have made a misstake somewhere and
        // managed to generate the same cli token for different accounts.
        const ids = samlProviders.map(samlProvider => samlProvider.idSamlProvider);
        throw new Error(`Found multiple saml providers with the same api key. Saml provider ids were [${ids}].`);
    }
    return samlProviders[0];
};
module.exports = {
    createSamlProvider: wrapper(createSamlProvider),
    updateSamlProvider: wrapper(updateSamlProvider),
    findSamlProviderById: wrapper(findSamlProviderById),
    findSamlProviderByAccountId: wrapper(findSamlProviderByAccountId)
};
//# sourceMappingURL=samlProviders.js.map