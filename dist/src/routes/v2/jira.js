"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const validations_1 = require("../../helpers/validations");
const JiraIntegrationConfigController = require('../../controllers/jiraIntegrationConfig');
const JiraRepositoryConfigController = require('../../controllers/jiraRepositoryConfig');
const JiraServerController = require('../../controllers/jiraServer');
const integrationConfig = (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        webUrl: celebrate_1.Joi.string().required(),
        apiUrl: celebrate_1.Joi.string().required(),
        username: celebrate_1.Joi.string().required(),
        password: celebrate_1.Joi.string().required()
    })
});
const router = (0, express_1.Router)();
router.get('/integration-configs', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.JIRA_CONFIG), JiraIntegrationConfigController.listIntegrationConfigs);
router.post('/integration-configs', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG), integrationConfig, JiraIntegrationConfigController.createIntegrationConfig);
router.patch('/integration-configs/:idJiraIntegrationConfig', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG), integrationConfig, JiraIntegrationConfigController.patchIntegrationConfig);
router.delete('/integration-configs/:idJiraIntegrationConfig', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG), JiraIntegrationConfigController.deleteIntegrationConfig);
router.get('/repository-config', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.JIRA_CONFIG, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        repositoryId: celebrate_1.Joi.number()
            .integer()
            .required(),
        accountId: celebrate_1.Joi.number()
            .integer()
            .required()
    })
}), JiraRepositoryConfigController.getRepositoryConfig);
router.post('/repository-config', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        idJiraIntegrationConfig: celebrate_1.Joi.string().required(),
        idRepository: celebrate_1.Joi.number()
            .integer()
            .required(),
        externalProjectId: celebrate_1.Joi.string().required(),
        externalIssueTypeId: celebrate_1.Joi.string().required()
    })
}), JiraRepositoryConfigController.createRepositoryConfig);
router.patch('/repository-config/:idJiraRepositoryConfig', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        idJiraIntegrationConfig: celebrate_1.Joi.string().required(),
        externalProjectId: celebrate_1.Joi.string().required(),
        externalIssueTypeId: celebrate_1.Joi.string().required()
    })
}), JiraRepositoryConfigController.patchRepositoryConfig);
router.delete('/repository-config/:idJiraRepositoryConfig', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG, false), JiraRepositoryConfigController.deleteRepositoryConfig);
router.get('/projects', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.JIRA_CONFIG), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        idJiraIntegrationConfig: celebrate_1.Joi.string().required(),
        ...validations_1.validateAccountId
    })
}), JiraServerController.listProjects);
router.get('/issue-types', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.JIRA_CONFIG), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        idJiraIntegrationConfig: celebrate_1.Joi.string().required(),
        externalProjectId: celebrate_1.Joi.number()
            .integer()
            .required(),
        ...validations_1.validateAccountId
    })
}), JiraServerController.listIssueTypes);
router.post('/issues', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        findingId: celebrate_1.Joi.string().required(),
        scanId: celebrate_1.Joi.string()
    })
}), JiraServerController.createIssue);
router.get('/test-connection', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.JIRA_CONFIG), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        idJiraIntegrationConfig: celebrate_1.Joi.string().required(),
        ...validations_1.validateAccountId
    })
}), JiraServerController.testJiraConnection);
module.exports = router;
//# sourceMappingURL=jira.js.map