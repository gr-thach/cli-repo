import boom from '@hapi/boom';
import { Request, Response } from 'express';
import StripeService from '../services/stripe';
import StripeWebhookService from '../services/stripeWebhook';

export const webhook = async (req: Request, res: Response) => {
  const stripeService = new StripeService();

  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripeService.validateAndGetEvent(req.rawBody, String(sig));
  } catch (e) {
    throw boom.badRequest(`Webhook Error: ${(e as Error).message}`);
  }

  const webhookService = new StripeWebhookService(stripeService);

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
