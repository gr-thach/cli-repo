"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable class-methods-use-this */
const boom_1 = __importDefault(require("@hapi/boom"));
const accounts_1 = require("../helpers/core-api/accounts");
const subscription_1 = require("../helpers/subscription");
class StripeWebhookService {
    constructor(stripeService) {
        this.stripeService = stripeService;
    }
    async subscriptionUpdated(event) {
        const stripeSubscription = event.data.object;
        const { metadata: { GR_ACCOUNT_ID: idAccount } } = stripeSubscription;
        if (!idAccount) {
            throw boom_1.default.notFound('Stripe subscription updated webhook: no GR_ACCOUNT_ID in metadata.');
        }
        const account = await (0, accounts_1.findAccountById)(idAccount);
        if (!account) {
            throw boom_1.default.notFound(`Stripe subscription updated webhook: Account with ID = [${idAccount}] not found.`);
        }
        const { subscription } = account;
        if (!subscription) {
            throw boom_1.default.notFound(`Stripe subscription updated webhook: Account with ID = [${idAccount}] has no subscription.`);
        }
        const currentPeriodStart = new Date(subscription.periodStart).toJSON();
        const newPeriodStart = new Date(stripeSubscription.current_period_start * 1000).toJSON();
        const currentPeriodEnd = new Date(subscription.periodEnd).toJSON();
        const newPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toJSON();
        const newStatus = stripeSubscription.status;
        if (subscription.status === newStatus &&
            currentPeriodStart === newPeriodStart &&
            currentPeriodEnd === newPeriodEnd) {
            // eslint-disable-next-line no-console
            console.log('Stripe webhook - Nothing to update');
            return;
        }
        await (0, subscription_1.updateSubscriptionAndChangelog)({
            changelogEvent: 'updated',
            account,
            stripeSubscription,
            interval: subscription.interval,
            plan: subscription.plan
        });
    }
    async subscriptionDeleted(event) {
        const stripeSubscription = event.data.object;
        const { metadata: { GR_ACCOUNT_ID: idAccount } } = stripeSubscription;
        if (!idAccount) {
            throw boom_1.default.notFound('Stripe subscription updated webhook: no GR_ACCOUNT_ID in metadata.');
        }
        const account = await (0, accounts_1.findAccountById)(idAccount);
        if (!account) {
            throw boom_1.default.notFound(`Stripe subscription deleted webhook: Account = [${idAccount}] not found.`);
        }
        const { subscription } = account;
        if (subscription.stripeSubscriptionId !== stripeSubscription.id) {
            throw boom_1.default.notFound("Stripe subscription deleted webhook: This subscription is not longer related to this account. It's probably a Cancelled free trial. We will ignore this.");
        }
        await (0, subscription_1.cancelPlan)(account, stripeSubscription.status);
    }
}
exports.default = StripeWebhookService;
//# sourceMappingURL=stripeWebhook.js.map