import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as ActionChangeLogsController from '../../controllers/actionChangeLogs';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

/**
 * @swagger
 *
 * /v2/action-changelogs:
 *   get:
 *     tags:
 *       - ActionChangeLogs
 *     summary: get list of change logs for a given action
 *     description: Get action change logs
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         in: query
 *         type: integer
 *         example: 9
 *         required: true
 *       - name: actionId
 *         in: query
 *         type: integer
 *         example: 42
 *         required: true
 *         description: id of the action to get change logs for
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: actionChangeLogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/actionChangeLog'
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.ACTIONS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      actionId: Joi.number().required(),
      ...validateAccountId
    })
  }),
  ActionChangeLogsController.list
);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      actionChangeLog:
 *       type: object
 *       properties:
 *        idActionChangeLog:
 *          type: integer
 *        type:
 *          type: string
 *          enum:
 *            - ACTION_CREATED
 *            - ACTION_UPDATED
 *            - ACTION_DELETED
 *        fromStatus:
 *          type: string
 *          enum:
 *            - WONT_FIX
 *            - FALSE_POSITIVE
 *            - MARK_AS_FIXED
 *            - MARK_AS_VULNERABILITY
 *        toStatus:
 *          type: string
 *          enum:
 *            - FALSE_POSITIVE
 *            - WONT_FIX
 *            - MARK_AS_FIXED
 *            - MARK_AS_VULNERABILITY
 *        createdAt:
 *          type: date
 *          example: 2020-02-25T05:28:36.134+00:00
 *        user:
 *          schema:
 *            $ref: '#/components/schemas/actionChangeLogUser'
 *      actionChangeLogUser:
 *        type: object
 *        properties:
 *          login:
 *            type: string
 *            example: john-doe
 *
 */
export default router;
