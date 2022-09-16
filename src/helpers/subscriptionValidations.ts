import boom from '@hapi/boom';
import lodashGet from 'lodash/get';
import { findPlanById } from './core-api/plans';
import { freeTrialDaysOptions, isLegacyPlan } from './subscription';
import { Account, PlanCode, User } from '../interfaces';

export const validateAndRetrieveEntities = async (
  params: any,
  account: Account,
  userInDb: User
) => {
  const { planId, interval, freeTrial, checkoutFields } = params;

  if (!['month', 'year'].includes(interval)) {
    throw boom.badRequest('"interval" should be a "month" or "year"');
  }

  // if we get free trial param, then check that the value is valid
  if (freeTrial && !lodashGet(freeTrialDaysOptions, freeTrial, null)) {
    throw boom.badRequest('"freeTrial" has an invalid value');
  }

  const newPlan = await findPlanById(planId);

  if (isLegacyPlan(newPlan.code)) {
    throw boom.badRequest("Invalid plan, this endpoint doesn't support legacy plans.");
  }

  const {
    subscription: {
      status,
      plan: currentPlan,
      isCheckoutCompleted,
      hadFreeTrial,
      // stripeSubscriptionId,
      stripeCustomerId
    }
  } = account;

  if (currentPlan.idPlan === planId) {
    throw boom.badRequest(
      "Checkout error. You're trying to update your plan to the exact same one."
    );
  }
  if (freeTrial && hadFreeTrial) {
    throw boom.badRequest('Invalid freeTrial parameter. Accounts can only have one free trial.');
  }
  if (!newPlan || newPlan.deletedAt) {
    throw boom.notFound('Plan not found.');
  }
  if (!userInDb) {
    throw boom.notFound('User trying to execute this action not found.');
  }

  if (!stripeCustomerId && (!checkoutFields.name || !checkoutFields.email)) {
    throw boom.badRequest('Invalid checkout fields name and/or email.');
  }

  if (
    !freeTrial &&
    status !== 'trialing' &&
    !isCheckoutCompleted &&
    newPlan.code !== PlanCode.FREE &&
    !checkoutFields.paymentMethodId
  ) {
    throw boom.badRequest(
      'Missing paymentMethodId when creating a subscription with no free trial and without having already a payment method.'
    );
  }

  return { newPlan, checkoutFields };
};
