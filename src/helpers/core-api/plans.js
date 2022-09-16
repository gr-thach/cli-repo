const get = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { grPlanFragment } = require('./fragments');

const findAllPlans = async () => {
  const query = gql`
    query {
      grPlans(orderBy: ID_PLAN_ASC, condition: { active: true, deletedAt: null }) {
        nodes {
          ...GrPlanFragment
          features: planFeaturesByFkPlan {
            nodes {
              feature
              value
            }
          }
        }
      }
    }
    ${grPlanFragment}
  `;
  const { data } = await coreAxios.post('/graphql', { query });
  const plans = get(data, 'data.grPlans.nodes');
  return plans.map(plan => ({
    ...plan,
    features: get(plan, 'features.nodes', [])
  }));
};

const findPlanById = async idPlan => {
  const query = gql`
    query($idPlan: Int!) {
      grPlan(idPlan: $idPlan) {
        ...GrPlanFragment
      }
    }
    ${grPlanFragment}
  `;
  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: { idPlan }
  });
  return get(data, 'data.grPlan');
};

const findPlanByCode = async code => {
  const query = gql`
    query($code: String!) {
      grPlans(condition: { code: $code }) {
        nodes {
          ...GrPlanFragment
        }
      }
    }
    ${grPlanFragment}
  `;
  const { data } = await coreAxios.post('/graphql', {
    query,
    variables: { code }
  });
  return get(data, 'data.grPlans.nodes[0]');
};

module.exports = {
  findAllPlans: wrapper(findAllPlans),
  findPlanById: wrapper(findPlanById),
  findPlanByCode: wrapper(findPlanByCode)
};
