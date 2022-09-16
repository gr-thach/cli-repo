import lodashGet from 'lodash/get';
import { coreAxios, wrapper, gql } from './index';

export const listGrRules = wrapper(async () => {
  const query = gql`
    query {
      rules(orderBy: NAME_ASC) {
        nodes {
          idRule
          name
          title
          enable
        }
      }
    }
  `;

  const { data } = await coreAxios.post('/graphql', { query });
  return lodashGet(data, 'data.rules.nodes');
});
