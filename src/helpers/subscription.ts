import Stripe from 'stripe';
import lodashGet from 'lodash/get';
import StripeService from '../services/stripe';
import { env } from '../../config';
import { stripeIntervalToIntervalEnum } from './plans';
import { PLAN_FEATURES_SPECIAL_VALUES } from './core-api/enums';
import { createSubscriptionChangelog } from './core-api/subscriptionChangelogs';
import { updateSubscription } from './core-api/subscriptions';
import { findPlanByCode } from './core-api/plans';
import { findPlanFeaturesByPlanCode } from './core-api/planFeatures';
import {
  Account,
  Plan,
  Subscription,
  SubscriptionPatch,
  User,
  PlanFeatureName,
  PlanFeature,
  ScanType,
  SubscriptionInterval,
  PlanCode
} from '../interfaces';

const LEGACY_PLAN_CODES = [
  PlanCode.OPEN_SOURCE,
  PlanCode.INDIVIDUAL,
  PlanCode.STARTUP,
  PlanCode.BUSINESS
];

// This is hardcoded here to avoid users to be able to send us a number and set a trial for whatever they want.
// Only these 3 options are available and only if the customer have one of these UUIDs they can extend up to 60 days.
// Is not fancy, but it's an easy way to manage this for now.
export const freeTrialDaysOptions = {
  '53ca00fa-2669-4eec-ae91-eed541112684': 14,
  '96602fd7-3579-46b7-a934-211a10deb956': 30,
  '9a3e3a21-046b-4f84-98e4-c55785671cb9': 60
};

export const isLegacyPlan = (planCode: PlanCode) => LEGACY_PLAN_CODES.includes(planCode);

interface updateSubscriptionAndChangelogParams {
  changelogEvent: 'created' | 'updated' | 'deleted';
  account: Account;
  stripeSubscription: Stripe.Subscription | null | undefined;
  interval: SubscriptionInterval;
  plan: Plan;
  userInDb: User | null;
  trialEnd?: number | null | undefined;
  isCheckoutCompleted?: boolean | null;
  changelogStatus?: Stripe.Subscription.Status | 'deleted' | null;
  cancelAtPeriodEnd?: boolean | null;
}

export const updateSubscriptionAndChangelog = async ({
  changelogEvent,
  account,
  stripeSubscription = null,
  interval,
  plan,
  userInDb = null,
  trialEnd = null,
  isCheckoutCompleted = null,
  changelogStatus = null,
  cancelAtPeriodEnd = null
}: updateSubscriptionAndChangelogParams) => {
  const patch: SubscriptionPatch = {
    fkPlan: plan.idPlan,
    stripeSubscriptionId: null,
    status: null,
    periodStart: null,
    periodEnd: null,
    interval,
    updatedAt: new Date().toJSON(),
    ...(isCheckoutCompleted !== null && { isCheckoutCompleted }),
    ...(trialEnd !== null && { trialEnd }),
    ...(trialEnd !== null && { hadFreeTrial: true }),
    ...(cancelAtPeriodEnd !== null && { cancelAtPeriodEnd })
  };

  if (stripeSubscription) {
    patch.stripeSubscriptionId = stripeSubscription.id;
    patch.status = stripeSubscription.status;
    patch.periodStart = new Date(stripeSubscription.current_period_start * 1000).toJSON();
    patch.periodEnd = new Date(stripeSubscription.current_period_end * 1000).toJSON();
    patch.stripeCustomerId = stripeSubscription.customer as string;
  }

  await updateSubscription(account.subscription.idSubscription, patch);

  await createSubscriptionChangelog({
    fkAccount: account.idAccount,
    fkPlan: plan.idPlan,
    fkUser: userInDb ? userInDb.idUser : null,
    subscriptionStatus: changelogStatus || stripeSubscription?.status,
    subscriptionEvent: changelogEvent,
    subscriptionInterval: interval,
    createdAt: new Date().toJSON()
  });
};

const createOrUpdateCustomer = async (
  stripeCustomerId: string,
  accountId: number,
  userId: string,
  email: string | undefined,
  name: string | undefined
) => {
  let customerId = stripeCustomerId;

  const customerData = {
    ...(email && { email }),
    ...(name && { name }),
    metadata: { GR_ACCOUNT_ID: accountId, GR_USER_ID: userId }
  };

  const stripeService = new StripeService();
  if (customerId) {
    await stripeService.updateCustomer(customerId, customerData);
  } else {
    const { id: newCustomerId } = await stripeService.createCustomer(customerData);
    customerId = newCustomerId;
  }

  return customerId;
};

