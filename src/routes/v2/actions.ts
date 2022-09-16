import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as ActionsController from '../../controllers/actions';
import { ActionStatus, PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.ACTIONS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required(),
      ...validateAccountId
    })
  }),
  ActionsController.list
);

router.get(
  '/count',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      status: Joi.string()
        .required()
        .valid(...Object.values(ActionStatus)),
      ...validateAccountId
    })
  }),
  ActionsController.getActionsCount
);

router.get(
  '/filters',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  ActionsController.getActionFilters
);

router.get(
  '/groupedByRules',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  ActionsController.getActionsGroupedByRules
);

router.get(
  '/:ruleId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  ActionsController.getActionsByRule
);

router.delete(
  '/:actionId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      actionId: Joi.number()
        .integer()
        .required()
    })
  }),
  ActionsController.destroy
);

router.patch(
  '/bulk',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  ActionsController.bulkUpdatePendingActions
);

router.patch(
  '/:actionId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACTIONS, false),
  ActionsController.updatePendingAction
);

export default router;
