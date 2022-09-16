import { Request, Response } from 'express';
import { ParsedQs } from '../interfaces';
import { generate, formatReport } from '../helpers/report';

interface ReportsBaseQueryParams extends ParsedQs {
  repositoryId: string | undefined;
  resource: string;
  branch: string | undefined;
  days: string | undefined;
}

export const find = async (req: Request<any, any, any, ReportsBaseQueryParams>, res: Response) => {
  const {
    query: { resource, repositoryId, branch, days },
    permission
  } = req;

  const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;

  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  let reportData = [];
  if (allowedIds.length) {
    reportData = await generate(resource, allowedIds, branch, days ? Number(days) : undefined);
  }

  return res.status(200).send(formatReport(reportData, resource, allowedIds, branch));
};
