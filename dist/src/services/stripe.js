"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const get_1 = __importDefault(require("lodash/get"));
const config_1 = require("../../config");
class StripeService {
    stripe;
    constructor() {
        this.stripe = new stripe_1.default(config_1.env.STRIPE_SECRET_KEY, { apiVersion: '2020-03-02' });
    }
    async updateSubscriptionPrice(currentStripeSubscription, newStripePrice, accountId, trialEnd, promoCodeId, shouldDeleteOldPrice = false) {
        const { items: currentItems } = currentStripeSubscription;
        if (!currentItems.data.length)
            return currentStripeSubscription;
        let items;
        // for legacy plans we need to delete the previous item and create a new one, that's why we have this param here
        if (shouldDeleteOldPrice) {
            items = [{ id: currentItems.data[0].id, deleted: true }, { price: newStripePrice.id }];
        }
        else {
            items = [{ id: currentItems.data[0].id, price: newStripePrice.id }];
        }
        return this.updateSubscription(currentStripeSubscription.id, {
            items,
            metadata: {
                GR_ACCOUNT_ID: accountId
            },
            ...(trialEnd && { trial_end: trialEnd }),
            ...(promoCodeId && { promotion_code: promoCodeId }),
            expand: ['latest_invoice.payment_intent', 'pending_setup_intent']
        });
    }
    async getAllPlans() {
        const { data: stripePlans } = await this.stripe.plans.list({ active: true, limit: 100 });
        return stripePlans;
    }
    async getAllPrices(includeTiers = false) {
        const { data: stripePrices } = await this.stripe.prices.list({
            active: true,
            limit: 100,
            ...(includeTiers && { expand: ['data.tiers'] })
        });
        return stripePrices;
    }
    async getCustomer(customerId, options) {
        return this.stripe.customers.retrieve(customerId, options);
    }
    async createCustomer(params) {
        return this.stripe.customers.create(params);
    }
    async updateCustomer(customerId, params) {
        return this.stripe.customers.update(customerId, params);
    }
    async getSubscription(subscriptionId, options) {
        return this.stripe.subscriptions.retrieve(subscriptionId, options);
    }
    async createSubscription(params) {
        return this.stripe.subscriptions.create(params);
    }
    async updateSubscription(subscriptionId, params) {
        return this.stripe.subscriptions.update(subscriptionId, params);
    }
    async cancelSubscription(subscriptionId) {
        return this.stripe.subscriptions.del(subscriptionId);
    }
    async cancelSubscriptionAtPeriodEnd(subscriptionId) {
        return this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
        });
    }
    async renewSubscription(subscriptionId) {
        return this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: false
        });
    }
    async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId
        });
        await this.stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });
    }
    async getPaymentMethods(customerId) {
        const { data: paymentMethods } = await this.stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });
        return paymentMethods;
    }
    async createBillingPortalSession(customerId, returnUrl) {
        return this.stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl
        });
    }
    async getActivePromoCodeByCode(code) {
        const { data: promoCodes } = await this.stripe.promotionCodes.list({
            code,
            active: true,
            limit: 1,
            expand: ['data.coupon.applies_to']
        });
        return (0, get_1.default)(promoCodes, '[0]', null);
    }
    async getProducts(options) {
        const { data: stripeProducts } = await this.stripe.products.list({
            active: true,
            limit: 100,
            ...options
        });
        return stripeProducts;
    }
    validateAndGetEvent(body, sig) {
        return this.stripe.webhooks.constructEvent(body, sig, config_1.env.STRIPE_ENDPOINT_SECRET);
    }
}
exports.default = StripeService;
//# sourceMappingURL=stripe.js.map