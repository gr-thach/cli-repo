import { Request, Response } from 'express';
import { queryDependencies } from '../helpers/core-api/dependencies';
import { ParsedQs } from '../interfaces';

interface ListDependenciesQS extends ParsedQs {
  hasVulnerability?: string;
  repoId?: string;
  license?: string;
  limit?: string;
  offset?: string;
}

interface QueryDependenciesFilter {
  hasVulnerability?: boolean;
  repoId?: number;
  accountId: number;
  license?: string;
  limit?: string;
  offset?: string;
}

export const list = async (req: Request<any, any, any, ListDependenciesQS>, res: Response) => {
  const {
    // TODO: Change repoId to repositoryId
    query: { hasVulnerability, repoId: repositoryId, license, limit = '10', offset },
    permission,
    account
  } = req;

  const allowedIds = permission!.repositoriesEnforce(
    repositoryId ? Number(repositoryId) : undefined
  );

  if (!allowedIds.length) {
    return res.status(200).send({
      dependencies: [],
      totalCount: 0
    });
  }

  const filters: QueryDependenciesFilter = {
    accountId: account!.idAccount,
    limit,
    offset
  };

  if (hasVulnerability) {
    filters.hasVulnerability = Boolean(hasVulnerability);
  }

  if (repositoryId) {
    filters.repoId = Number(repositoryId);
  }

  if (license) {
    filters.license = license;
  }

  const repoFilters = await queryDependencies({
    repositoryIds: allowedIds,
    filters
  });

  return res.status(200).send(repoFilters);
};
