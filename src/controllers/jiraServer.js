import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';
import { validateUUIDParams } from '../helpers/common';

const { findJiraIntegrationConfig } = require('../helpers/core-api/jiraIntegrationConfigs');
const {
  findJiraRepositoryConfigByRepositoryId
} = require('../helpers/core-api/jiraRepositoryConfigs');
const { createJiraIssue, findJiraIssueByFinding } = require('../helpers/core-api/jiraIssues');
const { getRepositoryById } = require('../helpers/core-api/repositories');
const { getFindingById } = require('../helpers/core-api/findings');
const {
  formatJiraProjectsResponse,
  formatJiraIssueTypesResponse,
  formatJiraIssueResponse,
  decryptPassword
} = require('../helpers/jira');
const { getFindingLinks } = require('../helpers/findingLinks');
const JiraService = require('../services/jira');
const createFindingSummary = require('../templates/jira/summary');
const createFindingDescription = require('../templates/jira/description');

const testJiraConnection = async (req, res) => {
  const {
    query: { idJiraIntegrationConfig },
    account
  } = req;

  validateUUIDParams({ idJiraIntegrationConfig });

  const jiraIntegrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
  if (!jiraIntegrationConfig) {
    throw boom.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
  }

  if (jiraIntegrationConfig.idAccount !== account.idAccount) {
    throw boom.badRequest(
      `The jira integration config with id ${idJiraIntegrationConfig} doesn't belong to the account with id ${account.idAccount}`
    );
  }

  const jiraService = new JiraService(
    jiraIntegrationConfig.apiUrl,
    jiraIntegrationConfig.username,
    decryptPassword(jiraIntegrationConfig.password)
  );

  await jiraService.testConnection();

  return res.status(204).send();
};

const listProjects = async (req, res) => {
  const {
    query: { idJiraIntegrationConfig },
    account
  } = req;

  validateUUIDParams({ idJiraIntegrationConfig });

  const jiraIntegrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
  if (!jiraIntegrationConfig) {
    throw boom.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
  }

  if (jiraIntegrationConfig.idAccount !== account.idAccount) {
    throw boom.badRequest(
      `The jira integration config with id ${idJiraIntegrationConfig} doesn't belong to the account with id ${account.idAccount}`
    );
  }

  const jiraService = new JiraService(
    jiraIntegrationConfig.apiUrl,
    jiraIntegrationConfig.username,
    decryptPassword(jiraIntegrationConfig.password)
  );

  const projects = await jiraService.getProjects();

  return res.status(200).send(formatJiraProjectsResponse(projects));
};

const listIssueTypes = async (req, res) => {
  const {
    query: { idJiraIntegrationConfig, externalProjectId },
    account
  } = req;

  validateUUIDParams({ idJiraIntegrationConfig });

  const jiraIntegrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
  if (!jiraIntegrationConfig) {
    throw boom.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
  }

  if (jiraIntegrationConfig.idAccount !== account.idAccount) {
    throw boom.badRequest(
      `The jira integration config with id ${idJiraIntegrationConfig} doesn't belong to the account with id ${account.idAccount}`
    );
  }

  const jiraService = new JiraService(
    jiraIntegrationConfig.apiUrl,
    jiraIntegrationConfig.username,
    decryptPassword(jiraIntegrationConfig.password)
  );

  const issueTypes = await jiraService.getIssueTypes(externalProjectId);

  return res.status(200).send(formatJiraIssueTypesResponse(issueTypes));
};

const createIssue = async (req, res) => {
  const {
    body: { findingId, scanId },
    permission
  } = req;

  const finding = await getFindingById(findingId);
  if (!finding) {
    throw boom.notFound(`Finding with id '${findingId}' doesn't exist.`);
  }

  const { idRepository } = finding.repository;

  permission.repositoriesEnforce(idRepository);

  const jiraRepositoryConfig = await findJiraRepositoryConfigByRepositoryId(idRepository);
  if (!jiraRepositoryConfig) {
    throw boom.notFound('No jira configuration found for this repository.');
  }

  const jiraIntegrationConfig = await findJiraIntegrationConfig(
    jiraRepositoryConfig.idJiraIntegrationConfig
  );

  const existingJiraIssue = await findJiraIssueByFinding(finding.idFinding);
  if (existingJiraIssue) {
    throw boom.badRequest('A Jira issue has already been created for this finding.');
  }

  const repository = await getRepositoryById(idRepository);
  if (!repository) {
    throw boom.notFound('Repository Not Found');
  }

  const { dashboardLink, providerCodeLink } = await getFindingLinks(finding, scanId);

  const summary = createFindingSummary({ finding, repository });
  const description = createFindingDescription({
    repository,
    finding,
    dashboardLink,
    providerCodeLink
  });

  const jiraService = new JiraService(
    jiraIntegrationConfig.apiUrl,
    jiraIntegrationConfig.username,
    decryptPassword(jiraIntegrationConfig.password)
  );

  const issue = await jiraService.createIssue(
    summary,
    description,
    jiraRepositoryConfig.externalProjectId,
    jiraRepositoryConfig.externalIssueTypeId
  );

  const createdIssue = await createJiraIssue({
    idJiraIssue: uuid(),
    fkFinding: finding.idFinding,
    fkRepository: idRepository,
    externalId: issue.id,
    externalKey: issue.key
  });

  return res.status(200).send(formatJiraIssueResponse(createdIssue, jiraIntegrationConfig));
};

module.exports = {
  listProjects,
  listIssueTypes,
  createIssue,
  testJiraConnection
};
