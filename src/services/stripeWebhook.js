/* eslint-disable class-methods-use-this */
import boom from '@hapi/boom';
import { findAccountById } from '../helpers/core-api/accounts';
import { updateSubscriptionAndChangelog, cancelPlan } from '../helpers/subscription';

class StripeWebhookService {
  constructor(stripeService) {
    this.stripeService = stripeService;
  }

  async subscriptionUpdated(event) {
    const stripeSubscription = event.data.object;
    const {
      metadata: { GR_ACCOUNT_ID: idAccount }
    } = stripeSubscription;

    if (!idAccount) {
      throw boom.notFound('Stripe subscription updated webhook: no GR_ACCOUNT_ID in metadata.');
    }

    const account = await findAccountById(idAccount);
    if (!account) {
      throw boom.notFound(
        `Stripe subscription updated webhook: Account with ID = [${idAccount}] not found.`
      );
    }

    const { subscription } = account;
    if (!subscription) {
      throw boom.notFound(
        `Stripe subscription updated webhook: Account with ID = [${idAccount}] has no subscription.`
      );
    }

    const currentPeriodStart = new Date(subscription.periodStart).toJSON();
    const newPeriodStart = new Date(stripeSubscription.current_period_start * 1000).toJSON();
    const currentPeriodEnd = new Date(subscription.periodEnd).toJSON();
    const newPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toJSON();
    const newStatus = stripeSubscription.status;

    if (
      subscription.status === newStatus &&
      currentPeriodStart === newPeriodStart &&
      currentPeriodEnd === newPeriodEnd
    ) {
      // eslint-disable-next-line no-console
      console.log('Stripe webhook - Nothing to update');
      return;
    }

    await updateSubscriptionAndChangelog({
      changelogEvent: 'updated',
      account,
      stripeSubscription,
      interval: subscription.interval,
      plan: subscription.plan
    });
  }

  async subscriptionDeleted(event) {
    const stripeSubscription = event.data.object;
    const {
      metadata: { GR_ACCOUNT_ID: idAccount }
    } = stripeSubscription;

    if (!idAccount) {
      throw boom.notFound('Stripe subscription updated webhook: no GR_ACCOUNT_ID in metadata.');
    }

    const account = await findAccountById(idAccount);
    if (!account) {
      throw boom.notFound(
        `Stripe subscription deleted webhook: Account = [${idAccount}] not found.`
      );
    }

    const { subscription } = account;
    if (subscription.stripeSubscriptionId !== stripeSubscription.id) {
      throw boom.notFound(
        "Stripe subscription deleted webhook: This subscription is not longer related to this account. It's probably a Cancelled free trial. We will ignore this."
      );
    }

    await cancelPlan(account, stripeSubscription.status);
  }
}

export default StripeWebhookService;
