import { Request, Response } from 'express';
import boom from '@hapi/boom';
import { triggerScan, reTriggerScan } from '../helpers/scan';
import { queuePriority } from '../helpers/subscription';
import { gitServiceFactory } from '../helpers/gitServiceFactory';
import { ParsedQs, Scan, ScanType } from '../interfaces';
import {
  getRepositoryWithAccountById,
  getRepositoriesByIds
} from '../helpers/core-api/repositories';
import {
  queryScans,
  getScan,
  queryLastScanPerRepo,
  queryScansFilters
} from '../helpers/core-api/scans';
import { parseNumberParams } from '../helpers/core-api/index';
import { parseListParams } from '../helpers/common';

interface ListScansQS extends ParsedQs {
  repositoryIds: string;
  search: string;
  sha: string;
  type: string;
  sender: string;
  branch: string;
  limit: string;
  offset: string;
  orderBy: string;
}

interface TriggerScanQS extends ParsedQs {
  branch: string;
}

interface ReTriggerScanQS extends ParsedQs {
  scanId: string;
}

export const list = async (req: Request<any, any, any, ListScansQS>, res: Response) => {
  const {
    query: {
      repositoryIds,
      branch,
      limit,
      offset,
      orderBy = 'updatedAt,desc',
      search,
      type,
      sha,
      hasVulnerabilities,
      sender
    },
    permission
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send({ scans: [], totalCount: 0 });
  }

  const parsedFilters = parseListParams({ sha, type, sender });

  let _search: string | undefined = search;
  let _sha: string[] | undefined = parsedFilters.sha;
  if (!sha && search && /\b([a-f0-9]{40})\b/.test(String(search))) {
    _sha = [search];
    _search = undefined;
  }

  const data = await queryScans({
    repositoryIds: allowedIds,
    branch: branch || null,
    limit,
    offset,
    orderBy,
    filters: {
      ...parsedFilters,
      sha: _sha,
      search: _search,
      hasVulnerabilities
    }
  });

  return res.status(200).send(data);
};

export const trigger = async (req: Request<any, any, any, TriggerScanQS>, res: Response) => {
  const {
    params: { repositoryId },
    query: { branch },
    user,
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryWithAccountById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const scanType = ScanType.BRANCH; // so far we leave this hardcoded to BRANCH

  const gitService = gitServiceFactory(user, repository.provider);
  let sha;
  try {
    sha = await gitService.getBranchSha(repository, branch);
  } catch (e) {
    throw boom.notFound(
      `Branch ${branch} for repository ${repository.name} couldn't be found on ${repository.provider}`
    );
  }

  const idScan = await triggerScan(
    sha,
    branch,
    repository.account,
    repository,
    scanType,
    queuePriority(repository.account.subscription, scanType)
  );

  return res.status(200).send({ idScan });
};

export const reTrigger = async (req: Request<any, any, any, ReTriggerScanQS>, res: Response) => {
  const {
    params: { repositoryId },
    query: { scanId },
    user,
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryWithAccountById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const scan: Scan = await getScan(scanId);

  if (!repository || !scan) {
    throw boom.notFound(`${!repository ? 'Repository' : 'Scan'} not found`);
  }

  if (repository.idRepository !== scan.repository.idRepository) {
    throw boom.badRequest("Scan doesn't belong to the provided repository.");
  }

  await reTriggerScan(
    scan,
    queuePriority(repository.account.subscription, scan.type),
    user,
    repository.account,
    repository
  );

  return res.status(200).send({ idScan: scan.idScan });
};

export const listLast = async (req: Request, res: Response) => {
  const {
    query: { repositoryIds, limit },
    permission
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(String(repositoryIds)) : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send([]);
  }

  const scans = await queryLastScanPerRepo(allowedIds, limit);

  return res.status(200).send(scans);
};

export const filters = async (req: Request<any, any, any, ListScansQS>, res: Response) => {
  const {
    query: { repositoryIds, branch, search, type, sha, hasVulnerabilities, sender },
    permission
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send({
      type: [],
      sha: [],
      sender: []
    });
  }

  const parsedFilters = parseListParams({ sha, type, sender });

  const scanFilters = await queryScansFilters({
    repositoryIds: allowedIds,
    branch,
    filters: {
      ...parsedFilters,
      search,
      hasVulnerabilities
    }
  });

  return res.status(200).send(scanFilters);
};

export const bulkTrigger = async (req: Request, res: Response) => {
  const {
    body: { repositoryIds },
    user,
    permission
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  if (!allowedIds.length) {
    return res.status(200).send({ succeedCount: 0 });
  }

  const repositories = await getRepositoriesByIds(allowedIds);

  const result = await Promise.allSettled(
    repositories.map(async repository => {
      const { defaultBranch: branch, account } = repository;
      const scanType = ScanType.BRANCH;

      const gitService = gitServiceFactory(user, repository.provider);
      try {
        const sha = await gitService.getBranchSha(repository, branch);
        return await triggerScan(
          sha,
          branch,
          account,
          repository,
          scanType,
          queuePriority(account.subscription, scanType)
        );
      } catch (e) {
        throw boom.notFound(
          `Branch ${branch} for repository ${repository.name} couldn't be found on ${repository.provider}`
        );
      }
    })
  );

  const succeedCount = Object.values(result).filter(r => r.status === 'fulfilled').length;

  return res.status(200).send({ succeedCount });
};
