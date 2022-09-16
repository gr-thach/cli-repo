"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const common_1 = require("../../helpers/common");
const SamlProviderController = require('../../controllers/samlProvider');
const router = (0, express_1.Router)();
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
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.SAML), SamlProviderController.getByAccountId);
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
router.post('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SAML), SamlProviderController.create);
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
router.patch('/:idSamlProvider', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SAML), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
        idSamlProvider: celebrate_1.Joi.string().required()
    }),
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        entryPoint: celebrate_1.Joi.string().required(),
        cert: celebrate_1.Joi.string().required(),
        contactEmail: celebrate_1.Joi.string()
            .email()
            .regex(common_1.EMAIL_REGEXP)
            .required(),
        enabled: celebrate_1.Joi.boolean().required()
    })
}), SamlProviderController.patch);
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
//# sourceMappingURL=samlProvider.js.map