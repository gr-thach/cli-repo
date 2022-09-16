"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachPaymentMethodToCustomer = void 0;
const stripe_1 = __importDefault(require("../services/stripe"));
const subscriptionChangelogs_1 = require("./core-api/subscriptionChangelogs");
const subscriptions_1 = require("./core-api/subscriptions");
const attachPaymentMethodToCustomer = async (account, paymentMethodId, userInDb) => {
    const { subscription } = account;
    const stripeService = new stripe_1.default();
    await stripeService.attachPaymentMethodToCustomer(paymentMethodId, subscription.stripeCustomerId);
    await (0, subscriptions_1.updateSubscription)(account.subscription.idSubscription, {
        isCheckoutCompleted: true,
        updatedAt: new Date().toJSON()
    });
    await (0, subscriptionChangelogs_1.createSubscriptionChangelog)({
        fkAccount: account.idAccount,
        fkPlan: subscription.plan.idPlan,
        fkUser: userInDb ? userInDb.idUser : null,
        subscriptionStatus: subscription.status,
        subscriptionEvent: 'paymentMethodSaved',
        subscriptionInterval: subscription.interval,
        createdAt: new Date().toJSON()
    });
};
exports.attachPaymentMethodToCustomer = attachPaymentMethodToCustomer;
//# sourceMappingURL=billing.js.map