import { GitBranch } from '../interfaces';
import { queryLatestScansByRepoBranch } from './scan';

interface FetchLatestBrnachScansProps {
  branch: GitBranch;
  repositoryId: number;
}

const fetchLatestBranchScans = async ({ branch, repositoryId }: FetchLatestBrnachScansProps) => {
  const { scans } = await queryLatestScansByRepoBranch({ repositoryId, branch });

  if (!scans || !scans.length) {
    return branch;
  }

  return {
    ...branch,
    lastScans: scans
      .map(({ totalVulnerabilities, status, finishedAt }) => ({
        totalVulnerabilities,
        status,
        finishedAt
      }))
      .filter(s => s.status.name === 'success')
  };
};

interface AssignScansToBranchesProps {
  branches: GitBranch[];
  repositoryId: number;
}

export const assignScansToBranches = async ({
  branches,
  repositoryId
}: AssignScansToBranchesProps) => {
  return Promise.all(branches.map(branch => fetchLatestBranchScans({ branch, repositoryId })));
};
