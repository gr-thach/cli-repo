import { Request, Response } from 'express';
import { ParsedQs } from '../interfaces';
import { queryDepartments, createDepartments } from '../helpers/core-api/departments';

export const list = async (req: Request<any, any, any, ParsedQs>, res: Response) => {
  const { account } = req;

  const result = await queryDepartments(account!.idAccount);

  return res.status(200).send(result);
};

export const create = async (
  req: Request<any, any, { department: { name: string } }, any>,
  res: Response
) => {
  const {
    body: { department },
    account
  } = req;

  const result = await createDepartments(account!.idAccount, department);

  return res.status(200).send(result);
};
