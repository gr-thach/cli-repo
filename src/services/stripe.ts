import Stripe from 'stripe';
import lodashGet from 'lodash/get';
import { env } from '../../config';

class StripeService {
  stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2020-03-02' });
  }

  async updateSubscriptionPrice(
    currentStripeSubscription: Stripe.Subscription,
    newStripePrice: Stripe.Price,
    accountId: number,
    trialEnd: number | undefined,
    promoCodeId: string | undefined,
    shouldDeleteOldPrice = false
  ) {
    const { items: currentItems } = currentStripeSubscription;

    if (!currentItems.data.length) return currentStripeSubscription;

    let items;
    // for legacy plans we need to delete the previous item and create a new one, that's why we have this param here
    if (shouldDeleteOldPrice) {
      items = [{ id: currentItems.data[0].id, deleted: true }, { price: newStripePrice.id }];
    } else {
      items = [{ id: currentItems.data[0].id, price: newStripePrice.id }];
    }

    return this.updateSubscription(currentStripeSubscription.id, {
      items,
      metadata: {
        GR_ACCOUNT_ID: accountId
      },
      ...(trialEnd && { trial_end: trialEnd }),
      ...(promoCodeId && { promotion_code: promoCodeId }),
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent']
    });
  }

  async getAllPlans() {
    const { data: stripePlans } = await this.stripe.plans.list({ active: true, limit: 100 });
    return stripePlans;
  }

  async getAllPrices(includeTiers = false) {
    const { data: stripePrices } = await this.stripe.prices.list({
      active: true,
      limit: 100,
      ...(includeTiers && { expand: ['data.tiers'] })
    });
    return stripePrices;
  }

  async getCustomer(customerId: string, options?: Stripe.RequestOptions) {
    return this.stripe.customers.retrieve(customerId, options);
  }

  async createCustomer(params: Stripe.CustomerCreateParams) {
    return this.stripe.customers.create(params);
  }

  async updateCustomer(customerId: string, params: Stripe.CustomerUpdateParams) {
    return this.stripe.customers.update(customerId, params);
  }

  async getSubscription(subscriptionId: string, options?: Stripe.RequestOptions) {
    return this.stripe.subscriptions.retrieve(subscriptionId, options);
  }

  async createSubscription(params: Stripe.SubscriptionCreateParams) {
    return this.stripe.subscriptions.create(params);
  }

  async updateSubscription(subscriptionId: string, params: Stripe.SubscriptionUpdateParams) {
    return this.stripe.subscriptions.update(subscriptionId, params);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.del(subscriptionId);
  }

  async cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }

  async renewSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false
    });
  }

  async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
  }

  async getPaymentMethods(customerId: string) {
    const { data: paymentMethods } = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });
    return paymentMethods;
  }

  async createBillingPortalSession(customerId: string, returnUrl: string) {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  }

  async getActivePromoCodeByCode(code: string) {
    const { data: promoCodes } = await this.stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.coupon.applies_to']
    });
    return lodashGet(promoCodes, '[0]', null);
  }

  async getProducts(options?: Stripe.ProductListParams) {
    const { data: stripeProducts } = await this.stripe.products.list({
      active: true,
      limit: 100,
      ...options
    });
    return stripeProducts;
  }

  validateAndGetEvent(body: string | Buffer, sig: string) {
    return this.stripe.webhooks.constructEvent(body, sig, env.STRIPE_ENDPOINT_SECRET);
  }
}

export default StripeService;
