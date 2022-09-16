import lodashGet from 'lodash/get';
import { CustomEngineRuleDao, CustomEngineRuleSchema } from '../../interfaces';

const { coreAxios, wrapper, gql } = require('./index');

export const upsertEngineRules = wrapper(async (customEngineRules: CustomEngineRuleSchema[]) => {
  const res = await coreAxios.post('/custom-engine-rules', { customEngineRules });
  return res;
});

export const deleteEngineRules = wrapper(async (customEngineRules: CustomEngineRuleSchema[]) => {
  const { data } = await coreAxios.delete('/custom-engine-rules', {
    data: { customEngineRules }
  });

  return data;
});

export const findCustomEngineRules = wrapper(async (accountId: number, engineId: number) => {
  const query = gql`
    query($accountId: Int!, $engineId: Int!) {
      customEngineRules(condition: { fkAccount: $accountId, fkEngine: $engineId }) {
        nodes {
          idCustomEngineRule
          name
          rule: ruleByFkRule {
            name
          }
          docs
          enable
        }
      }
    }
  `;

  const variables = {
    accountId,
    engineId
  };

  const { data } = await coreAxios.post('/graphql', { query, variables });
  return lodashGet<CustomEngineRuleDao[]>(data, 'data.customEngineRules.nodes', []).map(cer => ({
    ...cer,
    grId: cer.rule.name
  }));
});
