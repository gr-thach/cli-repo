"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhook = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const stripe_1 = __importDefault(require("../services/stripe"));
const stripeWebhook_1 = __importDefault(require("../services/stripeWebhook"));
const webhook = async (req, res) => {
    const stripeService = new stripe_1.default();
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripeService.validateAndGetEvent(req.rawBody, String(sig));
    }
    catch (e) {
        throw boom_1.default.badRequest(`Webhook Error: ${e.message}`);
    }
    const webhookService = new stripeWebhook_1.default(stripeService);
    // eslint-disable-next-line no-console
    console.log(`Stripe webhook event received [type=${event.type}]`);
    switch (event.type) {
        case 'customer.subscription.updated':
            await webhookService.subscriptionUpdated(event);
            return res.status(200).send({ received: true });
        case 'customer.subscription.deleted':
            await webhookService.subscriptionDeleted(event);
            return res.status(200).send({ received: true });
        default:
            return res.status(400).end();
    }
};
exports.webhook = webhook;
//# sourceMappingURL=stripe.js.map