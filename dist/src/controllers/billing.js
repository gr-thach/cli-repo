"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCoupon = exports.redirectToBillingPortal = exports.getPaymentMethod = exports.savePaymentMethod = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const get_1 = __importDefault(require("lodash/get"));
const stripe_1 = __importDefault(require("../services/stripe"));
const config_1 = require("../../config");
const billing_1 = require("../helpers/billing");
const subscriptions_1 = require("../helpers/core-api/subscriptions");
const plans_1 = require("../helpers/core-api/plans");
const common_1 = require("../helpers/common");
const savePaymentMethod = async (req, res) => {
    const { body: { paymentMethodId }, account, userInDb } = req;
    await (0, billing_1.attachPaymentMethodToCustomer)(account, paymentMethodId, userInDb);
    return res.status(200).send({ saved: true });
};
exports.savePaymentMethod = savePaymentMethod;
const getPaymentMethod = async (req, res) => {
    const { account } = req;
    const { subscription } = account;
    const { stripeSubscriptionId } = subscription;
    let { stripeCustomerId } = subscription;
    if (!stripeCustomerId && !stripeSubscriptionId) {
        throw boom_1.default.notFound('Account has no Customer, Subscription or Payment method associated.');
    }
    const stripeService = new stripe_1.default();
    // When having no customer id but a subscription id means that the account is coming from previous model
    // when we didn't store the customer id, so we retrieve it from the subscription and we update the account
    // here, because we will always request payment method when the user go to subscription page
    if (stripeSubscriptionId && !stripeCustomerId) {
        const stripeSubscription = await stripeService.getSubscription(stripeSubscriptionId);
        stripeCustomerId = stripeSubscription.customer;
        await (0, subscriptions_1.updateSubscription)(subscription.idSubscription, { stripeCustomerId });
    }
    const stripeCustomer = await stripeService.getCustomer(stripeCustomerId, {
        // @ts-ignore
        expand: ['invoice_settings.default_payment_method']
    });
    let card = (0, get_1.default)(stripeCustomer, 'invoice_settings.default_payment_method.card');
    if (!card) {
        const paymentMethods = await stripeService.getPaymentMethods(stripeCustomerId);
        card = (0, get_1.default)(paymentMethods, '[0].card');
        if (!card) {
            throw boom_1.default.notFound('Customer has no payment method attached.');
        }
    }
    const { last4, exp_month, exp_year, brand } = card;
    return res.status(200).send({ brand, last4, expMonth: exp_month, expYear: exp_year });
};
exports.getPaymentMethod = getPaymentMethod;
const redirectToBillingPortal = async (req, res) => {
    const { account } = req;
    if (!account.subscription.stripeCustomerId) {
        throw boom_1.default.notFound('Account has no active Subscription associated.');
    }
    const stripeService = new stripe_1.default();
    const session = await stripeService.createBillingPortalSession(account.subscription.stripeCustomerId, `${config_1.constants.dashboardBaseUrl}/${(0, common_1.constructAccountPIDUrl)(account)}/settings/subscription`);
    return res.redirect(session.url);
};
exports.redirectToBillingPortal = redirectToBillingPortal;
const checkCoupon = async (req, res) => {
    const { body: { code, planId } } = req;
    const stripeService = new stripe_1.default();
    const promoCode = await stripeService.getActivePromoCodeByCode(code);
    if (!promoCode) {
        throw boom_1.default.notFound('No Coupon has been found for the entered promotion code.');
    }
    const { coupon: { name, percent_off, applies_to } } = promoCode;
    if (applies_to && applies_to.products && applies_to.products.length) {
        const plan = await (0, plans_1.findPlanById)(planId);
        if (!plan) {
            throw boom_1.default.notFound('The Plan to apply this promotion code has not been found.');
        }
        const stripeProducts = await stripeService.getProducts({ ids: applies_to.products });
        const allowedProducts = stripeProducts.filter(sp => sp.metadata.GR_PRODUCT === plan.code);
        if (!allowedProducts.length) {
            throw boom_1.default.notFound('No applicable Coupon has been found for the selected plan.');
        }
    }
    return res.status(200).send({ promoCode: promoCode.code, name, percentOff: percent_off });
};
exports.checkCoupon = checkCoupon;
//# sourceMappingURL=billing.js.map