import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const JiraIntegrationConfigController = require('../../controllers/jiraIntegrationConfig');
const JiraRepositoryConfigController = require('../../controllers/jiraRepositoryConfig');
const JiraServerController = require('../../controllers/jiraServer');

const integrationConfig = celebrate({
  [Segments.BODY]: Joi.object({
    webUrl: Joi.string().required(),
    apiUrl: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required()
  })
});

const router = Router();

router.get(
  '/integration-configs',
  permissionsMiddleware(PermissionAction.READ, Resource.JIRA_CONFIG),
  JiraIntegrationConfigController.listIntegrationConfigs
);
router.post(
  '/integration-configs',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG),
  integrationConfig,
  JiraIntegrationConfigController.createIntegrationConfig
);
router.patch(
  '/integration-configs/:idJiraIntegrationConfig',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG),
  integrationConfig,
  JiraIntegrationConfigController.patchIntegrationConfig
);
router.delete(
  '/integration-configs/:idJiraIntegrationConfig',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG),
  JiraIntegrationConfigController.deleteIntegrationConfig
);

router.get(
  '/repository-config',
  permissionsMiddleware(PermissionAction.READ, Resource.JIRA_CONFIG, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required(),
      accountId: Joi.number()
        .integer()
        .required()
    })
  }),
  JiraRepositoryConfigController.getRepositoryConfig
);
router.post(
  '/repository-config',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      idJiraIntegrationConfig: Joi.string().required(),
      idRepository: Joi.number()
        .integer()
        .required(),
      externalProjectId: Joi.string().required(),
      externalIssueTypeId: Joi.string().required()
    })
  }),
  JiraRepositoryConfigController.createRepositoryConfig
);
router.patch(
  '/repository-config/:idJiraRepositoryConfig',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      idJiraIntegrationConfig: Joi.string().required(),
      externalProjectId: Joi.string().required(),
      externalIssueTypeId: Joi.string().required()
    })
  }),
  JiraRepositoryConfigController.patchRepositoryConfig
);
router.delete(
  '/repository-config/:idJiraRepositoryConfig',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG, false),
  JiraRepositoryConfigController.deleteRepositoryConfig
);

router.get(
  '/projects',
  permissionsMiddleware(PermissionAction.READ, Resource.JIRA_CONFIG),
  celebrate({
    [Segments.QUERY]: Joi.object({
      idJiraIntegrationConfig: Joi.string().required(),
      ...validateAccountId
    })
  }),
  JiraServerController.listProjects
);
router.get(
  '/issue-types',
  permissionsMiddleware(PermissionAction.READ, Resource.JIRA_CONFIG),
  celebrate({
    [Segments.QUERY]: Joi.object({
      idJiraIntegrationConfig: Joi.string().required(),
      externalProjectId: Joi.number()
        .integer()
        .required(),
      ...validateAccountId
    })
  }),
  JiraServerController.listIssueTypes
);
router.post(
  '/issues',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      findingId: Joi.string().required(),
      scanId: Joi.string()
    })
  }),
  JiraServerController.createIssue
);
router.get(
  '/test-connection',
  permissionsMiddleware(PermissionAction.WRITE, Resource.JIRA_CONFIG),
  celebrate({
    [Segments.QUERY]: Joi.object({
      idJiraIntegrationConfig: Joi.string().required(),
      ...validateAccountId
    })
  }),
  JiraServerController.testJiraConnection
);

module.exports = router;
