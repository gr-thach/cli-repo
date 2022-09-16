import get from 'lodash/get';

import { coreAxios, wrapper, gql } from './index';
import { findingFragment } from './fragments';
import { Finding, Scan, FindingEngineRule, FindingCustomEngineRule } from '../../interfaces';
import { env } from '../../../config';

interface FindingFilters {
  repositoryIds: number[];
  branchName?: string;
  isParanoid?: string;
  scanId?: string;
  ruleId?: string;
  filters: Record<string, undefined | null | string[] | string>;
  limit?: string;
  offset?: string;
}

export const queryFindings = wrapper(
  async ({
    repositoryIds,
    branchName,
    isParanoid,
    scanId,
    ruleId,
    filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
    limit,
    offset
  }: FindingFilters) => {
    if (env.USE_NEW_QUERY_FINDINGS) {
      const { data } = await coreAxios.post('/v2/findings/getFindings', {
        ...filters,
        ruleId,
        repositoryIds,
        branchName,
        isParanoid,
        scanId,
        limit,
        offset
      });
      return data;
    }

    const { data } = await coreAxios.post('/findings', {
      ...filters,
      ruleId,
      repositoryIds,
      branchName,
      isParanoid,
      scanId,
      limit,
      offset
    });

    return data;
  }
);

export const queryFindingIds = wrapper(
  async ({
    repositoryIds,
    branchName,
    isParanoid,
    scanId,
    ruleId,
    filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
    limit,
    offset
  }): Promise<{ idFinding: string }[]> => {
    const { data } = await coreAxios.post(`/findings/ids`, {
      ...filters,
      ruleId,
      repositoryIds,
      branchName,
      isParanoid,
      scanId,
      limit,
      offset
    });

    return data;
  }
);

export const queryGroupedFindings = wrapper(
  async ({
    repositoryIds,
    branchName,
    scanId,
    isParanoid,
    filters // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
  }: Pick<
    FindingFilters,
    'repositoryIds' | 'branchName' | 'scanId' | 'isParanoid' | 'filters'
  >) => {
    if (env.USE_NEW_QUERY_FINDINGS) {
      const { data } = await coreAxios.post('/v2/findings/getFindingsGroupByRules', {
        ...filters,
        repositoryIds,
        branchName,
        scanId,
        isParanoid
      });
      return data;
    }

    const { data } = await coreAxios.post('/findings/groupByRules', {
      ...filters,
      repositoryIds,
      branchName,
      scanId,
      isParanoid
    });

    return data;
  }
);

export const getFindingsCount = wrapper(
  async (repositoryId: number, branchName?: string): Promise<{ total: number }> => {
    const { data } = await coreAxios.post('/findings/count', {
      repositoryId,
      branchName
    });

    return data;
  }
);

export const queryFindingsFilters = wrapper(
  async ({
    repositoryIds,
    branchName,
    scanId,
    filters, // { ruleIds, engineRuleIds, language, severityIds, status, type, introducedBy, path }
    isParanoid
  }: Pick<
    FindingFilters,
    'repositoryIds' | 'branchName' | 'scanId' | 'isParanoid' | 'filters'
  >) => {
    const { data } = await coreAxios.post('/findings/filters', {
      ...filters,
      repositoryIds,
      branchName,
      scanId,
      isParanoid
    });

    return data;
  }
);

export const queryFindingScans = wrapper(
  async ({
    idFinding,
    offset,
    limit
  }: {
    idFinding: string;
    offset: number;
    limit: number;
  }): Promise<Scan[]> => {
    // Get all scans that the finding can be found in.
    const { data } = await coreAxios.get(`/findings/${idFinding}/scans`, {
      params: {
        offset,
        limit
      }
    });
    return data;
  }
);

export const updateFinding = wrapper(
  async (
    idFinding: string,
    patch: Partial<Finding>
  ): Promise<Finding & { engineRule: Omit<FindingEngineRule, 'engine'> }> => {
    const query = gql`
      mutation updateFinding($input: UpdateFindingInput!) {
        updateFinding(input: $input) {
          finding {
            ...FindingFragment
            engineRule: engineRuleByFkEngineRule {
              idEngineRule
              name
            }
          }
        }
      }
      ${findingFragment}
    `;

    const variables = {
      input: {
        idFinding,
        patch: {
          ...patch,
          updatedAt: new Date().toJSON()
        }
      }
    };
    const { data } = await coreAxios.post('/graphql', { query, variables });
    return get(data, 'data.updateFinding.finding');
  }
);

export const bulkUpdateFindings = async (
  findingIds: string[],
  patch: Partial<Finding>
): Promise<[Finding[], number]> => {
  const { data } = await coreAxios.patch('/findings/bulk', {
    findingIds,
    patch
  });

  return data;
};

export const getFindingById = wrapper(
  async (
    idFinding: string
  ): Promise<
    Finding & { engineRule: FindingEngineRule; customEngineRule: FindingCustomEngineRule }
  > => {
    const query = gql`
      query($idFinding: UUID!) {
        finding(idFinding: $idFinding) {
          ...FindingFragment
          engineRule: engineRuleByFkEngineRule {
            idEngineRule
            name
            engine: engineByFkEngine {
              language
            }
          }
          customEngineRule: customEngineRuleByFkCustomEngineRule {
            idCustomEngineRule
            name
            engine: engineByFkEngine {
              language
            }
          }
        }
      }
      ${findingFragment}
    `;

    const variables = { idFinding };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    return get(data, 'data.finding');
  }
);

export const getFindingsByIds = wrapper(
  async (findingIds: string[]): Promise<Finding[]> => {
    const query = gql`
      query($findingIds: [UUID!]) {
        findings(filter: { idFinding: { in: $findingIds } }) {
          nodes {
            ...FindingFragment
          }
        }
      }
      ${findingFragment}
    `;

    const variables = { findingIds };
    const { data } = await coreAxios.post('/graphql', { query, variables });

    return get(data, 'data.findings.nodes', []);
  }
);
