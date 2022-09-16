"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listChangelogs = exports.toggleInterval = exports.renew = exports.cancel = exports.update = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const get_1 = __importDefault(require("lodash/get"));
const stripe_1 = __importDefault(require("../services/stripe"));
const plans_1 = require("../helpers/plans");
const subscriptionValidations_1 = require("../helpers/subscriptionValidations");
const subscription_1 = require("../helpers/subscription");
const subscriptionChangelogs_1 = require("../helpers/core-api/subscriptionChangelogs");
const interfaces_1 = require("../interfaces");
const update = async (req, res) => {
    const { body: { freeTrial, interval, promoCode }, account, userInDb } = req;
    const { newPlan, checkoutFields } = await (0, subscriptionValidations_1.validateAndRetrieveEntities)(req.body, account, userInDb);
    const newStripePrice = await (0, plans_1.findStripePriceByPlanAndInterval)(newPlan, interval);
    if (!newStripePrice) {
        throw boom_1.default.badRequest('No Stripe plan matched for the requested plan');
    }
    const freeTrialDays = freeTrial ? (0, get_1.default)(subscription_1.freeTrialDaysOptions, freeTrial, null) : null;
    const result = await (0, subscription_1.changePlan)(newStripePrice, newPlan, account, userInDb, checkoutFields, freeTrialDays, promoCode);
    if (!result) {
        boom_1.default.notFound("The plan couldn't be updated. Please contact GuardRails support.");
    }
    return res.status(200).send(result);
};
exports.update = update;
const cancel = async (req, res) => {
    const { account, userInDb } = req;
    const { subscription: { stripeSubscriptionId, status } } = account;
    if (!stripeSubscriptionId) {
        throw boom_1.default.badRequest("You haven't subscribed to a plan yet, there is no subscription to be cancelled.");
    }
    const stripeService = new stripe_1.default();
    if (status === 'trialing') {
        await (0, subscription_1.cancelPlan)(account, 'deleted', userInDb);
        await stripeService.cancelSubscription(stripeSubscriptionId);
    }
    else {
        await (0, subscription_1.updateCancelAtPeriodEnd)(account, true, userInDb);
        await stripeService.cancelSubscriptionAtPeriodEnd(stripeSubscriptionId);
    }
    return res.status(200).send({ cancelled: true });
};
exports.cancel = cancel;
const renew = async (req, res) => {
    const { account, userInDb } = req;
    const { subscription } = account;
    if (!subscription.stripeSubscriptionId) {
        throw boom_1.default.badRequest("You haven't subscribed to a plan yet, there is no subscription to be renewed.");
    }
    await (0, subscription_1.updateCancelAtPeriodEnd)(account, false, userInDb);
    const stripeService = new stripe_1.default();
    await stripeService.renewSubscription(subscription.stripeSubscriptionId);
    return res.status(200).send({ renewed: true });
};
exports.renew = renew;
const toggleInterval = async (req, res) => {
    const { account, userInDb } = req;
    const { subscription: { stripeSubscriptionId, interval, plan } } = account;
    if (!stripeSubscriptionId) {
        throw boom_1.default.notFound('Account has no active Subscription associated.');
    }
    const newStripeInterval = interval === interfaces_1.SubscriptionInterval.YEARLY ? 'month' : 'year';
    const newStripePrice = await (0, plans_1.findStripePriceByPlanAndInterval)(plan, newStripeInterval);
    if (!newStripePrice) {
        throw boom_1.default.badRequest('No Stripe plan matched for the requested plan');
    }
    const result = await (0, subscription_1.changePlan)(newStripePrice, plan, account, userInDb);
    if (!result.updated) {
        boom_1.default.notFound("The plan couldn't be updated. Please contact GuardRails support.");
    }
    return res.status(200).send({ updated: result.updated });
};
exports.toggleInterval = toggleInterval;
const listChangelogs = async (req, res) => {
    const { account } = req;
    const changelogs = await (0, subscriptionChangelogs_1.findSubscriptionChangelogsByAccountId)(account.idAccount);
    return res.status(200).send(changelogs);
};
exports.listChangelogs = listChangelogs;
//# sourceMappingURL=subscription.js.map