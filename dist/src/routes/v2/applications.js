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
const ApplicationsController = __importStar(require("../../controllers/applications"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get paginated applications
 *     description: Get the list of applications for an account paginated and with the total count
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
 *         required: true
 *         description: the accountId to get the applications from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to search applications by their name
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of applications for the current page and the total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                   $ref: "#/components/schemas/application"
 *                 totalCount:
 *                   type: integer
 */
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.APPLICATIONS), ApplicationsController.list);
/**
 * @swagger
 *
 * /v2/applications/filters:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get application filters
 *     description: Get the filters for the list of applications for an account
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
 *         required: true
 *         description: the accountId to get the filters from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to filter out filters by the applications name
 *         type: string
 *       - name: department
 *         in: query
 *         required: false
 *         description: the department to filter out filters by
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the filters for the entire list of applications in the account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 department:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/filters', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.APPLICATIONS), ApplicationsController.filters);
/**
 * @swagger
 *
 * /v2/applications/{applicationId}:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get application by id
 *     description: Get the application for an account by the application id
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
 *         required: true
 *         description: the accountId owner of the application
 *         type: integer
 *     responses:
 *       200:
 *         description: Response will contain the application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/application"
 */
router.get('/:applicationId', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.APPLICATIONS), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
        applicationId: celebrate_1.Joi.number()
            .integer()
            .required()
    })
}), ApplicationsController.getById);
/**
 * @swagger
 *
 * /v2/applications:
 *   post:
 *     tags:
 *       - Applications
 *     summary: create a application
 *     description: Create a application based on the application sent in the request's body
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
 *         required: true
 *         description: the accountId that will be the owner of the created application
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application:
 *                 $ref: "#/components/schemas/createOrPatchApplication"
 *     responses:
 *       200:
 *         description: Response will contain the created application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/application"
 */
router.post('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.APPLICATIONS), ApplicationsController.create);
/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          application:
 *              type: object
 *              properties:
 *                  idApplication:
 *                      type: integer
 *                      example: 1
 *                  fkAccount:
 *                      type: integer
 *                      example: 100
 *                  name:
 *                      type: string
 *                      example: "Frontend"
 *                  description:
 *                      type: string
 *                      example: "Frontend application"
 *          createOrPatchApplication:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      example: "Frontend"
 *                  description:
 *                      type: string
 *                      example: "Frontend application"
 */
exports.default = router;
//# sourceMappingURL=applications.js.map