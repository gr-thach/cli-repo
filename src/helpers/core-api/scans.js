const lodashGet = require('lodash/get');
const { coreAxios, wrapper, gql } = require('./index');
const { scanFragment, repositoryFragment } = require('./fragments');

const queryScans = async ({
  repositoryIds,
  branch,
  limit,
  offset,
  orderBy,
  filters // search, sha, hasVulnerabilities, type, sender
}) => {
  const { data } = await coreAxios.post('/scans', {
    ...filters,
    repositoryIds,
    branch,
    limit,
    offset,
    orderBy
  });

  return data;
};

const queryScansFilters = async ({
  repositoryIds,
  branch,
  filters // search, sha, hasVulnerabilities, type, sender
}) => {
  const { data } = await coreAxios.post('/scans/filters', {
    ...filters,
    repositoryIds: repositoryIds.join(),
    branch
  });

  return data;
};

const getScanByCliToken = async (idScan, cliToken) => {
  const query = gql`
    query($ScanFilter: ScanFilter!) {
      scans(filter: $ScanFilter) {
        nodes {
          ...ScanFragment
          repository: repositoryByFkRepository {
            ...RepositoryFragment
          }
        }
      }
    }
    ${scanFragment}
    ${repositoryFragment}
  `;

  const variables = {
    ScanFilter: {
      repositoryByFkRepository: {
        accountByFkAccount: {
          cliToken: {
            equalTo: cliToken
          }
        }
      },
      idScan: {
        equalTo: idScan
      }
    }
  };

  const { data } = await coreAxios.post('/graphql', { query, variables });

  return lodashGet(data, 'data.scans.nodes[0]', null);
};

const getLastFindingScan = async findingId => {
  const query = gql`
    query($findingId: UUID!) {
      scans(
        filter: {
          engineRunsByFkScan: {
            some: {
              engineRunsFindingsByFkEngineRun: { some: { fkFinding: { equalTo: $findingId } } }
            }
          }
        }
        orderBy: CREATED_AT_DESC
        first: 1
      ) {
        nodes {
          ...ScanFragment
          repository: repositoryByFkRepository {
            ...RepositoryFragment
          }
        }
      }
    }
    ${scanFragment}
    ${repositoryFragment}
  `;

  const { data } = await coreAxios.post('/graphql', { query, variables: { findingId } });

  return lodashGet(data, 'data.scans.nodes[0]', null);
};

const createScan = async scan => {
  const query = gql`
    mutation createScan($scan: ScanInput!) {
      createScan(input: { scan: $scan }) {
        scan {
          idScan
        }
      }
    }
  `;

  const variables = { scan };
  const { data } = await coreAxios.post('/graphql', { query, variables });

  return lodashGet(data, 'data.createScan.scan');
};

const updateScan = async (idScan, patch) => {
  const query = gql`
    mutation updateScan($input: UpdateScanInput!) {
      updateScan(input: $input) {
        scan {
          idScan
        }
      }
    }
  `;

  const variables = { input: { idScan, patch } };
  const { data } = await coreAxios.post('/graphql', { query, variables });
  return lodashGet(data, 'data.updateScan.scan');
};

const getScan = async idScan => {
  const query = gql`
    query($idScan: UUID!) {
      scan(idScan: $idScan) {
        idScan
        sha
        type
        fkRepository
        status: scanStatusByFkScanStatus {
          idScanStatus
          name
        }
        result: scanResultByFkScanResult {
          idScanResult
          name
        }
      }
    }
  `;

  const { data } = await coreAxios.post('/graphql', { query, variables: { idScan } });
  const scan = lodashGet(data, 'data.scan');

  if (scan) {
    const { fkRepository, ...rest } = scan;

    return {
      ...rest,
      repository: {
        idRepository: fkRepository
      }
    };
  }

  return null;
};

const queryLastScanPerRepo = async (repositoryIds, limit) => {
  const { data } = await coreAxios.post('/scans/lastPerRepo', {
    repositoryIds: repositoryIds.join(),
    limit
  });

  return data;
};

const queryScanCountPerRepo = async repositoryId => {
  const query = gql`
    query($repositoryId: Int!) {
      scans(filter: { fkRepository: { equalTo: $repositoryId } }) {
        totalCount
      }
    }
  `;

  const variables = {
    repositoryId
  };
  const {
    data: {
      data: {
        scans: { totalCount }
      }
    }
  } = await coreAxios.post('/graphql', { query, variables });

  return totalCount;
};

const getScanWithFindings = async (idScan, findingsFilter) => {
  const query = gql`
    query($idScan: UUID!, $findingFilter: EngineRunsFindingFilter) {
      scan(idScan: $idScan) {
        idScan
        sha
        branch
        repository: repositoryByFkRepository {
          idRepository
          name
        }
        engineRuns: engineRunsByFkScan(filter: { engineRunsFindingsByFkEngineRunExist: true }) {
          nodes {
            idEngineRun
            engineRunsFindings: engineRunsFindingsByFkEngineRun(filter: $findingFilter) {
              nodes {
                duplicatedWith
                isVulnerability
                finding: findingByFkFinding {
                  idFinding
                  language
                  path
                  branch
                  status
                  lineNumber
                  fkEngineRule
                  fkRule
                  createdAt
                  rule: ruleByFkRule {
                    idRule
                    name
                    title
                    docs
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const variables = {
    idScan
  };

  if (findingsFilter) {
    variables.findingFilter = {
      findingByFkFinding: {
        ...findingsFilter
      }
    };
  }

  const { data } = await coreAxios.post('/graphql', { query, variables });
  const scan = lodashGet(data, 'data.scan', null);

  return {
    ...scan,
    engineRuns: lodashGet(scan, 'engineRuns.nodes', []).map(er => ({
      ...er,
      engineRunsFindings: lodashGet(er, 'engineRunsFindings.nodes', [])
    }))
  };
};

const queryScansReport = async (repositoryIds, branch, days) => {
  const { data } = await coreAxios.get('/scans/report', {
    params: { repositoryIds: repositoryIds.join(), branch, days }
  });

  return data;
};

module.exports = {
  queryScans: wrapper(queryScans),
  getScanByCliToken: wrapper(getScanByCliToken),
  getLastFindingScan: wrapper(getLastFindingScan),
  createScan: wrapper(createScan),
  updateScan: wrapper(updateScan),
  getScan: wrapper(getScan),
  queryScanCountPerRepo: wrapper(queryScanCountPerRepo),
  queryLastScanPerRepo: wrapper(queryLastScanPerRepo),
  getScanWithFindings: wrapper(getScanWithFindings),
  queryScansReport: wrapper(queryScansReport),
  queryScansFilters: wrapper(queryScansFilters)
};
