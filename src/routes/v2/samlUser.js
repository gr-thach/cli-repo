import { Router } from 'express';

const SamlUserController = require('../../controllers/samlUser');

const router = Router();

/**
 * @swagger
 *
 * /v2/saml/user:
 *   get:
 *     tags:
 *       - Saml User
 *     summary: get saml user
 *     description: Get saml user associated with the saml jwt token
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: cookie
 *         name: gr.auth.token
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: saml user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/samlUser'
 */
router.get('/', SamlUserController.get);

/**
 * @swagger
 *
 * /v2/saml/user/provider:
 *   get:
 *     tags:
 *       - Saml User
 *     summary: get saml provider for saml user
 *     description: Get saml provider associated with saml user
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: cookie
 *         name: gr.auth.token
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: saml provider
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/samlProvider'
 */
router.get('/provider', SamlUserController.getSamlProvider);

/**
 * @swagger
 *
 * /v2/saml/user/linked-user:
 *   put:
 *     tags:
 *       - Saml User
 *     summary: link saml user with a git user
 *     description: Link saml user with a git user
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: cookie
 *         name: gr.auth.token
 *         required: true
 *         type: string
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       204:
 */
router.put('/linked-user', SamlUserController.linkUser);

/**
 * @swagger
 *
 * /v2/saml/user/linked-user:
 *   delete:
 *     tags:
 *       - Saml User
 *     summary: unlink saml user from connected git user
 *     description: Unlink saml user from connected git user
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: cookie
 *         name: gr.auth.token
 *         required: true
 *         type: string
 *     responses:
 *       204:
 */
router.delete('/linked-user', SamlUserController.unlinkUser);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      samlUser:
 *       type: object
 *       properties:
 *        idSamlUser:
 *          type: string
 *          require: true
 *        idUser:
 *          type: string
 *        email:
 *          type: string
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
