import get from 'lodash/get';
import { v4 as uuid } from 'uuid';
import { coreAxios, wrapper, gql } from './index';
import { engineAccountConfigFragment } from './fragments';
import { EngineConfig } from '../../interfaces';

export const getEngineAccountConfig = wrapper(async (idEngineConfig: string, accountId: number) => {
  const query = gql`
    query($idEngineConfig: UUID!, $accountId: Int!) {
      engineAccountConfigs(
        condition: { idEngineAccountConfig: $idEngineConfig, fkAccount: $accountId }
        first: 1
      ) {
        nodes {
          ...EngineAccountConfigFragment
        }
      }
    }
    ${engineAccountConfigFragment}
  `;

  const variables = { idEngineConfig, accountId };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return get(data, 'data.engineAccountConfigs.nodes[0]');
});

export const createEngineAccountConfig = wrapper(
  async (
    engineId: number,
    fkEngineConfigSpec: string,
    accountId: number,
    { rules, envVars }: Partial<Pick<EngineConfig, 'rules' | 'envVars'>>
  ) => {
    const query = gql`
      mutation createEngineAccountConfig($input: CreateEngineAccountConfigInput!) {
        createEngineAccountConfig(input: $input) {
          engineAccountConfig {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${engineAccountConfigFragment}
    `;

    const variables = {
      input: {
        engineAccountConfig: {
          idEngineAccountConfig: uuid(),
          rules,
          envVars,
          fkAccount: accountId,
          fkEngine: engineId,
          fkEngineConfigSpec,
          createdAt: new Date().toJSON(),
          updatedAt: new Date().toJSON()
        }
      }
    };

    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.createEngineAccountConfig.engineAccountConfig');
  }
);

export const updateEngineAccountConfig = wrapper(
  async (idEngineConfig: string, patch: Partial<Pick<EngineConfig, 'rules' | 'envVars'>>) => {
    if (!patch) {
      throw new Error(
        `Patch was null or undefined when updating engine account config '${idEngineConfig}'.`
      );
    }

    const query = gql`
      mutation updateEngineAccountConfig($input: UpdateEngineAccountConfigInput!) {
        updateEngineAccountConfig(input: $input) {
          engineAccountConfig {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${engineAccountConfigFragment}
    `;
    const variables = {
      input: {
        idEngineAccountConfig: idEngineConfig,
        patch: {
          ...patch,
          updatedAt: new Date().toJSON()
        }
      }
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.updateEngineAccountConfig.engineAccountConfig');
  }
);

export const listEngineAccountConfig = wrapper(
  async (accountId: number): Promise<EngineConfig[]> => {
    const query = gql`
      query($accountId: Int!) {
        engineAccountConfigs(condition: { fkAccount: $accountId }) {
          nodes {
            ...EngineAccountConfigFragment
          }
        }
      }
      ${engineAccountConfigFragment}
    `;

    const variables = {
      accountId
    };

    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.engineAccountConfigs.nodes');
  }
);

export const queryCustomConfigSpecs = wrapper(
  async (accountId: number): Promise<EngineConfig[]> => {
    const query = gql`
      query($filter: EngineConfigSpecFilter!) {
        engineConfigSpecs(filter: $filter) {
          nodes {
            specId: idEngineConfigSpec
            format: validator
            validation
            filename
            engine: engineByFkEngine {
              idEngine
              name
              language
            }
          }
        }
      }
    `;

    const variables = {
      filter: {
        // we look for all specs from default engines and custom engines that this account has access to
        engineByFkEngine: {
          or: [{ fkAccount: { equalTo: accountId } }, { fkAccount: { isNull: true } }]
        }
      }
    };

    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.engineConfigSpecs.nodes');
  }
);

export const fetchCustomConfigSpec = wrapper(
  async (idEngineConfigSpec: string): Promise<EngineConfig> => {
    const query = gql`
      query($id: UUID!) {
        engineConfigSpecs(condition: { idEngineConfigSpec: $id, deletedAt: null }) {
          nodes {
            specId: idEngineConfigSpec
            format: validator
            validation
            filename
            engine: engineByFkEngine {
              idEngine
              name
              language
            }
          }
        }
      }
    `;
    const variables = { id: idEngineConfigSpec };

    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.engineConfigSpecs.nodes[0]');
  }
);
