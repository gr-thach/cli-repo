import boom from '@hapi/boom';
import { v4 as uuid } from 'uuid';
import { sendToRabbitQueue } from '../queue';
import { getAccountIdentifierValue } from './common';
import { createScan, queryScans, updateScan } from './core-api/scans';
import { getQueuedScanStatusId } from './core-api/scanStatus';
import { gitServiceFactory } from './gitServiceFactory';
import { BaseAccount, GitBranch, Repository, RequestUser, Scan, ScanType } from '../interfaces';

const getScanMessage = (scanType: ScanType) => {
  switch (scanType) {
    case ScanType.PRE_HOOK:
      return 'Scan triggered via server-side Git pre-hook';
    case ScanType.CLI:
      return 'On-demand scan triggered via the CLI';
    case ScanType.BRANCH:
      return 'On-demand scan triggered via the Dashboard';
    default:
      throw Error(`Unexpected scan type '${scanType}'.`);
  }
};

export const triggerScan = async (
  sha: string,
  branch: string,
  account: BaseAccount,
  repository: Repository,
  scanType: ScanType,
  priority: number,
  filename?: string,
  diffFileName?: string,
  config?: Record<string, unknown>
) => {
  if (!account) throw boom.notFound('Account not found');
  if (!repository) throw boom.notFound('Repository not found');

  const { idScan } = await createScan({
    idScan: uuid(),
    fkRepository: repository.idRepository,
    type: scanType,
    branch,
    sha,
    githookMetadata: {
      sender: {
        avatar_url: 'https://avatars2.githubusercontent.com/u/31360611?v=4',
        login: 'N/A'
      },
      config,
      ref: `${branch}-${getAccountIdentifierValue(account)}`,
      commit: {
        message: getScanMessage(scanType)
      }
    },
    fkScanStatus: await getQueuedScanStatusId(),
    queuedAt: new Date().toJSON(),
    createdAt: new Date().toJSON(),
    updatedAt: new Date().toJSON()
  });

  await sendToRabbitQueue(
    {
      idScan,
      ...(filename && { filename }),
      ...(diffFileName && { diffFileName })
    },
    priority
  );

  return idScan;
};

export const reTriggerScan = async (
  scan: Scan,
  priority: number,
  user: RequestUser,
  account: BaseAccount,
  repository: Repository
) => {
  if (scan.type === ScanType.PULL) {
    const gitService = gitServiceFactory(user, account.provider);
    await gitService.setQueuedStatus(account, repository, scan.sha);
  }
  const now = new Date().toJSON();
  await updateScan(scan.idScan, {
    fkScanStatus: await getQueuedScanStatusId(),
    queuedAt: now,
    updatedAt: now
  });
  await sendToRabbitQueue(
    {
      idScan: scan.idScan
    },
    priority
  );
};

interface QueryLatestScansByRepoBranchProps {
  repositoryId: number;
  branch: GitBranch;
}

export const queryLatestScansByRepoBranch = async ({
  repositoryId,
  branch
}: QueryLatestScansByRepoBranchProps): Promise<{ scans: Scan[]; totalCount: number }> => {
  return queryScans({
    repositoryIds: [repositoryId],
    branch: branch.name,
    orderBy: 'finishedAt,desc',
    limit: 5,
    offset: null,
    filters: null
  });
};
