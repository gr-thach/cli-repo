"use strict";
const get = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { jiraRepositoryConfigFragment } = require('./fragments');
const createJiraRepositoryConfig = async (jiraRepositoryConfig) => {
    const query = gql `
    mutation createJiraRepositoryConfig($input: CreateJiraRepositoryConfigInput!) {
      createJiraRepositoryConfig(input: $input) {
        jiraRepositoryConfig {
          ...JiraRepositoryConfigFragment
        }
      }
    }
    ${jiraRepositoryConfigFragment}
  `;
    const { data } = await coreAxios.post('/graphql', {
        query,
        variables: {
            input: {
                jiraRepositoryConfig: {
                    ...jiraRepositoryConfig,
                    createdAt: new Date().toJSON(),
                    updatedAt: new Date().toJSON()
                }
            }
        }
    });
    return get(data, 'data.createJiraRepositoryConfig.jiraRepositoryConfig');
};
const findJiraRepositoryConfig = async (idJiraRepositoryConfig) => {
    const query = gql `
    query($idJiraRepositoryConfig: UUID!) {
      jiraRepositoryConfig(idJiraRepositoryConfig: $idJiraRepositoryConfig) {
        ...JiraRepositoryConfigFragment
      }
    }
    ${jiraRepositoryConfigFragment}
  `;
    const variables = { idJiraRepositoryConfig };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    const jiraRepositoryConfig = get(data, 'data.jiraRepositoryConfig', null);
    if (!jiraRepositoryConfig || jiraRepositoryConfig.deletedAt) {
        return null;
    }
    return jiraRepositoryConfig;
};
const findJiraRepositoryConfigByRepositoryId = async (idRepository) => {
    const query = gql `
    query($fkRepository: Int!) {
      jiraRepositoryConfigs(condition: { fkRepository: $fkRepository, deletedAt: null }) {
        nodes {
          ...JiraRepositoryConfigFragment
        }
      }
    }
    ${jiraRepositoryConfigFragment}
  `;
    const variables = { fkRepository: parseInt(idRepository, 10) };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    const jiraRepositoryConfigs = get(data, 'data.jiraRepositoryConfigs.nodes', []);
    if (jiraRepositoryConfigs.length > 1) {
        const ids = jiraRepositoryConfigs.map(jiraRepositoryConfig => jiraRepositoryConfig.idJiraRepositoryConfig);
        throw new Error(`Found multiple jira repository configs with the same repository id. Jira repository config ids were [${ids}].`);
    }
    return jiraRepositoryConfigs[0];
};
const findJiraRepositoryConfigsByJiraIntegrationId = async (idJiraIntegrationConfig) => {
    const query = gql `
    query($fkJiraIntegrationConfig: UUID!) {
      jiraRepositoryConfigs(
        condition: { fkJiraIntegrationConfig: $fkJiraIntegrationConfig, deletedAt: null }
      ) {
        nodes {
          ...JiraRepositoryConfigFragment
        }
      }
    }
    ${jiraRepositoryConfigFragment}
  `;
    const variables = { fkJiraIntegrationConfig: idJiraIntegrationConfig };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.jiraRepositoryConfigs.nodes', []);
};
const updateJiraRepositoryConfig = async (idJiraRepositoryConfig, patch) => {
    if (!patch) {
        throw new Error(`Patch was null or undefined when updating jira repository config '${idJiraRepositoryConfig}'.`);
    }
    const query = gql `
    mutation updateJiraRepositoryConfig($input: UpdateJiraRepositoryConfigInput!) {
      updateJiraRepositoryConfig(input: $input) {
        jiraRepositoryConfig {
          ...JiraRepositoryConfigFragment
        }
      }
    }
    ${jiraRepositoryConfigFragment}
  `;
    const variables = {
        input: {
            idJiraRepositoryConfig,
            patch: {
                ...patch,
                updatedAt: new Date().toJSON()
            }
        }
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.updateJiraRepositoryConfig.jiraRepositoryConfig');
};
const deleteJiraRepositoryConfig = idJiraRepositoryConfig => updateJiraRepositoryConfig(idJiraRepositoryConfig, { deletedAt: new Date().toJSON() });
module.exports = {
    createJiraRepositoryConfig: wrapper(createJiraRepositoryConfig),
    findJiraRepositoryConfig: wrapper(findJiraRepositoryConfig),
    findJiraRepositoryConfigsByJiraIntegrationId: wrapper(findJiraRepositoryConfigsByJiraIntegrationId),
    deleteJiraRepositoryConfig: wrapper(deleteJiraRepositoryConfig),
    updateJiraRepositoryConfig: wrapper(updateJiraRepositoryConfig),
    findJiraRepositoryConfigByRepositoryId: wrapper(findJiraRepositoryConfigByRepositoryId)
};
//# sourceMappingURL=jiraRepositoryConfigs.js.map