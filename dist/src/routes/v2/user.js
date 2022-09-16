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
const UserController = __importStar(require("../../controllers/user"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/user/apikey:
 *   put:
 *     tags:
 *       - User
 *     summary: generate new api key
 *     description: Generate a new API key that can then be used for authentication
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Response will contain the new api key that can be used for authenticating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   example: "7bbc8bf6-9899-4f2f-ae47-5478fbb92b4b"
 */
router.put('/apikey', UserController.generateApiKey);
/**
 * @swagger
 *
 * /v2/user/refresh:
 *   get:
 *     tags:
 *       - User
 *     summary: refresh the user's permissions
 *     description: Refresh the user's permissions. Used when the installation is created/updated.
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
 *     responses:
 *       204:
 *         description: Returns an empty response body with status code 204
 */
router.get('/refresh', UserController.refreshPermissions);
/**
 * @swagger
 *
 * /v2/user/refreshUsers:
 *   get:
 *     tags:
 *       - User
 *     summary: Synchronize the users from the GitProvider
 *     description: Synchronize the users for an account/organization fetched from the GitProvider to GuardRails in order to be able to fetch them all with GET /v2/users endpoint
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
 *         required: true
 *         description: the accountId to sync the users with
 *         type: integer
 *     responses:
 *       204:
 *         description: Returns an empty response body with status code 204
 */
router.get('/refreshUsers', UserController.refreshUsers);
/**
 * @swagger
 *
 * /v2/user:
 *   get:
 *     tags:
 *       - User
 *     summary: get the list of users
 *     description: Get the list of users for the account
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
 *         description: the accountId to get the users from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to search users by their name
 *         type: string
 *       - name: role
 *         in: query
 *         required: false
 *         description: the role to filter users by
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of users related to the queried account
 *         content:
 *           application/json:
 *             schema:
 *               schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/user"
 */
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.USERS), UserController.list);
/**
 * @swagger
 *
 * /v2/user/filters:
 *   get:
 *     tags:
 *       - User
 *     summary: get the filters for the list of users
 *     description: Get the filters for the list of users for the account
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
 *         description: the accountId to get get the filters of the users from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to filter down the filters by the user's name
 *         type: string
 *       - name: role
 *         in: query
 *         required: false
 *         description: used to filter down the filters by the user's role
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of filters for the list of users related to the queried account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 */
router.get('/filters', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.USERS), UserController.filters);
/**
 * @swagger
 *  /v2/users/role:
 *    patch:
 *      summary: patch users role by a list of userIds
 *      description: patch one or more users role in bulk
 *      tags:
 *        - User
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: userIds
 *          in: body
 *          required: true
 *          description: the user ids to patch
 *          type: array
 *        - name: accountId
 *          in: body
 *          required: true
 *          description: the accountId to set the roles on (user's roles are different per account)
 *          type: integer
 *        - name: role
 *          in: body
 *          required: true
 *          description: the role name to set to the users
 *          type: string
 *      responses:
 *        200:
 *          description: Successful operation.
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  role:
 *                    type: string
 */
router.patch('/role', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.USERS), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        userIds: celebrate_1.Joi.array()
            .items(celebrate_1.Joi.string())
            .required(),
        roleId: celebrate_1.Joi.number()
            .integer()
            .required()
    })
}), UserController.patchRole);
/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          user:
 *              type: object
 *              properties:
 *                  idUser:
 *                      type: uuid
 *                      example: "f28c7fca-a284-4167-88eb-94a064e72761"
 *                  login:
 *                      type: string
 *                      example: "devX"
 *                  provider:
 *                      type: string
 *                      example: "github"
 *                  name:
 *                      type: string
 *                      example: "Dev X"
 *                  email:
 *                      type: string
 *                      example: "devx@companY.com"
 *                  avatarUrl:
 *                      type: string
 *                      example: https://gitlab.com/uploads/-/system/user/avatar/1231231/avatar.png
 */
exports.default = router;
//# sourceMappingURL=user.js.map