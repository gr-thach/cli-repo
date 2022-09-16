const lodashGet = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { subscriptionChangelogFragment } = require('./fragments');

const findSubscriptionChangelogsByAccountId = async idAccount => {
  const query = gql`
    query($idAccount: Int!) {
      subscriptionChangelogs(condition: { fkAccount: $idAccount }, orderBy: CREATED_AT_DESC) {
        nodes {
          ...SubscriptionChangelogFragment
        }
      }
    }
    ${subscriptionChangelogFragment}
  `;

  const variables = { idAccount: parseInt(idAccount, 10) };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return lodashGet(data, 'data.subscriptionChangelogs.nodes', []);
};

const createSubscriptionChangelog = async subscriptionChangelog => {
  const query = gql`
    mutation createSubscriptionChangelog($input: CreateSubscriptionChangelogInput!) {
      createSubscriptionChangelog(input: $input) {
        subscriptionChangelog {
          idSubscriptionChangelog
        }
      }
    }
  `;
  const variables = { input: { subscriptionChangelog } };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return lodashGet(data, 'data.createSubscription.subscriptionChangelog');
};

const createSubscriptionChangelogs = async subscriptionChangelogs => {
  const query = gql`
    mutation createSubscriptionChangelog($input: CreateSubscriptionChangelogInput!) {
      createSubscriptionChangelog(input: $input) {
        subscriptionChangelog {
          idSubscriptionChangelog
        }
      }
    }
  `;
  const { data } = await coreAxios.post(
    '/graphql',
    subscriptionChangelogs.map(x => ({ query, variables: { input: { subscriptionChangelog: x } } }))
  );
  return data.map(x => x.data.createSubscriptionChangelog.subscriptionChangelog);
};

module.exports = {
  createSubscriptionChangelog: wrapper(createSubscriptionChangelog),
  createSubscriptionChangelogs: wrapper(createSubscriptionChangelogs),
  findSubscriptionChangelogsByAccountId: wrapper(findSubscriptionChangelogsByAccountId)
};
