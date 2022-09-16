import Stripe from 'stripe';
import { Plan, PlanCode, SubscriptionInterval } from '../interfaces';
import StripeService from '../services/stripe';

export const mapPlansWithStripePrices = (grPlans: Plan[], stripePrices: Stripe.Price[]) => {
  return grPlans.map(grPlan => {
    const price: { [key: string]: number | null } = {
      monthlyPriceBase: 0,
      monthlyPricePerUnit: 0,
      yearlyPriceBase: 0,
      yearlyPricePerUnit: 0,
      minUnits: 1
    };

    stripePrices
      .filter(
        stripePrice =>
          stripePrice.recurring &&
          stripePrice.metadata.GR_PLAN === grPlan.code &&
          ['month', 'year'].includes(stripePrice.recurring.interval) &&
          stripePrice.tiers &&
          stripePrice.tiers.length
      )
      .forEach(stripePrice => {
        stripePrice.tiers!.forEach(tier => {
          if (tier.flat_amount !== null) {
            price[`${stripePrice.recurring!.interval}lyPriceBase`] = tier.flat_amount / 100;
            price.minUnits = tier.up_to;
          } else if (tier.unit_amount) {
            price[`${stripePrice.recurring!.interval}lyPricePerUnit`] = tier.unit_amount / 100;
          }
        });
      });

    return { price, ...grPlan };
  });
};

export const findStripePriceByPlanAndInterval = async (
  plan: Plan,
  interval: Stripe.Price.Recurring.Interval
) => {
  const stripeService = new StripeService();
  const stripePrices = await stripeService.getAllPrices();
  return stripePrices.find(
    stripePrice =>
      stripePrice.metadata.GR_PLAN === plan.code &&
      (plan.code === PlanCode.FREE || stripePrice.recurring?.interval === interval)
  );
};

export const stripeIntervalToIntervalEnum = (
  stripeInterval: Stripe.Price.Recurring.Interval
): SubscriptionInterval =>
  stripeInterval === 'year' ? SubscriptionInterval.YEARLY : SubscriptionInterval.MONTHLY;
