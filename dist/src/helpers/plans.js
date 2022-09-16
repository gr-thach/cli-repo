"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeIntervalToIntervalEnum = exports.findStripePriceByPlanAndInterval = exports.mapPlansWithStripePrices = void 0;
const interfaces_1 = require("../interfaces");
const stripe_1 = __importDefault(require("../services/stripe"));
const mapPlansWithStripePrices = (grPlans, stripePrices) => {
    return grPlans.map(grPlan => {
        const price = {
            monthlyPriceBase: 0,
            monthlyPricePerUnit: 0,
            yearlyPriceBase: 0,
            yearlyPricePerUnit: 0,
            minUnits: 1
        };
        stripePrices
            .filter(stripePrice => stripePrice.recurring &&
            stripePrice.metadata.GR_PLAN === grPlan.code &&
            ['month', 'year'].includes(stripePrice.recurring.interval) &&
            stripePrice.tiers &&
            stripePrice.tiers.length)
            .forEach(stripePrice => {
            stripePrice.tiers.forEach(tier => {
                if (tier.flat_amount !== null) {
                    price[`${stripePrice.recurring.interval}lyPriceBase`] = tier.flat_amount / 100;
                    price.minUnits = tier.up_to;
                }
                else if (tier.unit_amount) {
                    price[`${stripePrice.recurring.interval}lyPricePerUnit`] = tier.unit_amount / 100;
                }
            });
        });
        return { price, ...grPlan };
    });
};
exports.mapPlansWithStripePrices = mapPlansWithStripePrices;
const findStripePriceByPlanAndInterval = async (plan, interval) => {
    const stripeService = new stripe_1.default();
    const stripePrices = await stripeService.getAllPrices();
    return stripePrices.find(stripePrice => stripePrice.metadata.GR_PLAN === plan.code &&
        (plan.code === interfaces_1.PlanCode.FREE || stripePrice.recurring?.interval === interval));
};
exports.findStripePriceByPlanAndInterval = findStripePriceByPlanAndInterval;
const stripeIntervalToIntervalEnum = (stripeInterval) => stripeInterval === 'year' ? interfaces_1.SubscriptionInterval.YEARLY : interfaces_1.SubscriptionInterval.MONTHLY;
exports.stripeIntervalToIntervalEnum = stripeIntervalToIntervalEnum;
//# sourceMappingURL=plans.js.map