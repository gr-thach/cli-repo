"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeatureValue = exports.queuePriority = exports.getAccountPlanCode = exports.isSubscriptionActive = exports.cancelPlan = exports.updateCancelAtPeriodEnd = exports.changePlan = exports.updateSubscriptionAndChangelog = exports.isLegacyPlan = exports.freeTrialDaysOptions = void 0;
const get_1 = __importDefault(require("lodash/get"));
const stripe_1 = __importDefault(require("../services/stripe"));
const config_1 = require("../../config");
const plans_1 = require("./plans");
const enums_1 = require("./core-api/enums");
const subscriptionChangelogs_1 = require("./core-api/subscriptionChangelogs");
const subscriptions_1 = require("./core-api/subscriptions");
const plans_2 = require("./core-api/plans");
const planFeatures_1 = require("./core-api/planFeatures");
const interfaces_1 = require("../interfaces");
const LEGACY_PLAN_CODES = [
    interfaces_1.PlanCode.OPEN_SOURCE,
    interfaces_1.PlanCode.INDIVIDUAL,
    interfaces_1.PlanCode.STARTUP,
    interfaces_1.PlanCode.BUSINESS
];
// This is hardcoded here to avoid users to be able to send us a number and set a trial for whatever they want.
// Only these 3 options are available and only if the customer have one of these UUIDs they can extend up to 60 days.
// Is not fancy, but it's an easy way to manage this for now.
exports.freeTrialDaysOptions = {
    '53ca00fa-2669-4eec-ae91-eed541112684': 14,
    '96602fd7-3579-46b7-a934-211a10deb956': 30,
    '9a3e3a21-046b-4f84-98e4-c55785671cb9': 60
};
const isLegacyPlan = (planCode) => LEGACY_PLAN_CODES.includes(planCode);
exports.isLegacyPlan = isLegacyPlan;
const updateSubscriptionAndChangelog = async ({ changelogEvent, account, stripeSubscription = null, interval, plan, userInDb = null, trialEnd = null, isCheckoutCompleted = null, changelogStatus = null, cancelAtPeriodEnd = null }) => {
    const patch = {
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
        patch.stripeCustomerId = stripeSubscription.customer;
    }
    await (0, subscriptions_1.updateSubscription)(account.subscription.idSubscription, patch);
    await (0, subscriptionChangelogs_1.createSubscriptionChangelog)({
        fkAccount: account.idAccount,
        fkPlan: plan.idPlan,
        fkUser: userInDb ? userInDb.idUser : null,
        subscriptionStatus: changelogStatus || stripeSubscription?.status,
        subscriptionEvent: changelogEvent,
        subscriptionInterval: interval,
        createdAt: new Date().toJSON()
    });
};
exports.updateSubscriptionAndChangelog = updateSubscriptionAndChangelog;
const createOrUpdateCustomer = async (stripeCustomerId, accountId, userId, email, name) => {
    let customerId = stripeCustomerId;
    const customerData = {
        ...(email && { email }),
        ...(name && { name }),
        metadata: { GR_ACCOUNT_ID: accountId, GR_USER_ID: userId }
    };
    const stripeService = new stripe_1.default();
    if (customerId) {
        await stripeService.updateCustomer(customerId, customerData);
    }
    else {
        const { id: newCustomerId } = await stripeService.createCustomer(customerData);
        customerId = newCustomerId;
    }
    return customerId;
};
const attachOrUpdatePaymentMethod = async (customerId, paymentMethodId) => {
    let isCheckoutCompleted = null;
    if (paymentMethodId) {
        const stripeService = new stripe_1.default();
        await stripeService.attachPaymentMethodToCustomer(paymentMethodId, customerId);
        isCheckoutCompleted = true;
    }
    return isCheckoutCompleted;
};
const getTrialEnd = (freeTrialDays) => {
    let trialEnd;
    if (freeTrialDays) {
        const now = new Date();
        trialEnd = Math.floor(now.setDate(now.getDate() + freeTrialDays) / 1000);
    }
    return trialEnd;
};
const getPromoCode = async (promoCode) => {
    let promoCodeId;
    if (promoCode) {
        const stripeService = new stripe_1.default();
        ({ id: promoCodeId } = await stripeService.getActivePromoCodeByCode(promoCode));
    }
    return promoCodeId;
};
const createOrUpdateSubscription = async (account, newStripePrice, customerId, trialEnd, promoCodeId) => {
    const { subscription: { stripeSubscriptionId, plan } } = account;
    const stripeService = new stripe_1.default();
    let stripeSubscription;
    if (stripeSubscriptionId) {
        stripeSubscription = await stripeService.getSubscription(stripeSubscriptionId);
        stripeSubscription = await stripeService.updateSubscriptionPrice(stripeSubscription, newStripePrice, account.idAccount, trialEnd, promoCodeId, (0, exports.isLegacyPlan)(plan.code));
    }
    else {
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
        if (pending_setup_intent &&
            pending_setup_intent.status === 'requires_action') {
            threeDPayment = {
                paymentMethodId: pending_setup_intent.payment_method,
                clientSecret: pending_setup_intent.client_secret
            };
        }
        return { updated: true, stripeSubscription, threeDPayment };
    }
    return { updated: false };
};
const changePlan = async (newStripePrice, newPlan, account, userInDb, checkoutFields = null, freeTrialDays = null, promoCode = null) => {
    const { subscription: { stripeCustomerId } } = account;
    const { email, name } = checkoutFields || {};
    const customerId = await createOrUpdateCustomer(stripeCustomerId, account.idAccount, userInDb.idUser, email, name);
    const isCheckoutCompleted = await attachOrUpdatePaymentMethod(customerId, checkoutFields?.paymentMethodId);
    let trialEnd;
    // For free plan we don't use Free Trials
    if (newPlan.code !== interfaces_1.PlanCode.FREE) {
        trialEnd = getTrialEnd(freeTrialDays);
    }
    const promoCodeId = await getPromoCode(promoCode);
    const result = await createOrUpdateSubscription(account, newStripePrice, customerId, trialEnd, promoCodeId);
    const { stripeSubscription, ...restResult } = result;
    // If subscription got created/updated properly: Update GR Subscription + Create new ChangeLog record
    if (restResult.updated) {
        const newInterval = (0, plans_1.stripeIntervalToIntervalEnum)(newStripePrice.recurring?.interval || 'month');
        await (0, exports.updateSubscriptionAndChangelog)({
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
exports.changePlan = changePlan;
const updateCancelAtPeriodEnd = async (account, cancelAtPeriodEnd, userInDb) => {
    await (0, subscriptions_1.updateSubscription)(account.subscription.idSubscription, {
        cancelAtPeriodEnd,
        updatedAt: new Date().toJSON()
    });
    await (0, subscriptionChangelogs_1.createSubscriptionChangelog)({
        fkAccount: account.idAccount,
        fkPlan: account.subscription.plan.idPlan,
        fkUser: userInDb ? userInDb.idUser : null,
        subscriptionStatus: account.subscription.status,
        subscriptionEvent: cancelAtPeriodEnd ? 'cancelAtPeriodEnd' : 'renew',
        subscriptionInterval: account.subscription.interval,
        createdAt: new Date().toJSON()
    });
};
exports.updateCancelAtPeriodEnd = updateCancelAtPeriodEnd;
const cancelPlan = async (account, stripeSubscriptionStatus, userInDb) => {
    // back to free
    const freePlan = await (0, plans_2.findPlanByCode)(interfaces_1.PlanCode.FREE);
    await (0, exports.updateSubscriptionAndChangelog)({
        changelogEvent: 'deleted',
        account,
        stripeSubscription: null,
        interval: interfaces_1.SubscriptionInterval.YEARLY,
        plan: freePlan,
        userInDb,
        changelogStatus: stripeSubscriptionStatus,
        cancelAtPeriodEnd: false
    });
};
exports.cancelPlan = cancelPlan;
const isSubscriptionActive = (subscription) => ['active', 'trialing'].includes((0, get_1.default)(subscription, 'status') || '');
exports.isSubscriptionActive = isSubscriptionActive;
const getAccountPlanCode = (account) => {
    const { subscription } = account;
    return (0, exports.isSubscriptionActive)(subscription) ? subscription.plan.code : interfaces_1.PlanCode.FREE;
};
exports.getAccountPlanCode = getAccountPlanCode;
const queuePriority = (subscription, scanType) => {
    if (config_1.env.ENVIRONMENT === 'onpremise') {
        // We run CLI and 'dashboard triggered' scans with lower priority because we want our pre-hook scans to run with a higher priority and finish first.
        return scanType === interfaces_1.ScanType.PRE_HOOK ? 2 : 1;
    }
    const planCode = (0, get_1.default)(subscription, 'plan.code');
    return [interfaces_1.PlanCode.BUSINESS, interfaces_1.PlanCode.PROFESSIONAL].includes(planCode) &&
        (0, exports.isSubscriptionActive)(subscription)
        ? 2
        : 1;
};
exports.queuePriority = queuePriority;
/**
 * Returns the value for a given feature which can be boolean (enabled/disabled) a number (like amount of private repositories)
 * @param {*} subscription - This is the account's subscription which should have the current plan + the plan features inside
 * @param {*} featureName - This is the feautre name to get the value from (see PLAN_FEATURES enum)
 */
const getFeatureValue = async (subscription, featureName) => {
    if (config_1.env.ENVIRONMENT === 'onpremise') {
        switch (featureName) {
            case interfaces_1.PlanFeatureName.LANG_EXCLUSIONS:
                return [];
            case interfaces_1.PlanFeatureName.RETENTION:
                return undefined;
            case interfaces_1.PlanFeatureName.PRIVATE_REPOSITORIES:
                return config_1.env.ONPREMISE_MAX_DEVS !== 0 ? Number.MAX_SAFE_INTEGER : config_1.env.ONPREMISE_MAX_REPOS;
            default:
                return true;
        }
    }
    let features;
    if ((0, exports.isSubscriptionActive)(subscription)) {
        features = subscription.plan.features;
    }
    else {
        const planWhenNotActive = (0, exports.isLegacyPlan)(subscription.plan.code)
            ? interfaces_1.PlanCode.OPEN_SOURCE
            : interfaces_1.PlanCode.FREE;
        features = await (0, planFeatures_1.findPlanFeaturesByPlanCode)(planWhenNotActive);
    }
    const feature = features.find(f => f.feature === featureName);
    if (!feature) {
        throw Error(`PlanFeature with name = ${featureName} not found for plan with id = ${subscription.plan.idPlan}`);
    }
    const { value } = feature;
    switch (featureName) {
        case interfaces_1.PlanFeatureName.LANG_EXCLUSIONS:
            return value.split(',');
        case interfaces_1.PlanFeatureName.RETENTION:
            return value === enums_1.PLAN_FEATURES_SPECIAL_VALUES.UNLIMITED ? undefined : parseInt(value, 10);
        case interfaces_1.PlanFeatureName.PRIVATE_REPOSITORIES:
            return value === enums_1.PLAN_FEATURES_SPECIAL_VALUES.UNLIMITED
                ? Number.MAX_SAFE_INTEGER
                : parseInt(value, 10) + (subscription.extraRepositories || 0);
        default:
            return value;
    }
};
exports.getFeatureValue = getFeatureValue;
//# sourceMappingURL=subscription.js.map