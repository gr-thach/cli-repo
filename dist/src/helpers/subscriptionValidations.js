"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndRetrieveEntities = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const get_1 = __importDefault(require("lodash/get"));
const plans_1 = require("./core-api/plans");
const subscription_1 = require("./subscription");
const interfaces_1 = require("../interfaces");
const validateAndRetrieveEntities = async (params, account, userInDb) => {
    const { planId, interval, freeTrial, checkoutFields } = params;
    if (!['month', 'year'].includes(interval)) {
        throw boom_1.default.badRequest('"interval" should be a "month" or "year"');
    }
    // if we get free trial param, then check that the value is valid
    if (freeTrial && !(0, get_1.default)(subscription_1.freeTrialDaysOptions, freeTrial, null)) {
        throw boom_1.default.badRequest('"freeTrial" has an invalid value');
    }
    const newPlan = await (0, plans_1.findPlanById)(planId);
    if ((0, subscription_1.isLegacyPlan)(newPlan.code)) {
        throw boom_1.default.badRequest("Invalid plan, this endpoint doesn't support legacy plans.");
    }
    const { subscription: { status, plan: currentPlan, isCheckoutCompleted, hadFreeTrial, 
    // stripeSubscriptionId,
    stripeCustomerId } } = account;
    if (currentPlan.idPlan === planId) {
        throw boom_1.default.badRequest("Checkout error. You're trying to update your plan to the exact same one.");
    }
    if (freeTrial && hadFreeTrial) {
        throw boom_1.default.badRequest('Invalid freeTrial parameter. Accounts can only have one free trial.');
    }
    if (!newPlan || newPlan.deletedAt) {
        throw boom_1.default.notFound('Plan not found.');
    }
    if (!userInDb) {
        throw boom_1.default.notFound('User trying to execute this action not found.');
    }
    if (!stripeCustomerId && (!checkoutFields.name || !checkoutFields.email)) {
        throw boom_1.default.badRequest('Invalid checkout fields name and/or email.');
    }
    if (!freeTrial &&
        status !== 'trialing' &&
        !isCheckoutCompleted &&
        newPlan.code !== interfaces_1.PlanCode.FREE &&
        !checkoutFields.paymentMethodId) {
        throw boom_1.default.badRequest('Missing paymentMethodId when creating a subscription with no free trial and without having already a payment method.');
    }
    return { newPlan, checkoutFields };
};
exports.validateAndRetrieveEntities = validateAndRetrieveEntities;
//# sourceMappingURL=subscriptionValidations.js.map