const attachOrUpdatePaymentMethod = async (customerId: string, paymentMethodId?: string) => {
  let isCheckoutCompleted = null;
  if (paymentMethodId) {
    const stripeService = new StripeService();
    await stripeService.attachPaymentMethodToCustomer(paymentMethodId, customerId);
    isCheckoutCompleted = true;
  }
  return isCheckoutCompleted;
};

const getTrialEnd = (freeTrialDays: number | null) => {
  let trialEnd;
  if (freeTrialDays) {
    const now = new Date();
    trialEnd = Math.floor(now.setDate(now.getDate() + freeTrialDays) / 1000);
  }
  return trialEnd;
};

const getPromoCode = async (promoCode: string | null) => {
  let promoCodeId;
  if (promoCode) {
    const stripeService = new StripeService();
    ({ id: promoCodeId } = await stripeService.getActivePromoCodeByCode(promoCode));
  }
  return promoCodeId;
};

const createOrUpdateSubscription = async (
  account: Account,
  newStripePrice: Stripe.Price,
  customerId: string,
  trialEnd: number | undefined,
  promoCodeId: string | undefined
) => {
  const {
    subscription: { stripeSubscriptionId, plan }
  } = account;

  const stripeService = new StripeService();

  let stripeSubscription: Stripe.Subscription;
  if (stripeSubscriptionId) {
    stripeSubscription = await stripeService.getSubscription(stripeSubscriptionId);
    stripeSubscription = await stripeService.updateSubscriptionPrice(
      stripeSubscription,
      newStripePrice,
      account.idAccount,
      trialEnd,
      promoCodeId,
      isLegacyPlan(plan.code)
    );
  } else {
    stripeSubscription = await stripeService.createSubscription({
      customer: customerId,
      items: [
        {
          price: newStripePrice.id
        }
      ],
      metadata: {
        GR_ACCOUNT_ID: account.idAccount
      },
      ...(trialEnd && { trial_end: trialEnd }),
      ...(promoCodeId && { promotion_code: promoCodeId }),
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent']
    });
  }

  let threeDPayment = null;
  if (stripeSubscription) {
    const { pending_setup_intent } = stripeSubscription;
    if (
      pending_setup_intent &&
      (pending_setup_intent as Stripe.SetupIntent).status === 'requires_action'
    ) {
      threeDPayment = {
        paymentMethodId: (pending_setup_intent as Stripe.SetupIntent).payment_method,
        clientSecret: (pending_setup_intent as Stripe.SetupIntent).client_secret
      };
    }

    return { updated: true, stripeSubscription, threeDPayment };
  }

  return { updated: false };
};

export const changePlan = async (
  newStripePrice: Stripe.Price,
  newPlan: Plan,
  account: Account,
  userInDb: User,
  checkoutFields: { email?: string; name?: string; paymentMethodId?: string } | null = null,
  freeTrialDays: number | null = null,
  promoCode = null
) => {
  const {
    subscription: { stripeCustomerId }
  } = account;

  const { email, name } = checkoutFields || {};
  const customerId = await createOrUpdateCustomer(
    stripeCustomerId,
    account.idAccount,
    userInDb.idUser,
    email,
    name
  );

  const isCheckoutCompleted = await attachOrUpdatePaymentMethod(
    customerId,
    checkoutFields?.paymentMethodId
  );

  let trialEnd;
  // For free plan we don't use Free Trials
  if (newPlan.code !== PlanCode.FREE) {
    trialEnd = getTrialEnd(freeTrialDays);
  }

  const promoCodeId = await getPromoCode(promoCode);

  const result = await createOrUpdateSubscription(
    account,
    newStripePrice,
    customerId,
    trialEnd,
    promoCodeId
  );
  const { stripeSubscription, ...restResult } = result;

  // If subscription got created/updated properly: Update GR Subscription + Create new ChangeLog record
  if (restResult.updated) {
    const newInterval = stripeIntervalToIntervalEnum(newStripePrice.recurring?.interval || 'month');
    await updateSubscriptionAndChangelog({
      changelogEvent: 'updated',
      account,
      stripeSubscription,
      interval: newInterval,
      plan: newPlan,
      userInDb,
      isCheckoutCompleted,
      trialEnd
    });
  }
  return restResult;
};

