import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';
import { validateUUIDParams } from '../helpers/common';

const {
  createJiraIntegrationConfig,
  updateJiraIntegrationConfig,
  getJiraIntegrationConfigs,
  deleteJiraIntegrationConfig,
  findJiraIntegrationConfig
} = require('../helpers/core-api/jiraIntegrationConfigs');
const {
  formatIntegrationConfigResponse,
  formatIntegrationConfigsResponse,
  assertIsAllowedToDelete,
  encryptPassword
} = require('../helpers/jira');
const JiraService = require('../services/jira');

const createIntegrationConfig = async (req, res) => {
  const {
    body: { webUrl, apiUrl, username, password },
    account
  } = req;

  try {
    JiraService.validateUrl(apiUrl);
  } catch (err) {
    throw boom.badRequest(`Invalid api url. ${err.message}`);
  }

  try {
    JiraService.validateUrl(webUrl);
  } catch (err) {
    throw boom.badRequest(`Invalid web url. ${err.message}`);
  }

  const createdJiraIntegrationConfig = await createJiraIntegrationConfig({
    idJiraIntegrationConfig: uuid(),
    fkAccount: account.idAccount,
    webUrl,
    apiUrl,
    username,
    password: encryptPassword(password)
  });

  return res.status(200).send(formatIntegrationConfigResponse(createdJiraIntegrationConfig));
};

const patchIntegrationConfig = async (req, res) => {
  const {
    params: { idJiraIntegrationConfig },
    body: { webUrl, apiUrl, username, password },
    account
  } = req;

  validateUUIDParams({ idJiraIntegrationConfig });

  try {
    JiraService.validateUrl(apiUrl);
  } catch (err) {
    throw boom.badRequest(`Invalid api url. ${err.message}`);
  }

  try {
    JiraService.validateUrl(webUrl);
  } catch (err) {
    throw boom.badRequest(`Invalid web url. ${err.message}`);
  }

  const integrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
  if (!integrationConfig) {
    throw boom.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
  }

  if (integrationConfig.idAccount !== account.idAccount) {
    throw boom.badRequest(
      `The jira integration config with id ${idJiraIntegrationConfig} doesn't belong to the account with id ${account.idAccount}`
    );
  }

  const patchedConfig = await updateJiraIntegrationConfig(idJiraIntegrationConfig, {
    webUrl,
    apiUrl,
    username,
    password: encryptPassword(password)
  });

  return res.status(200).send(formatIntegrationConfigResponse(patchedConfig));
};

const deleteIntegrationConfig = async (req, res) => {
  const {
    params: { idJiraIntegrationConfig },
    account
  } = req;

  validateUUIDParams({ idJiraIntegrationConfig });

  const integrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
  if (!integrationConfig) {
    throw boom.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
  }

  if (integrationConfig.idAccount !== account.idAccount) {
    throw boom.badRequest(
      `The integration config doesn't belong to the account with id ${account.idAccount}`
    );
  }

  await assertIsAllowedToDelete(idJiraIntegrationConfig);

  await deleteJiraIntegrationConfig(idJiraIntegrationConfig);

  return res.status(204).send();
};

const listIntegrationConfigs = async (req, res) => {
  const { account } = req;

  const integrationConfigs = await getJiraIntegrationConfigs(account.idAccount);

  return res.status(200).send(formatIntegrationConfigsResponse(integrationConfigs));
};

module.exports = {
  createIntegrationConfig,
  patchIntegrationConfig,
  listIntegrationConfigs,
  deleteIntegrationConfig
};
