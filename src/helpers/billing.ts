import { User, Account } from '../interfaces';
import StripeService from '../services/stripe';
import { createSubscriptionChangelog } from './core-api/subscriptionChangelogs';
import { updateSubscription } from './core-api/subscriptions';

export const attachPaymentMethodToCustomer = async (
  account: Account,
  paymentMethodId: string,
  userInDb: User
) => {
  const { subscription } = account;
  const stripeService = new StripeService();
  await stripeService.attachPaymentMethodToCustomer(paymentMethodId, subscription.stripeCustomerId);

  await updateSubscription(account.subscription.idSubscription, {
    isCheckoutCompleted: true,
    updatedAt: new Date().toJSON()
  });

  await createSubscriptionChangelog({
    fkAccount: account.idAccount,
    fkPlan: subscription.plan.idPlan,
    fkUser: userInDb ? userInDb.idUser : null,
    subscriptionStatus: subscription.status,
    subscriptionEvent: 'paymentMethodSaved',
    subscriptionInterval: subscription.interval,
    createdAt: new Date().toJSON()
  });
};