export const updateCancelAtPeriodEnd = async (
  account: Account,
  cancelAtPeriodEnd: boolean,
  userInDb: User
) => {
  await updateSubscription(account.subscription.idSubscription, {
    cancelAtPeriodEnd,
    updatedAt: new Date().toJSON()
  });

  await createSubscriptionChangelog({
    fkAccount: account.idAccount,
    fkPlan: account.subscription.plan.idPlan,
    fkUser: userInDb ? userInDb.idUser : null,
    subscriptionStatus: account.subscription.status,
    subscriptionEvent: cancelAtPeriodEnd ? 'cancelAtPeriodEnd' : 'renew',
    subscriptionInterval: account.subscription.interval,
    createdAt: new Date().toJSON()
  });
};

export const cancelPlan = async (
  account: Account,
  stripeSubscriptionStatus: Stripe.Subscription.Status | 'deleted',
  userInDb: User
) => {
  // back to free
  const freePlan = await findPlanByCode(PlanCode.FREE);

  await updateSubscriptionAndChangelog({
    changelogEvent: 'deleted',
    account,
    stripeSubscription: null,
    interval: SubscriptionInterval.YEARLY,
    plan: freePlan,
    userInDb,
    changelogStatus: stripeSubscriptionStatus,
    cancelAtPeriodEnd: false
  });
};

export const isSubscriptionActive = (subscription: Subscription) =>
  ['active', 'trialing'].includes(lodashGet(subscription, 'status') || '');

export const getAccountPlanCode = (account: Account) => {
  const { subscription } = account;
  return isSubscriptionActive(subscription) ? subscription.plan.code : PlanCode.FREE;
};

export const queuePriority = (subscription: Subscription, scanType: ScanType) => {
  if (env.ENVIRONMENT === 'onpremise') {
    // We run CLI and 'dashboard triggered' scans with lower priority because we want our pre-hook scans to run with a higher priority and finish first.
    return scanType === ScanType.PRE_HOOK ? 2 : 1;
  }

  const planCode = lodashGet(subscription, 'plan.code');

  return [PlanCode.BUSINESS, PlanCode.PROFESSIONAL].includes(planCode) &&
    isSubscriptionActive(subscription)
    ? 2
    : 1;
};

/**
 * Returns the value for a given feature which can be boolean (enabled/disabled) a number (like amount of private repositories)
 * @param {*} subscription - This is the account's subscription which should have the current plan + the plan features inside
 * @param {*} featureName - This is the feautre name to get the value from (see PLAN_FEATURES enum)
 */
export const getFeatureValue = async (subscription: Subscription, featureName: PlanFeatureName) => {
  if (env.ENVIRONMENT === 'onpremise') {
    switch (featureName) {
      case PlanFeatureName.LANG_EXCLUSIONS:
        return [];
      case PlanFeatureName.RETENTION:
        return undefined;
      case PlanFeatureName.PRIVATE_REPOSITORIES:
        return env.ONPREMISE_MAX_DEVS !== 0 ? Number.MAX_SAFE_INTEGER : env.ONPREMISE_MAX_REPOS;
      default:
        return true;
    }
  }

  let features: PlanFeature[];
  if (isSubscriptionActive(subscription)) {
    features = subscription.plan.features;
  } else {
    const planWhenNotActive = isLegacyPlan(subscription.plan.code)
      ? PlanCode.OPEN_SOURCE
      : PlanCode.FREE;
    features = await findPlanFeaturesByPlanCode(planWhenNotActive);
  }

  const feature = features.find(f => f.feature === featureName);
  if (!feature) {
    throw Error(
      `PlanFeature with name = ${featureName} not found for plan with id = ${subscription.plan.idPlan}`
    );
  }

  const { value } = feature;

  switch (featureName) {
    case PlanFeatureName.LANG_EXCLUSIONS:
      return value.split(',');
    case PlanFeatureName.RETENTION:
      return value === PLAN_FEATURES_SPECIAL_VALUES.UNLIMITED ? undefined : parseInt(value, 10);
    case PlanFeatureName.PRIVATE_REPOSITORIES:
      return value === PLAN_FEATURES_SPECIAL_VALUES.UNLIMITED
        ? Number.MAX_SAFE_INTEGER
        : parseInt(value, 10) + (subscription.extraRepositories || 0);
    default:
      return value;
  }
};
