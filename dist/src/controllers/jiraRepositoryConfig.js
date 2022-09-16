"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const uuid_1 = require("uuid");
const common_1 = require("../helpers/common");
const { findJiraIntegrationConfig } = require('../helpers/core-api/jiraIntegrationConfigs');
const { createJiraRepositoryConfig, updateJiraRepositoryConfig, findJiraRepositoryConfig, deleteJiraRepositoryConfig, findJiraRepositoryConfigByRepositoryId } = require('../helpers/core-api/jiraRepositoryConfigs');
const JiraService = require('../services/jira');
const { getRepositoryById } = require('../helpers/core-api/repositories');
const { formatRepositoryConfigResponse, isValidProjectId, isValidIssueTypeId, decryptPassword } = require('../helpers/jira');
const createRepositoryConfig = async (req, res) => {
    const { body: { idJiraIntegrationConfig, idRepository, externalProjectId, externalIssueTypeId }, permission } = req;
    (0, common_1.validateUUIDParams)({ idJiraIntegrationConfig });
    permission.repositoriesEnforce(Number(idRepository));
    const jiraIntegrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
    if (!jiraIntegrationConfig) {
        throw boom_1.default.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
    }
    const repository = await getRepositoryById(Number(idRepository), true);
    if (repository.fkAccount !== jiraIntegrationConfig.idAccount) {
        throw boom_1.default.badRequest('The jira integration config and the jira repository config must be on the same account');
    }
    const existingJiraRepositoryConfig = await findJiraRepositoryConfigByRepositoryId(idRepository);
    if (existingJiraRepositoryConfig) {
        throw boom_1.default.badRequest('A jira repository config already exist on the repository.');
    }
    const jiraService = new JiraService(jiraIntegrationConfig.apiUrl, jiraIntegrationConfig.username, decryptPassword(jiraIntegrationConfig.password));
    const projects = await jiraService.getProjects();
    if (!isValidProjectId(projects, externalProjectId)) {
        throw boom_1.default.badRequest('Invalid jira project id. Project id was not found.');
    }
    const issueTypes = await jiraService.getIssueTypes(externalProjectId);
    if (!isValidIssueTypeId(issueTypes, externalIssueTypeId)) {
        throw boom_1.default.badRequest('Invalid jira issue type id. Issue type id was not found.');
    }
    const createdConfig = await createJiraRepositoryConfig({
        idJiraRepositoryConfig: (0, uuid_1.v4)(),
        fkJiraIntegrationConfig: idJiraIntegrationConfig,
        fkRepository: parseInt(idRepository, 10),
        externalProjectId,
        externalIssueTypeId
    });
    return res.status(200).send(formatRepositoryConfigResponse(createdConfig));
};
const patchRepositoryConfig = async (req, res) => {
    const { params: { idJiraRepositoryConfig }, body: { idJiraIntegrationConfig, externalProjectId, externalIssueTypeId }, permission, account } = req;
    (0, common_1.validateUUIDParams)({ idJiraRepositoryConfig, idJiraIntegrationConfig });
    const jiraRepositoryConfig = await findJiraRepositoryConfig(idJiraRepositoryConfig);
    if (!jiraRepositoryConfig) {
        throw boom_1.default.notFound(`No jira repository config found with the id ${idJiraRepositoryConfig}.`);
    }
    permission.repositoriesEnforce(jiraRepositoryConfig.idRepository);
    const jiraIntegrationConfig = await findJiraIntegrationConfig(idJiraIntegrationConfig);
    if (!jiraIntegrationConfig) {
        throw boom_1.default.notFound(`No jira integration found with the id ${idJiraIntegrationConfig}.`);
    }
    if (jiraIntegrationConfig.idAccount !== account.idAccount) {
        throw boom_1.default.badRequest(`The jira integration config with id ${idJiraIntegrationConfig} doesn't belong to the account with id ${account.idAccount}`);
    }
    const repository = await getRepositoryById(jiraRepositoryConfig.idRepository, true);
    if (!repository) {
        throw boom_1.default.notFound(`No repository exist with id ${jiraRepositoryConfig.idRepository}.`);
    }
    if (repository.fkAccount !== jiraIntegrationConfig.idAccount) {
        throw boom_1.default.badRequest('The jira integration config and the jira repository config must be on the same account');
    }
    const jiraService = new JiraService(jiraIntegrationConfig.apiUrl, jiraIntegrationConfig.username, decryptPassword(jiraIntegrationConfig.password));
    const projects = await jiraService.getProjects();
    if (!isValidProjectId(projects, externalProjectId)) {
        throw boom_1.default.badRequest('Invalid jira project id. Project id was not found.');
    }
    const issueTypes = await jiraService.getIssueTypes(externalProjectId);
    if (!isValidIssueTypeId(issueTypes, externalIssueTypeId)) {
        throw boom_1.default.badRequest('Invalid jira issue type id. Issue type id was not found.');
    }
    const updatedConfig = await updateJiraRepositoryConfig(idJiraRepositoryConfig, {
        fkJiraIntegrationConfig: idJiraIntegrationConfig,
        externalProjectId,
        externalIssueTypeId
    });
    return res.status(200).send(formatRepositoryConfigResponse(updatedConfig));
};
const deleteRepositoryConfig = async (req, res) => {
    const { params: { idJiraRepositoryConfig }, permission } = req;
    (0, common_1.validateUUIDParams)({ idJiraRepositoryConfig });
    const jiraRepositoryConfig = await findJiraRepositoryConfig(idJiraRepositoryConfig);
    if (!jiraRepositoryConfig) {
        throw boom_1.default.notFound(`No jira repository config found with the id ${idJiraRepositoryConfig}.`);
    }
    permission.repositoriesEnforce(jiraRepositoryConfig.idRepository);
    const repository = await getRepositoryById(jiraRepositoryConfig.idRepository, true);
    if (!repository) {
        throw boom_1.default.notFound(`No repository exist with id ${jiraRepositoryConfig.idRepository}.`);
    }
    await deleteJiraRepositoryConfig(idJiraRepositoryConfig);
    return res.status(204).send();
};
const getRepositoryConfig = async (req, res) => {
    const { query: { repositoryId }, permission } = req;
    permission.repositoriesEnforce(Number(repositoryId));
    const repository = await getRepositoryById(Number(repositoryId), true);
    if (!repository) {
        throw boom_1.default.notFound(`No repository exist with id ${repositoryId}.`);
    }
    const jiraRepositoryConfig = await findJiraRepositoryConfigByRepositoryId(Number(repositoryId));
    if (!jiraRepositoryConfig) {
        throw boom_1.default.notFound('Jira repository config not found.');
    }
    return res.status(200).send(formatRepositoryConfigResponse(jiraRepositoryConfig));
};
module.exports = {
    createRepositoryConfig,
    patchRepositoryConfig,
    deleteRepositoryConfig,
    getRepositoryConfig
};
//# sourceMappingURL=jiraRepositoryConfig.js.map