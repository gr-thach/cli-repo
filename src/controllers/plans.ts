import { Request, Response } from 'express';
import StripeService from '../services/stripe';
import { findAllPlans } from '../helpers/core-api/plans';
import { mapPlansWithStripePrices } from '../helpers/plans';

export const list = async (req: Request<any, any, any, { accountId: string }>, res: Response) => {
  const stripeService = new StripeService();

  const [plans, stripePrices] = await Promise.all([
    findAllPlans(),
    stripeService.getAllPrices(true)
  ]);

  return res.status(200).send(mapPlansWithStripePrices(plans, stripePrices));
};
