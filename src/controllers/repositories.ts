import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { parseListParam } from '../helpers/common';
import {
  getRepositoryById,
  getRepositoryWithAccountById,
  getRepositoriesByIds,
  queryRepoFilters,
  queryRepositoriesByIds,
  updateRepository
} from '../helpers/core-api/repositories';
import { formatRepositoriesStatsResponse } from '../helpers/repository';
import { queryVulnerabilitiesOverTime } from '../helpers/core-api/vulnerabilities';
import { parseNumberParams } from '../helpers/core-api';
import { validateInstallationConfig } from '../helpers/yml';
import { ParsedQs, Stats, PermissionAction, Resource } from '../interfaces';
import PermissionService from '../services/permissions/permission';
import RepositoriesService from '../services/repositories';

interface FilterRepositoriesQS extends ParsedQs {
  search?: string;
  isPrivate?: 't' | 'f';
  language?: string;
  isEnabled?: 't' | 'f';
  monorepoId?: string;
}

interface ListRepositoriesQS extends FilterRepositoriesQS {
  limit?: string;
  offset?: string;
  orderBy?: string;
  teamId?: string;
  pkg_ecosystem?: string;
  license?: string;
  dependency?: string;
}

export const list = async (req: Request<any, any, any, ListRepositoriesQS>, res: Response) => {
  const {
    query: {
      limit,
      offset,
      orderBy = 'updatedAt,desc',
      teamId,
      pkg_ecosystem,
      license,
      search,
      dependency,
      isPrivate,
      language,
      isEnabled,
      monorepoId
    },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce();

  if (allowedIds.length === 0) {
    return res.status(200).send({
      repositories: [],
      totalCount: 0
    });
  }

  const { repositories, totalCount } = await queryRepositoriesByIds(allowedIds, {
    teamId,
    orderBy,
    limit,
    offset,
    dependency,
    license,
    pkgEcosystem: pkg_ecosystem,
    isPrivate,
    language: parseListParam(language),
    isEnabled,
    monorepoId,
    ...(monorepoId ? { path: search } : { name: search })
  });

  const writePermission = await PermissionService.factory(
    permission!.policy,
    PermissionAction.WRITE,
    Resource.REPOSITORIES
  );

  return res.status(200).send({
    repositories: repositories.map(repository => ({
      ...repository,
      write: writePermission.getAllowedIds(repository.idRepository).length > 0
    })),
    totalCount
  });
};

export const find = async (req: Request, res: Response) => {
  const {
    // TODO: change to repositoryId
    params: { repoId: repositoryId },
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const writePermission = await PermissionService.factory(
    permission!.policy,
    PermissionAction.WRITE,
    Resource.REPOSITORIES
  );

  const write = writePermission.getAllowedIds(repository.idRepository).length > 0;

  return res.status(200).send({ ...repository, write });
};

export const config = async (req: Request, res: Response) => {
  const {
    // TODO: change to repositoryId
    body: { repoId: repositoryId, configuration },
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  let parsedConfiguration;
  try {
    parsedConfiguration = validateInstallationConfig(configuration);
  } catch (e) {
    const errName = (e as any).name;
    if (errName === 'ValidationError') {
      throw boom.badRequest("Some fields didn't pass validation", {
        details: (e as any).details.map((detail: { message: string; path: string }) => ({
          message: detail.message,
          path: detail.path
        }))
      });
    } else if (errName === 'YAMLException' || errName === 'SyntaxError') {
      throw boom.badData((e as any).message);
    } else {
      throw e;
    }
  }

  try {
    await updateRepository(Number(repositoryId), {
      configuration: parsedConfiguration,
      updatedAt: new Date().toJSON()
    });
  } catch (e) {
    throw boom.badRequest((e as any).message);
  }

  return res.sendStatus(200);
};

export const update = async (
  req: Request<{ repositoryId: string }, { isEnabled: boolean }>,
  res: Response
) => {
  const {
    params: { repositoryId },
    body: { isEnabled },
    permission,
    user
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryWithAccountById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const service = new RepositoriesService(user);
  const updatedRepo = await service.enableRepository(repository, isEnabled);

  return res.status(200).send(updatedRepo);
};

export const stats = async (
  req: Request<any, any, any, { repositoryIds: string; days: string }>,
  res: Response
) => {
  const {
    query: { repositoryIds, days = '30' },
    permission
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  let statsOverTime: Stats[] = [];
  if (allowedIds.length) {
    statsOverTime = await queryVulnerabilitiesOverTime(allowedIds, Number(days));
  }

  return res.status(200).send(formatRepositoriesStatsResponse(statsOverTime, Number(days)));
};

export const filters = async (req: Request<any, any, any, FilterRepositoriesQS>, res: Response) => {
  const {
    query: { search, isPrivate, language, isEnabled, monorepoId },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce();

  if (!allowedIds.length) {
    return res.status(200).send({
      language: []
    });
  }

  const repoFilters = await queryRepoFilters(allowedIds, {
    isPrivate,
    language: parseListParam(language),
    isEnabled,
    monorepoId,
    ...(monorepoId ? { path: search } : { name: search })
  });

  return res.status(200).send(repoFilters);
};

export const bulkPatch = async (req: Request, res: Response) => {
  const {
    body: { repositoryIds, isEnabled },
    permission,
    user
  } = req;

  const parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;
  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);
  const repositories = await getRepositoriesByIds(allowedIds);

  const success: number[] = [];
  const service = new RepositoriesService(user);
  await Promise.all(
    repositories.map(repository =>
      (async () => {
        let hasError = false;

        try {
          await service.enableRepository(repository, isEnabled);
        } catch (error) {
          hasError = true;
        }

        if (!hasError) {
          success.push(repository.idRepository);
        }
      })()
    )
  );

  return res.status(200).send(success);
};
