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
const UserEventsController = __importStar(require("../../controllers/userEvents"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const validations_1 = require("../../helpers/validations");
const router = (0, express_1.Router)();
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
router.get('/uniqueUsersInPeriod', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.USER_EVENTS), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        from: celebrate_1.Joi.string().required(),
        to: celebrate_1.Joi.string().required(),
        ...validations_1.validateAccountId
    })
}), UserEventsController.getUniqueUsersInPeriod);
exports.default = router;
//# sourceMappingURL=userEvents.js.map