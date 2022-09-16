import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { gitServiceFactory } from '../helpers/gitServiceFactory';
import { getRepositoryWithAccountById } from '../helpers/core-api/repositories';
import { assignScansToBranches } from '../helpers/branch';
import { ParsedQs } from '../interfaces';

interface BaseBranchesQS extends ParsedQs {
  repositoryId: string;
}

interface ListRepositoriesQS extends BaseBranchesQS {
  limit: string;
  offset: string;
  total: string;
}

export const list = async (req: Request<any, any, any, ListRepositoriesQS>, res: Response) => {
  const {
    query: { repositoryId, limit, offset, total },
    user,
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryWithAccountById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound(`Repository with id=${repositoryId} not found.`);
  }

  const gitService = gitServiceFactory(user, repository.provider);
  const options =
    limit && offset
      ? {
          limit: Number(limit),
          offset: Number(offset),
          ...(total && { totalCount: Number(total) })
        }
      : undefined;
  const { branches: gitBranches, totalCount } = await gitService.getBranches(repository, options);
  const branches = await assignScansToBranches({
    branches: gitBranches,
    repositoryId: Number(repositoryId)
  });

  return res.status(200).send({ branches, totalCount });
};

export const find = async (req: Request<any, any, any, BaseBranchesQS>, res: Response) => {
  const {
    params: { branch },
    query: { repositoryId },
    user,
    permission
  } = req;

  permission!.repositoriesEnforce(Number(repositoryId));

  const repository = await getRepositoryWithAccountById(Number(repositoryId));
  if (!repository) {
    throw boom.notFound(`Repository with id=${repositoryId} not found.`);
  }

  const gitService = gitServiceFactory(user, repository.provider);
  try {
    const gitBranch = await gitService.getBranch(repository, branch);
    return res.status(200).send(gitBranch);
  } catch {
    throw boom.notFound(
      `Couldn't fetch branch with name "${branch}". Please check if the branch exists.`
    );
  }
};
