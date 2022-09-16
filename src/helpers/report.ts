import { queryScansReport } from './core-api/scans';

interface Report {
  idScan: string;
  repo: string;
  branch: string;
  prNumber: string;
  totalVulnerabilities: number;
  finishedAt: string;
  scanningAt: string;
  updatedAt: string;
  langs: string[];
}

export const formatReport = (
  reportData: Report[],
  resource: 'scan' | 'vulnerability' | string,
  repositoryIds: number[],
  branch: string | undefined
) => {
  return {
    metadata: {
      resource,
      ...(repositoryIds.length === 1 && reportData.length && { repo: reportData[0].repo }),
      ...(branch && { branch })
    },
    data: reportData.length > 200 ? reportData.slice(0, 199) : reportData
  };
};

export const generate = async (
  resource: 'scan' | 'vulnerability' | string,
  repositoryIds: number[],
  branch: string | undefined,
  days: number = 30
) => {
  switch (resource) {
    case 'scan':
      return queryScansReport(repositoryIds, branch, days);
    case 'vulnerability':
      return []; // createVulnerabilityReport(repoId, branch, days);
    default:
      return [];
  }
};
