import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { EMAIL_REGEXP } from '../../helpers/common';

const SamlProviderController = require('../../controllers/samlProvider');

const router = Router();

/**
 * @swagger
 *
 * /v2/saml/providers:
 *   get:
 *     tags:
 *       - Saml Provider
 *     summary: get saml provider for account
 *     description: Get saml provider
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: idAccount
 *         in: query
 *         type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: saml provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/samlProvider'
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.SAML),
  SamlProviderController.getByAccountId
);

/**
 * @swagger
 *
 * /v2/saml/providers:
 *   post:
 *     tags:
 *       - Saml Provider
 *     summary: create saml provider for account
 *     description: Create saml provider
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: idAccount
 *         in: body
 *         type: integer
 *         example: { "idAccount": 9}
 *         required: true
 *       - name: enabled
 *         in: body
 *         type: boolean
 *     responses:
 *       200:
 *         description: saml provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/samlProvider'
 */
router.post(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SAML),
  SamlProviderController.create
);

/**
 * @swagger
 *
 * /v2/saml/providers/{idSamlProvider}:
 *   patch:
 *     tags:
 *       - Saml Provider
 *     summary: Patch saml provider
 *     description: Patch saml provider
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - in: path
 *         name: idSamlProvider
 *         description: id of the saml provider
 *         type: string
 *         required: true
 *         example: 60dbb7f7-bb0f-4760-aafb-3cb76efe9bec
 *       - name: entryPoint
 *         in: body
 *         type: string
 *         required: true
 *       - name: cert
 *         in: body
 *         type: string
 *         required: true
 *       - name: contactEmail
 *         in: body
 *         type: string
 *         required: true
 *       - name: enabled
 *         in: body
 *         type: boolean
 *         required: true
 *     responses:
 *       200:
 *         description: saml provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/samlProvider'
 */
router.patch(
  '/:idSamlProvider',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SAML),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      idSamlProvider: Joi.string().required()
    }),
    [Segments.BODY]: Joi.object({
      entryPoint: Joi.string().required(),
      cert: Joi.string().required(),
      contactEmail: Joi.string()
        .email()
        .regex(EMAIL_REGEXP)
        .required(),
      enabled: Joi.boolean().required()
    })
  }),
  SamlProviderController.patch
);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      samlProvider:
 *       type: object
 *       properties:
 *        idSamlProvider:
 *          type: string
 *          require: true
 *        idAccount:
 *          type: integer
 *        entryPoint:
 *          type: string
 *        cert:
 *          type: string
 *        contactEmail:
 *          type: string
 *        enabled:
 *          type: boolean
 *        gitProvider:
 *          type: string
 *          enum:
 *            - GITHUB
 *            - GITLAB
 *            - BITBUCKET
 *            - BITBUCKET_DATA_CENTER
 *
 */

module.exports = router;
