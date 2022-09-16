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
const SubscriptionController = __importStar(require("../../controllers/subscription"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
router.put('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SUBSCRIPTION), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        planId: celebrate_1.Joi.number()
            .integer()
            .required(),
        interval: celebrate_1.Joi.string().required(),
        promoCode: celebrate_1.Joi.string().allow(null),
        checkoutFields: celebrate_1.Joi.object({
            paymentMethodId: celebrate_1.Joi.string(),
            email: celebrate_1.Joi.string().required(),
            name: celebrate_1.Joi.string().required()
        }),
        freeTrial: celebrate_1.Joi.string()
    })
}), SubscriptionController.update);
router.delete('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SUBSCRIPTION), SubscriptionController.cancel);
router.post('/renew', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SUBSCRIPTION), SubscriptionController.renew);
router.patch('/toggle-interval', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.SUBSCRIPTION), SubscriptionController.toggleInterval);
/**
 * @swagger
 *  /v2/subscription/changelogs:
 *      get:
 *          summary: returns the changelog for the account's subscription
 *          description: returns all saved records of changed made on the account's subscriptions with associated user and plan.
 *          tags:
 *              - Subscription
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the account from where to return the changelogs from
 *                example: 10
 *                in: query
 *                required: true
 *                type: number
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the list of changelogs objects.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              properties:
 *                                  idSubscriptionChangelog:
 *                                      type: int
 *                                      example: 1
 *                                  subscriptionStatus:
 *                                      type: string
 *                                      example: active
 *                                  subscriptionEvent:
 *                                      type: string
 *                                      example: created
 *                                  subscriptionInterval:
 *                                      type: string
 *                                      example: monthly
 *                                  createdAt:
 *                                      type: Date
 *                                      example: active
 *                                  plan:
 *                                      type: object
 *                                      example: { idPlan: 5, name: 'Free', code: 'FREE' }
 *                                  user:
 *                                      type: object
 *                                      example: { login: 'test' }
 *
 */
router.get('/changelogs', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.SUBSCRIPTION), SubscriptionController.listChangelogs);
exports.default = router;
//# sourceMappingURL=subscription.js.map