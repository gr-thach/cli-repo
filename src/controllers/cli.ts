import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { queuePriority } from '../helpers/subscription';
import { triggerScan } from '../helpers/scan';
import { RepositoryWithAccount, ScanType } from '../interfaces';
import { linkToScan } from '../helpers/common';
import { getUploadUrl } from '../helpers/cli';
import { findBaseAccountByCliToken } from '../helpers/core-api/accounts';
import { findRepositoryWithAccountByCliToken } from '../helpers/core-api/repositories';
import { getScanByCliToken } from '../helpers/core-api/scans';

const triggerScanForCli = async (
  repository: RepositoryWithAccount,
  sha: string,
  branch: string,
  filename: string | undefined
) => {
  const dashboardUrl = linkToScan(repository.account, repository.idRepository, sha);
  const idScan = await triggerScan(
    sha,
    branch,
    repository.account,
    repository,
    ScanType.CLI,
    queuePriority(repository.account.subscription, ScanType.CLI),
    filename
  );
  return { idScan, dashboardUrl };
};

export const trigger = async (req: Request, res: Response) => {
  const {
    body: { clitoken, repository: repositoryName, sha, branch }
  } = req;

  const repository = await findRepositoryWithAccountByCliToken(clitoken, repositoryName);
  if (!repository) {
    throw boom.notFound('Repository not found');
  }

  const result = await triggerScanForCli(repository, sha, branch, undefined);

  return res.status(200).send(result);
};

export const triggerZipScan = async (req: Request, res: Response) => {
  const {
    body: { clitoken, repository: repositoryName, sha, branch, fileName }
  } = req;

  const repository = await findRepositoryWithAccountByCliToken(clitoken, repositoryName);
  if (!repository) {
    throw boom.notFound('Repository not found');
  }

  const result = await triggerScanForCli(repository, sha, branch, fileName);

  return res.status(200).send(result);
};

export const uploadUrl = async (req: Request, res: Response) => {
  const {
    body: { clitoken, file }
  } = req;

  const account = await findBaseAccountByCliToken(clitoken);
  if (!account) {
    throw boom.notFound('Account not found');
  }

  const signedUrl = await getUploadUrl(file);

  return res.status(200).send({ signedUrl });
};

export const getScan = async (req: Request, res: Response) => {
  const {
    headers: { clitoken, idscan }
  } = req;

  const scan = await getScanByCliToken(idscan, clitoken);

  if (!scan) throw boom.notFound('Scan not found');

  return res.status(200).send(scan);
};
