"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const AccountsController = __importStar(require("../../controllers/accounts"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
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
router.patch('/configuration', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.CUSTOM_CONFIG), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        configuration: celebrate_1.Joi.alternatives(celebrate_1.Joi.string(), celebrate_1.Joi.object()).required()
    })
}), AccountsController.config);
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
router.patch('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACCOUNTS), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        filterReposByWriteAccess: celebrate_1.Joi.boolean(),
        findingConfiguration: celebrate_1.Joi.object({
            requireApprovalOnUpdate: celebrate_1.Joi.boolean()
        })
    })
}), AccountsController.update);
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
router.delete('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACCOUNTS), AccountsController.destroy);
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
exports.default = router;
//# sourceMappingURL=accounts.js.map