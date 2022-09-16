import { Request, Response } from 'express';
import boom from '@hapi/boom';
import lodashGet from 'lodash/get';
import StripeService from '../services/stripe';
import { constants } from '../../config';
import { attachPaymentMethodToCustomer } from '../helpers/billing';
import { updateSubscription } from '../helpers/core-api/subscriptions';
import { findPlanById } from '../helpers/core-api/plans';
import { constructAccountPIDUrl } from '../helpers/common';

export const savePaymentMethod = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const {
    body: { paymentMethodId },
    account,
    userInDb
  } = req;

  await attachPaymentMethodToCustomer(account!, paymentMethodId, userInDb!);

  return res.status(200).send({ saved: true });
};

export const getPaymentMethod = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const { account } = req;

  const { subscription } = account!;
  const { stripeSubscriptionId } = subscription;
  let { stripeCustomerId } = subscription;

  if (!stripeCustomerId && !stripeSubscriptionId) {
    throw boom.notFound('Account has no Customer, Subscription or Payment method associated.');
  }

  const stripeService = new StripeService();
  // When having no customer id but a subscription id means that the account is coming from previous model
  // when we didn't store the customer id, so we retrieve it from the subscription and we update the account
  // here, because we will always request payment method when the user go to subscription page
  if (stripeSubscriptionId && !stripeCustomerId) {
    const stripeSubscription = await stripeService.getSubscription(stripeSubscriptionId);
    stripeCustomerId = stripeSubscription.customer as string;
    await updateSubscription(subscription.idSubscription, { stripeCustomerId });
  }

  const stripeCustomer = await stripeService.getCustomer(stripeCustomerId, {
    // @ts-ignore
    expand: ['invoice_settings.default_payment_method']
  });

  let card = lodashGet(stripeCustomer, 'invoice_settings.default_payment_method.card');
  if (!card) {
    const paymentMethods = await stripeService.getPaymentMethods(stripeCustomerId);
    card = lodashGet(paymentMethods, '[0].card');
    if (!card) {
      throw boom.notFound('Customer has no payment method attached.');
    }
  }

  const { last4, exp_month, exp_year, brand } = card;

  return res.status(200).send({ brand, last4, expMonth: exp_month, expYear: exp_year });
};

export const redirectToBillingPortal = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const { account } = req;

  if (!account!.subscription.stripeCustomerId) {
    throw boom.notFound('Account has no active Subscription associated.');
  }

  const stripeService = new StripeService();
  const session = await stripeService.createBillingPortalSession(
    account!.subscription.stripeCustomerId,
    `${constants.dashboardBaseUrl}/${constructAccountPIDUrl(account!)}/settings/subscription`
  );

  return res.redirect(session.url);
};

export const checkCoupon = async (req: Request, res: Response) => {
  const {
    body: { code, planId }
  } = req;

  const stripeService = new StripeService();
  const promoCode = await stripeService.getActivePromoCodeByCode(code);
  if (!promoCode) {
    throw boom.notFound('No Coupon has been found for the entered promotion code.');
  }
  const {
    coupon: { name, percent_off, applies_to }
  } = promoCode;

  if (applies_to && applies_to.products && applies_to.products.length) {
    const plan = await findPlanById(planId);
    if (!plan) {
      throw boom.notFound('The Plan to apply this promotion code has not been found.');
    }

    const stripeProducts = await stripeService.getProducts({ ids: applies_to.products });
    const allowedProducts = stripeProducts.filter(sp => sp.metadata.GR_PRODUCT === plan.code);

    if (!allowedProducts.length) {
      throw boom.notFound('No applicable Coupon has been found for the selected plan.');
    }
  }

  return res.status(200).send({ promoCode: promoCode.code, name, percentOff: percent_off });
};
