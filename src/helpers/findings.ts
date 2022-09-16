import get from 'lodash/get';
import {
  RequestUser,
  User,
  Scan,
  RepositoryWithAccount,
  GitProvider,
  Finding,
  FindingCodeBlockError,
  FindingStatus,
  ActionType,
  FindingAutomaticStatus
} from '../interfaces';
import Cache from '../services/cache';
import { gitServiceFactory } from './gitServiceFactory';
import { env } from '../../config';
import { getLastFindingScan } from './core-api/scans';
import {
  bulkUpdateFindings,
  getFindingsByIds,
  queryFindingIds,
  updateFinding
} from './core-api/findings';
import { upsertActionByFinding, bulkUpsertActionByFinding } from './actions';

export const findFindingInScan = (scan: Scan, idFinding: string) => {
  if (scan.engineRuns) {
    // eslint-disable-next-line no-restricted-syntax
    for (const engineRun of scan.engineRuns) {
      if (engineRun.engineRunsFindings) {
        // eslint-disable-next-line no-restricted-syntax
        for (const engineRunsFinding of engineRun.engineRunsFindings) {
          if (engineRunsFinding.finding && engineRunsFinding.finding.idFinding === idFinding) {
            return engineRunsFinding.finding;
          }
        }
      }
    }
  }

  return null;
};

export const isStatusTransitionAllowed = (
  currentStatus: FindingStatus | null,
  newStatus: ActionType
) => {
  if (currentStatus === newStatus) {
    return false;
  }
  if (!currentStatus && newStatus !== ActionType.MARK_AS_VULNERABILITY) {
    return false;
  }

  return [
    ActionType.WONT_FIX,
    ActionType.FALSE_POSITIVE,
    ActionType.MARK_AS_FIXED,
    ActionType.MARK_AS_VULNERABILITY
  ].includes(newStatus);
};

export const isValidStatusParam = (status: string) => {
  let isValid = true;
  if (status && status !== 'null') {
    const arr = status.split(',');
    if (!arr.length) {
      isValid = false;
    } else {
      arr.forEach(s => {
        if (!Object.values<string>({ ...ActionType, ...FindingAutomaticStatus }).includes(s)) {
          isValid = false;
        }
      });
    }
  }
  return isValid;
};

export const parseStatusQueryParam = (statusParam: string) => {
  if (!statusParam) {
    return undefined;
  }

  if (statusParam === 'null') {
    return null;
  }

  return statusParam.toLowerCase().split(',');
};

export const getCodeBlock = async (
  finding: Finding,
  repository: RepositoryWithAccount,
  user: RequestUser
): Promise<string | null | FindingCodeBlockError> => {
  const { idFinding, path, lineNumber } = finding;
  const { provider } = repository;

  const lastScan = await getLastFindingScan(idFinding);

  if (!lastScan) {
    return FindingCodeBlockError.NO_SCAN;
  }

  const { sha } = lastScan;

  const cache = new Cache(env.CACHE_PROVIDER).getInstance();
  const cacheKey = `codeBlock-${idFinding}-${sha}-${path}-${lineNumber}`;

  let codeBlock = await cache.get(cacheKey);

  if (!codeBlock) {
    const gitService = gitServiceFactory(user, provider);
    try {
      const content = await gitService.getContent(repository, sha, path);

      if (content) {
        let lines = content.split('\n');
        if (lineNumber) {
          const ln = lineNumber - 1;
          lines = lines.slice(ln - 3 >= 0 ? ln - 3 : 0, ln + 4);
        } else {
          lines = lines.slice(0, 6);
        }

        codeBlock = lines
          .map(line => (line.length > 350 ? line.substring(0, 350) : line))
          .join('\n');

        cache.set(cacheKey, codeBlock, 60 * 60 * 2); // 2 hours
      } else {
        codeBlock = undefined;
      }
    } catch (e) {
      if (provider === GitProvider.GITHUB && get(e, 'errors[0].code') === 'too_large') {
        codeBlock = FindingCodeBlockError.FILE_TOO_LARGE;
      } else {
        codeBlock = FindingCodeBlockError.UNKNOWN;
      }
    }
  }

  return codeBlock;
};

export const updateActionAndPatchFindingStatus = async (
  finding: Finding,
  newStatus: ActionType,
  user: User,
  idAccount: number
) => {
  if (!isStatusTransitionAllowed(finding.status, newStatus)) {
    return {
      updated: false,
      finding
    };
  }

  await upsertActionByFinding(finding, newStatus, idAccount, user);

  const fixed = [ActionType.MARK_AS_FIXED, FindingAutomaticStatus.FIXED].includes(newStatus);

  const updatedFinding = await updateFinding(finding.idFinding, {
    status: newStatus,
    fixedAt: fixed ? new Date().toJSON() : null,
    fixedBy: fixed ? user.login : null,
    ...(!finding.introducedBy &&
      newStatus === ActionType.MARK_AS_VULNERABILITY && {
        introducedBy: 'N/A',
        introducedAt: finding.createdAt
      })
  });

  return { updated: true, finding: updatedFinding };
};

type BatchUpdateFindingParams = {
  repositoryIds: number[];
  branchName?: string;
  isParanoid?: boolean;
  scanId?: string;
  filters?: Partial<{
    ruleIds: number[];
    engineRuleIds: number[];
    language: string;
    severityIds: string[];
    status: string[] | null;
    type: string[];
    introducedBy: string;
    path: string;
    hasTicket: string;
  }>;
  newStatus: ActionType;
  idAccount: number;
  user: User;
  excludedIds: string[];
  total: number;
};

export const batchUpdateFindings = async ({
  newStatus,
  idAccount,
  excludedIds,
  user,
  total,
  ...params
}: BatchUpdateFindingParams) => {
  const chunkSize = 500;

  const findingChunks = [];
  for (let offset = 0; offset < total; offset += chunkSize) {
    // eslint-disable-next-line no-await-in-loop
    const findingIds = await queryFindingIds({ ...params, limit: chunkSize, offset });
    // eslint-disable-next-line no-await-in-loop
    const findings = await getFindingsByIds(
      findingIds.map(({ idFinding }) => idFinding).filter((id: string) => !excludedIds.includes(id))
    );

    findingChunks.push(findings);
  }

  const results: Array<{ updated: boolean; totalUpdatedFindings: number }> = [];

  for (let i = 0; i < findingChunks.length; i++) {
    const findings = findingChunks[i];
    const validFindings = findings.filter(finding =>
      isStatusTransitionAllowed(finding.status, newStatus)
    );

    if (!validFindings.length) {
      results.push({ updated: false, totalUpdatedFindings: 0 });
    } else {
      // eslint-disable-next-line no-await-in-loop
      await bulkUpsertActionByFinding({
        findings: validFindings,
        newStatus,
        accountId: idAccount,
        userId: user.idUser
      });

      const fixed = [ActionType.MARK_AS_FIXED, FindingAutomaticStatus.FIXED].includes(newStatus);

      // eslint-disable-next-line no-await-in-loop
      const [, totalUpdatedFindings] = await bulkUpdateFindings(
        validFindings.map(({ idFinding }) => idFinding),
        {
          status: newStatus,
          fixedAt: fixed ? new Date().toJSON() : null,
          fixedBy: fixed ? user.login : null
        }
      );

      results.push({ updated: true, totalUpdatedFindings: totalUpdatedFindings || 0 });
    }
  }

  return results;
};
