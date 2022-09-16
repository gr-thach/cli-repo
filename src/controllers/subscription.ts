import { Request, Response } from 'express';
import boom from '@hapi/boom';
import lodashGet from 'lodash/get';
import StripeService from '../services/stripe';
import { findStripePriceByPlanAndInterval } from '../helpers/plans';
import { validateAndRetrieveEntities } from '../helpers/subscriptionValidations';
import {
  changePlan,
  cancelPlan,
  updateCancelAtPeriodEnd,
  freeTrialDaysOptions
} from '../helpers/subscription';
import { findSubscriptionChangelogsByAccountId } from '../helpers/core-api/subscriptionChangelogs';
import { SubscriptionInterval } from '../interfaces';

export const update = async (
  req: Request<any, any, any, { freeTrial: string; interval: string; promoCode: string }>,
  res: Response
) => {
  const {
    body: { freeTrial, interval, promoCode },
    account,
    userInDb
  } = req;

  const { newPlan, checkoutFields } = await validateAndRetrieveEntities(
    req.body,
    account!,
    userInDb!
  );

  const newStripePrice = await findStripePriceByPlanAndInterval(newPlan, interval);
  if (!newStripePrice) {
    throw boom.badRequest('No Stripe plan matched for the requested plan');
  }

  const freeTrialDays = freeTrial ? lodashGet(freeTrialDaysOptions, freeTrial, null) : null;
  const result = await changePlan(
    newStripePrice,
    newPlan,
    account!,
    userInDb!,
    checkoutFields,
    freeTrialDays,
    promoCode
  );
  if (!result) {
    boom.notFound("The plan couldn't be updated. Please contact GuardRails support.");
  }
  return res.status(200).send(result);
};

export const cancel = async (req: Request, res: Response) => {
  const { account, userInDb } = req;

  const {
    subscription: { stripeSubscriptionId, status }
  } = account!;

  if (!stripeSubscriptionId) {
    throw boom.badRequest(
      "You haven't subscribed to a plan yet, there is no subscription to be cancelled."
    );
  }

  const stripeService = new StripeService();

  if (status === 'trialing') {
    await cancelPlan(account!, 'deleted', userInDb!);
    await stripeService.cancelSubscription(stripeSubscriptionId);
  } else {
    await updateCancelAtPeriodEnd(account!, true, userInDb!);
    await stripeService.cancelSubscriptionAtPeriodEnd(stripeSubscriptionId);
  }

  return res.status(200).send({ cancelled: true });
};

export const renew = async (req: Request, res: Response) => {
  const { account, userInDb } = req;

  const { subscription } = account!;

  if (!subscription.stripeSubscriptionId) {
    throw boom.badRequest(
      "You haven't subscribed to a plan yet, there is no subscription to be renewed."
    );
  }

  await updateCancelAtPeriodEnd(account!, false, userInDb!);

  const stripeService = new StripeService();
  await stripeService.renewSubscription(subscription.stripeSubscriptionId);

  return res.status(200).send({ renewed: true });
};

export const toggleInterval = async (req: Request, res: Response) => {
  const { account, userInDb } = req;

  const {
    subscription: { stripeSubscriptionId, interval, plan }
  } = account!;
  if (!stripeSubscriptionId) {
    throw boom.notFound('Account has no active Subscription associated.');
  }

  const newStripeInterval = interval === SubscriptionInterval.YEARLY ? 'month' : 'year';
  const newStripePrice = await findStripePriceByPlanAndInterval(plan, newStripeInterval);
  if (!newStripePrice) {
    throw boom.badRequest('No Stripe plan matched for the requested plan');
  }

  const result = await changePlan(newStripePrice, plan, account!, userInDb!);
  if (!result.updated) {
    boom.notFound("The plan couldn't be updated. Please contact GuardRails support.");
  }
  return res.status(200).send({ updated: result.updated });
};

export const listChangelogs = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const { account } = req;

  const changelogs = await findSubscriptionChangelogsByAccountId(account!.idAccount);

  return res.status(200).send(changelogs);
};
