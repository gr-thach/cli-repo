import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as EngineConfigsController from '../../controllers/engineConfigs';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.CUSTOM_CONFIG),
  EngineConfigsController.list
);

router.post(
  '/:engineId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.CUSTOM_CONFIG),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      engineId: Joi.number()
        .integer()
        .required()
    }),
    [Segments.BODY]: Joi.object({
      rules: Joi.string()
        .allow('')
        .optional(),
      envVars: Joi.object({
        ignoreGuardRailsRules: Joi.boolean(),
        disableCustomRules: Joi.boolean()
      }).optional()
    }),
    [Segments.QUERY]: Joi.object({
      configSpecId: Joi.string().required(),
      ...validateAccountId
    })
  }),
  EngineConfigsController.create
);

router.patch(
  '/:engineId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.CUSTOM_CONFIG),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      engineId: Joi.number()
        .integer()
        .required()
    }),
    [Segments.BODY]: Joi.object({
      rules: Joi.string()
        .allow('')
        .optional(),
      envVars: Joi.object({
        ignoreGuardRailsRules: Joi.boolean(),
        disableCustomRules: Joi.boolean()
      }).optional()
    }),
    [Segments.QUERY]: Joi.object({
      configSpecId: Joi.string().required(),
      engineConfigId: Joi.string().required(),
      ...validateAccountId
    })
  }),
  EngineConfigsController.update
);

export default router;
