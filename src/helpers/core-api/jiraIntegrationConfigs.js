const get = require('lodash/get');
const { jiraIntegrationConfigFragment } = require('./fragments');
const { coreAxios, wrapper, gql } = require('./index');

const createJiraIntegrationConfig = async jiraIntegrationConfig => {
  const query = gql`
    mutation createJiraIntegrationConfig($input: CreateJiraIntegrationConfigInput!) {
      createJiraIntegrationConfig(input: $input) {
        jiraIntegrationConfig {
          ...JiraIntegrationConfigFragment
        }
      }
    }
    ${jiraIntegrationConfigFragment}
  `;

  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: {
      input: {
        jiraIntegrationConfig: {
          ...jiraIntegrationConfig,
          createdAt: new Date().toJSON(),
          updatedAt: new Date().toJSON()
        }
      }
    }
  });

  return get(data, 'data.createJiraIntegrationConfig.jiraIntegrationConfig');
};

const updateJiraIntegrationConfig = async (idJiraIntegrationConfig, patch) => {
  if (!patch) {
    throw new Error(
      `Patch was null or undefined when updating jira integration config '${idJiraIntegrationConfig}'.`
    );
  }

  const query = gql`
    mutation updateJiraIntegrationConfig($input: UpdateJiraIntegrationConfigInput!) {
      updateJiraIntegrationConfig(input: $input) {
        jiraIntegrationConfig {
          ...JiraIntegrationConfigFragment
        }
      }
    }
    ${jiraIntegrationConfigFragment}
  `;
  const variables = {
    input: {
      idJiraIntegrationConfig,
      patch: {
        ...patch,
        updatedAt: new Date().toJSON()
      }
    }
  };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return get(data, 'data.updateJiraIntegrationConfig.jiraIntegrationConfig');
};

const getJiraIntegrationConfigs = async idAccount => {
  const query = gql`
    query($fkAccount: Int!) {
      jiraIntegrationConfigs(condition: { fkAccount: $fkAccount, deletedAt: null }) {
        nodes {
          ...JiraIntegrationConfigFragment
        }
      }
    }
    ${jiraIntegrationConfigFragment}
  `;

  const variables = { fkAccount: parseInt(idAccount, 10) };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  return get(data, 'data.jiraIntegrationConfigs.nodes', []);
};

const findJiraIntegrationConfig = async idJiraIntegrationConfig => {
  const query = gql`
    query($idJiraIntegrationConfig: UUID!) {
      jiraIntegrationConfig(idJiraIntegrationConfig: $idJiraIntegrationConfig) {
        ...JiraIntegrationConfigFragment
      }
    }
    ${jiraIntegrationConfigFragment}
  `;

  const variables = { idJiraIntegrationConfig };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  const jiraIntegrationConfig = get(data, 'data.jiraIntegrationConfig', null);

  if (!jiraIntegrationConfig || jiraIntegrationConfig.deletedAt) {
    return null;
  }

  return jiraIntegrationConfig;
};

const deleteJiraIntegrationConfig = idJiraIntegrationConfig =>
  updateJiraIntegrationConfig(idJiraIntegrationConfig, { deletedAt: new Date().toJSON() });

module.exports = {
  createJiraIntegrationConfig: wrapper(createJiraIntegrationConfig),
  updateJiraIntegrationConfig: wrapper(updateJiraIntegrationConfig),
  deleteJiraIntegrationConfig: wrapper(deleteJiraIntegrationConfig),
  getJiraIntegrationConfigs: wrapper(getJiraIntegrationConfigs),
  findJiraIntegrationConfig: wrapper(findJiraIntegrationConfig)
};
