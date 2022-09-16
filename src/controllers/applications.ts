import { Request, Response } from 'express';
import { ParsedQs } from '../interfaces';
import {
  createApplication,
  queryApplicationById,
  queryApplications,
  queryApplicationsFilters
} from '../helpers/core-api/applications';

interface ListApplicationsQueryParams extends ParsedQs {
  accountId: string;
  search: string | undefined;
  teamId: string | undefined;
  limit?: string;
}

export const list = async (
  req: Request<any, any, any, ListApplicationsQueryParams>,
  res: Response
) => {
  const {
    query: { accountId, teamId, search, limit, offset }
  } = req;

  const result = await queryApplications(
    Number(accountId),
    { teamId, search },
    limit !== undefined ? Number(limit) : undefined,
    offset !== undefined ? Number(offset) : undefined
  );

  return res.status(200).send(result);
};

export const filters = async (
  req: Request<any, any, any, ListApplicationsQueryParams>,
  res: Response
) => {
  const {
    query: { accountId, teamId, search }
  } = req;

  const result = await queryApplicationsFilters(Number(accountId), { teamId, search });

  return res.status(200).send(result);
};

export const getById = async (
  req: Request<any, any, any, { accountId: string }>,
  res: Response
) => {
  const {
    params: { applicationId },
    query: { accountId }
  } = req;

  const result = await queryApplicationById(Number(accountId), Number(applicationId));

  return res.status(200).send(result);
};

export const create = async (req: Request<any, any, any, { accountId: string }>, res: Response) => {
  const {
    query: { accountId },
    body: { application }
  } = req;

  const result = await createApplication(Number(accountId), application);

  return res.status(200).send(result);
};
