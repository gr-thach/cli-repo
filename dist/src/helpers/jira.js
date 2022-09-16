"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const { findJiraRepositoryConfigsByJiraIntegrationId } = require('./core-api/jiraRepositoryConfigs');
const { aesEncrypt, aesDecrypt } = require('./common');
const { env } = require('../../config');
const { getRepositoryById } = require('./core-api/repositories');
const assertIsAllowedToDelete = async (idJiraIntegrationConfig) => {
    const jiraRepositoryConfigs = await findJiraRepositoryConfigsByJiraIntegrationId(idJiraIntegrationConfig);
    if (jiraRepositoryConfigs.length > 0) {
        const repoNames = await Promise.all(jiraRepositoryConfigs.map(async (jiraRepositoryConfig) => {
            const repo = await getRepositoryById(jiraRepositoryConfig.idRepository);
            return repo ? repo.name : 'unknown repository';
        }));
        throw boom_1.default.badRequest(`Unable to delete jira integration config. This config is used by jira configs stored on repositories ${repoNames.join(',')}.`);
    }
};
const decryptPassword = password => aesDecrypt(password, env.GUARDRAILS_JIRA_TOKENS_SECRET);
const encryptPassword = password => aesEncrypt(password, env.GUARDRAILS_JIRA_TOKENS_SECRET);
const isValidProjectId = (jiraProjects, jiraProjectId) => jiraProjects.some(project => project.id === jiraProjectId);
const isValidIssueTypeId = (jiraIssueTypes, jiraIssueTypeId) => jiraIssueTypes.some(issueType => issueType.id === jiraIssueTypeId);
const formatIntegrationConfigResponse = jiraIntegrationConfig => {
    const { idJiraIntegrationConfig, idAccount, webUrl, apiUrl, username } = jiraIntegrationConfig;
    return {
        idJiraIntegrationConfig,
        idAccount,
        webUrl,
        apiUrl,
        username
    };
};
const formatIntegrationConfigsResponse = jiraIntegrationConfig => {
    return jiraIntegrationConfig.map(formatIntegrationConfigResponse);
};
const formatRepositoryConfigResponse = jiraRepositoryConfig => {
    const { idJiraRepositoryConfig, idJiraIntegrationConfig, idRepository, externalProjectId, externalIssueTypeId } = jiraRepositoryConfig;
    return {
        idJiraRepositoryConfig,
        idJiraIntegrationConfig,
        idRepository,
        externalProjectId,
        externalIssueTypeId
    };
};
const formatJiraProjectResponse = jiraProject => {
    const { id, name } = jiraProject;
    return {
        id,
        name
    };
};
const formatJiraProjectsResponse = jiraProjects => {
    return jiraProjects.map(formatJiraProjectResponse);
};
const formatJiraIssueTypeResponse = jiraIssueType => {
    const { id, name } = jiraIssueType;
    return {
        id,
        name
    };
};
const formatJiraIssueResponse = (jiraIssue, jiraIntegrationConfig) => {
    const { idJiraIssue, idFinding, externalId, externalKey } = jiraIssue;
    return {
        idJiraIssue,
        idFinding,
        externalId,
        externalKey,
        link: `${jiraIntegrationConfig.webUrl}/browse/${externalKey}`
    };
};
const formatJiraIssueTypesResponse = jiraIssueTypes => {
    return jiraIssueTypes.map(formatJiraIssueTypeResponse);
};
module.exports = {
    formatIntegrationConfigResponse,
    formatIntegrationConfigsResponse,
    formatRepositoryConfigResponse,
    formatJiraProjectsResponse,
    formatJiraIssueTypesResponse,
    formatJiraIssueResponse,
    isValidProjectId,
    isValidIssueTypeId,
    assertIsAllowedToDelete,
    encryptPassword,
    decryptPassword
};
//# sourceMappingURL=jira.js.map