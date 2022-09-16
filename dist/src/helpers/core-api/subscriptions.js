"use strict";
const lodashGet = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const createSubscriptions = async (subscriptions) => {
    const query = gql `
    mutation createSubscription($input: CreateSubscriptionInput!) {
      createSubscription(input: $input) {
        subscription {
          idSubscription
        }
      }
    }
  `;
    const { data } = await coreAxios.post('/graphql', subscriptions.map(x => ({ query, variables: { input: { subscription: x } } })));
    return data.map(x => x.data.createSubscription.subscription);
};
const updateSubscription = async (idSubscription, patch) => {
    const query = gql `
    mutation updateSubscription($input: UpdateSubscriptionInput!) {
      updateSubscription(input: $input) {
        subscription {
          idSubscription
        }
      }
    }
  `;
    const variables = {
        input: {
            idSubscription,
            patch
        }
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return lodashGet(data, 'data.updateSubscription.subscription');
};
module.exports = {
    updateSubscription: wrapper(updateSubscription),
    createSubscriptions: wrapper(createSubscriptions)
};
//# sourceMappingURL=subscriptions.js.map