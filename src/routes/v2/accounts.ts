import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as AccountsController from '../../controllers/accounts';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 *
 * /v2/accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     summary: get the list of the user accounts
 *     description: Get user's accounts
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *         example: Bearer {yourJwtToken}
 *     responses:
 *       200:
 *         description: accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/account'
 */
router.get('/', AccountsController.list);

/**
 * @swagger
 *
 * /v2/accounts/configuration:
 *   patch:
 *     tags:
 *       - Accounts
 *     summary: update an account configuration
 *     description: Patch an account configuration
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         in: query
 *         type: integer
 *         example: 9
 *         required: true
 *       - name: configuration
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/configuration'
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns an empty body with status code 200
 */
router.patch(
  '/configuration',
  permissionsMiddleware(PermissionAction.WRITE, Resource.CUSTOM_CONFIG),
  celebrate({
    [Segments.BODY]: Joi.object({
      configuration: Joi.alternatives(Joi.string(), Joi.object()).required()
    })
  }),
  AccountsController.config
);

/**
 * @swagger
 *
 * /v2/accounts:
 *   patch:
 *     tags:
 *       - Accounts
 *     summary: update an account
 *     description: Patch an account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         in: query
 *         type: integer
 *         example: 9
 *         required: true
 *       - name: filterReposByWriteAccess
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/account'
 *       - name: findingConfiguration
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/account'
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns the updated account
 */
router.patch(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACCOUNTS),
  celebrate({
    [Segments.BODY]: Joi.object({
      filterReposByWriteAccess: Joi.boolean(),
      findingConfiguration: Joi.object({
        requireApprovalOnUpdate: Joi.boolean()
      })
    })
  }),
  AccountsController.update
);

/**
 * @swagger
 *
 * /v2/accounts:
 *   delete:
 *     tags:
 *       - Accounts
 *     summary: delete an account
 *     description: Delete an account given its id.
 *     content:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: accountId
 *         description: id of the account to delete
 *         in: query
 *         type: integer
 *         required: true
 *         example: 42
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Returns an empty response body with status code 200
 */
router.delete(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.ACCOUNTS),
  AccountsController.destroy
);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      configuration:
 *        type: object
 *        properties:
 *          bundles:
 *            oneOf:
 *              - type: string
 *                example: "auto"
 *              - type: array
 *                example: [ { javascript: [ "eslint", "retirejs"]}]
 *                items:
 *                  type: object
 *                  properties:
 *                    lang:
 *                      type: array
 *                      items:
 *                        type: string
 *                        example: "eslint"
 *          ignore:
 *            type: string
 *            example: path/to/ignored/file
 *          notifications:
 *            type: object
 *            properties:
 *              slack:
 *                type: object
 *                properties:
 *                  enabled:
 *                    type: boolean
 *                    example: true
 *          report:
 *            type: object
 *            properties:
 *              pullRequest:
 *                type: object
 *                properties:
 *                  comment:
 *                    type: boolean
 *                  findings:
 *                    type: string
 *      account:
 *       type: object
 *       properties:
 *        idAccount:
 *          type: integer
 *          require: true
 *        login:
 *          type: string
 *        type:
 *          type: string
 *          enum:
 *            - USER
 *            - ORGANIZATION
 *        provider:
 *          type: string
 *          enum:
 *            - GITHUB
 *            - GITLAB
 *            - BITBUCKET
 *            - BITBUCKET_DATA_CENTER
 *        providerInternalId:
 *          type: string
 *        installationId:
 *          type: integer
 *        cliToken:
 *          type: string
 *        filterReposByWriteAccess:
 *          type: boolean
 *        findingConfiguration:
 *          type: object
 *          properties:
 *            comment:
 *              type: boolean
 *        usersSynchronized:
 *          type: boolean
 *        configuration:
 *          schema:
 *            $ref: '#/components/schemas/configuration'
 *        avatar_url:
 *            type: string
 *        url:
 *            type: string
 *        kind:
 *            type: string
 *        email:
 *            type: string
 *        state:
 *            type: string
 *        organization:
 *            type: string
 *        gitMetadata:
 *            type: object
 *
 */

export default router;
