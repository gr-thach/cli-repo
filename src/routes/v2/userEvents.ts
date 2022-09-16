import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as UserEventsController from '../../controllers/userEvents';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

/**
 * @swagger
 *
 * /v2/userEvents/uniqueUsersInPeriod:
 *   get:
 *     tags:
 *       - UserEvents
 *     summary: returns list of unique users events
 *     description: returns a list of unique users that had an event that could trigger a scan on GuardRails in the provided period
 *     content:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         type: integer
 *         example: 1
 *         required: true
 *       - name: from
 *         in: query
 *         type: string
 *         example: '2022-06-15T10:24:24.084Z'
 *         required: true
 *         description: Start date of period
 *       - name: to
 *         in: query
 *         type: string
 *         example: '2022-06-15T10:24:24.084Z'
 *         required: true
 *         description: End date of period
 *     responses:
 *       200:
 *         description: Returns the list of unique users in the provided period
 */
router.get(
  '/uniqueUsersInPeriod',
  permissionsMiddleware(PermissionAction.READ, Resource.USER_EVENTS),
  celebrate({
    [Segments.QUERY]: Joi.object({
      from: Joi.string().required(),
      to: Joi.string().required(),
      ...validateAccountId
    })
  }),
  UserEventsController.getUniqueUsersInPeriod
);

export default router;
