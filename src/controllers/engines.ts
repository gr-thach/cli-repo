import boom from '@hapi/boom';
import { UploadedFile } from 'express-fileupload';
import { Request, Response } from 'express';
import { getAllowedAccountsByUser } from '../helpers/acl';
import { listEngines, listEngineRules, importCustomEngine } from '../helpers/core-api/engines';
import { extractManifestDataFromCustomEngineFile, transformAllowFor } from '../helpers/engines';
import { GitProvider, Resource, PermissionAction } from '../interfaces';
import { getPolicyByRequestUserAndAccount } from '../helpers/permissions';
import PermissionService from '../services/permissions/permission';
import { findAccountsByIdentifiers } from '../helpers/core-api/accounts';
import { filterAccountsByAllowedAccounts } from '../helpers/accountsV2';

export const list = async (req: Request, res: Response) => {
  const { account } = req;

  return res.status(200).send(await listEngines(account!.idAccount));
};

export const listRules = async (req: Request, res: Response) => {
  const { account } = req;

  return res.status(200).send(await listEngineRules(account!.idAccount));
};

export const uploadCustomEngine = async (
  req: Request<any, any, any, { provider: string; login: string }>,
  res: Response
) => {
  const {
    files,
    query: { login, provider },
    user
  } = req;

  if (!files) {
    throw boom.notFound('No files were uploaded.');
  }

  const { allowedAccounts } = await getAllowedAccountsByUser(user);

  const accounts = await findAccountsByIdentifiers([login], provider as GitProvider);
  const account = filterAccountsByAllowedAccounts(accounts, allowedAccounts);

  if (!account) {
    throw boom.notFound('Account Not Found');
  }

  const policy = await getPolicyByRequestUserAndAccount(user, account);
  (
    await PermissionService.factory(policy, PermissionAction.WRITE, Resource.CUSTOM_ENGINES)
  ).enforce();

  let manifestData;
  try {
    manifestData = await extractManifestDataFromCustomEngineFile(
      (files.engine as UploadedFile).data
    );
  } catch (e) {
    throw new Error(
      `Error uncompressing, parsing and reading the uploaded custom engine zip file. Exception: ${
        (e as Error).message
      }.`
    );
  }

  const { newAllowFor, summary } = transformAllowFor(manifestData.allowFor, allowedAccounts);

  if (!summary.included) {
    return res.status(400).send({
      message:
        "None of the accounts on the allowFor attr could be added because this user has no permissions over them. Therefore, the custom engine won't be imported because it won't run.",
      allowForSummary: summary
    });
  }

  const importResult = await importCustomEngine(account.idAccount, {
    ...manifestData,
    allowFor: newAllowFor
  });

  return res.status(200).send({ ...importResult, allowForSummary: summary });
};
