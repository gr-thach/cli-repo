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
const ActionChangeLogsController = __importStar(require("../../controllers/actionChangeLogs"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const validations_1 = require("../../helpers/validations");
const router = (0, express_1.Router)();
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
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.ACTIONS, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        actionId: celebrate_1.Joi.number().required(),
        ...validations_1.validateAccountId
    })
}), ActionChangeLogsController.list);
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
exports.default = router;
//# sourceMappingURL=actionChangeLogs.js.map