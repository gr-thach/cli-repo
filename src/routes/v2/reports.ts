import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as ReportsController from '../../controllers/reports';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.REPORTS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      resource: Joi.string().required(),
      repositoryId: Joi.number()
        .integer()
        .greater(0),
      branch: Joi.string(),
      days: Joi.number(),
      ...validateAccountId
    })
  }),
  ReportsController.find
);

export default router;
