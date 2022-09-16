import { Request, Response } from 'express';
import boom from '@hapi/boom';
import {
  getFindingById,
  queryFindings,
  queryGroupedFindings,
  queryFindingsFilters,
  getFindingsByIds,
  getFindingsCount as getFindingsCountCoreApi
} from '../helpers/core-api/findings';

import { parseNumberParams, parseStringParams } from '../helpers/core-api/queryParamParser';
import { parseListParams } from '../helpers/common';
import {
  isValidStatusParam,
  parseStatusQueryParam,
  getCodeBlock,
  updateActionAndPatchFindingStatus,
  isStatusTransitionAllowed,
  batchUpdateFindings
} from '../helpers/findings';
import { getFindingLinks } from '../helpers/findingLinks';
import { getRepositoryWithAccountById } from '../helpers/core-api/repositories';
import { ParsedQs, FindingCodeBlockError, ActionType } from '../interfaces';
import { getScan } from '../helpers/core-api/scans';
import { createChangeStatusRequestAction } from '../helpers/actions';

interface FindingBaseQueryParams extends ParsedQs {
  accountId: string;
}

const severityMapping: Record<string, string> = {
  'N/A': '1000',
  INFORMATIONAL: '1001',
  LOW: '1002',
  MEDIUM: '1003',
  HIGH: '1004',
  CRITICAL: '1005'
};

interface ListFindingQueryParams extends FindingBaseQueryParams {
  ruleIds: string;
  engineRuleIds: string;
  language: string;
  severityIds: string;
  status: string;
  type: string;
  introducedBy: string;
  path: string;
  repositoryIds?: string;
  branchName?: string;
  isParanoid?: string;
  scanId?: string;
  limit?: string;
  offset?: string;
  hasTicket?: string;
}

export const list = async (req: Request<any, any, any, ListFindingQueryParams>, res: Response) => {
  const {
    query: {
      repositoryIds,
      branchName,
      scanId,
      isParanoid,
      ruleIds,
      engineRuleIds,
      language,
      severityIds,
      status: statusParam,
      type,
      introducedBy,
      path,
      hasTicket
    },
    permission
  } = req;

  let parsedRepositoryIds: number[] | undefined = repositoryIds
    ? parseNumberParams(repositoryIds)
    : undefined;

  const parsedSeverityIds: string[] | undefined = severityIds
    ? parseStringParams(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
    : undefined;

  const noResults = {
    data: [],
    count: {
      total: 0,
      open: 0,
      resolved: 0,
      fixed: 0,
      findings: 0
    }
  };

  if (scanId) {
    const scan = await getScan(scanId);

    if (!scan) {
      throw boom.notFound('Scan not found.');
    }

    // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
    // then we can short-circuit here as no results will match.
    if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
      return res.status(200).send(noResults);
    }

    parsedRepositoryIds = [scan.repository.idRepository];
  }

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  // we do not want to return an error since the user can have no repo registered yet
  if (!allowedIds.length) {
    return res.status(200).send(noResults);
  }

  if (!isValidStatusParam(statusParam)) {
    throw boom.badRequest(
      "Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum"
    );
  }

  const status = parseStatusQueryParam(statusParam);

  const parsedFilters = parseListParams({
    ruleIds,
    engineRuleIds,
    language,
    type,
    introducedBy,
    path
  });

  const response = await queryGroupedFindings({
    repositoryIds: allowedIds,
    branchName,
    scanId,
    isParanoid,
    filters: {
      ...parsedFilters,
      severityIds: parsedSeverityIds,
      status,
      hasTicket
    }
  });

  return res.status(200).send(response);
};

interface FindingCountParams extends ParsedQs {
  repositoryId: string;
  branchName?: string;
}

export const getFindingsCount = async (
  req: Request<any, any, any, FindingCountParams>,
  res: Response
) => {
  const {
    query: { repositoryId, branchName },
    permission
  } = req;

  const allowedIds = permission!.repositoriesEnforce(Number(repositoryId));

  // we do not want to return an error since the user can have no repo registered yet
  if (!allowedIds.length) {
    return res.status(200).send({});
  }

  const response = await getFindingsCountCoreApi(allowedIds[0], branchName);

  return res.status(200).send(response);
};

export const find = async (req: Request<any, any, any, ListFindingQueryParams>, res: Response) => {
  const {
    params: { ruleId },
    query: {
      repositoryIds,
      branchName,
      scanId,
      isParanoid,
      ruleIds,
      engineRuleIds,
      language,
      severityIds,
      status: statusParam,
      type,
      introducedBy,
      path,
      hasTicket,
      limit,
      offset
    },
    permission
  } = req;

  let parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const parsedSeverityIds: string[] | undefined = severityIds
    ? parseStringParams(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
    : undefined;

  if (scanId) {
    const scan = await getScan(scanId);

    if (!scan) {
      throw boom.notFound('Scan not found.');
    }

    // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
    // then we can short-circuit here as no results will match.
    if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
      return res.status(200).send([]);
    }

    parsedRepositoryIds = [scan.repository.idRepository];
  }

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  // we do not want to return an error since the user can have no repo registered yet
  if (!allowedIds.length) {
    return res.status(200).send([]);
  }

  if (!isValidStatusParam(statusParam)) {
    throw boom.badRequest(
      "Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum"
    );
  }

  const status = parseStatusQueryParam(statusParam);

  const parsedFilters = parseListParams({
    ruleIds,
    engineRuleIds,
    language,
    type,
    introducedBy,
    path
  });

  const response = await queryFindings({
    repositoryIds: allowedIds,
    branchName,
    isParanoid,
    scanId,
    ruleId,
    filters: {
      ...parsedFilters,
      severityIds: parsedSeverityIds,
      status,
      hasTicket
    },
    limit,
    offset
  });

  return res.status(200).send(response);
};

export const updateFindings = async (
  req: Request<
    any,
    any,
    { status: ActionType; total: number; excludedIds: string[]; ruleIds: number[] },
    ListFindingQueryParams
  >,
  res: Response
) => {
  const {
    query: {
      repositoryIds,
      branchName,
      scanId,
      isParanoid,
      engineRuleIds,
      language,
      severityIds,
      status: statusParam,
      type,
      introducedBy,
      path,
      hasTicket
    },
    body: { total, status: newStatus, excludedIds, ruleIds },
    permission,
    account,
    userInDb
  } = req;

  let parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  if (scanId) {
    const scan = await getScan(scanId);

    if (!scan) {
      throw boom.notFound('Scan not found.');
    }

    // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
    // then we can short-circuit here as no results will match.
    if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
      return res.status(200).send({ totalUpdatedFindings: 0 });
    }

    parsedRepositoryIds = [scan.repository.idRepository];
  }

  const parsedSeverityIds: string[] | undefined = severityIds
    ? parseStringParams(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
    : undefined;

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);
  if (!allowedIds.length) {
    return res.status(200).send({ totalUpdatedFindings: 0 });
  }

  if (!isValidStatusParam(statusParam)) {
    throw boom.badRequest(
      "Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum"
    );
  }

  const status = parseStatusQueryParam(statusParam);

  const parsedFilters = parseListParams({
    engineRuleIds,
    language,
    type,
    introducedBy,
    path
  });

  const updateResults = await batchUpdateFindings({
    repositoryIds: allowedIds,
    branchName,
    isParanoid: !!isParanoid,
    scanId,
    filters: {
      ...parsedFilters,
      severityIds: parsedSeverityIds,
      status,
      hasTicket,
      ruleIds
    },
    total,
    newStatus,
    idAccount: account!.idAccount,
    user: userInDb!,
    excludedIds
  });

  let totalUpdated = 0;

  updateResults
    .filter(r => r.updated)
    .forEach(({ totalUpdatedFindings }) => {
      totalUpdated += totalUpdatedFindings;
    });

  return res.status(200).send({ totalUpdatedFindings: totalUpdated });
};

export const patchOne = async (req: Request, res: Response) => {
  const {
    params: { findingId },
    body: { status },
    permission,
    userInDb,
    account
  } = req;

  if (account!.findingConfiguration?.requireApprovalOnUpdate) {
    throw boom.forbidden(
      'The approval process has been enabled. Please use this endpoint to update finding status: v2/findings/{idFinding}/request-change'
    );
  }

  const finding = await getFindingById(findingId);
  if (!finding) {
    throw boom.notFound(`No finding exist with id '${findingId}'.`);
  }

  permission!.repositoriesEnforce(finding.repository.idRepository);

  const { updated, finding: updatedFinding } = await updateActionAndPatchFindingStatus(
    finding,
    status,
    userInDb!,
    account!.idAccount
  );

  if (!updated) {
    throw boom.badRequest(
      `You are not allowed to change a finding/vulnerability status from ${finding.status} to ${status}.`
    );
  }

  return res.status(200).send(updatedFinding);
};

interface BulkUpdateBody {
  findingIds: string[];
  patch: {
    status: ActionType;
  };
}
export const bulkPatch = async (
  req: Request<any, any, BulkUpdateBody, FindingBaseQueryParams>,
  res: Response
) => {
  const {
    body: { findingIds, patch },
    permission,
    userInDb,
    account
  } = req;

  if (account!.findingConfiguration?.requireApprovalOnUpdate) {
    throw boom.forbidden(
      'The approval process has been enabled. Please use this endpoint to update finding status: v2/findings/bulk-request-change'
    );
  }

  const findings = await getFindingsByIds(findingIds);

  const repositoryIds = findings.map(finding => finding.fkRepository);
  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  const updatedFindingsResult = await Promise.all(
    findings
      .filter(f => allowedIds.includes(f.repository.idRepository))
      .map(finding =>
        updateActionAndPatchFindingStatus(finding, patch.status, userInDb!, account!.idAccount)
      )
  );

  // get only the updated ones
  const updatedFindings = updatedFindingsResult.filter(r => r.updated).map(r => r.finding);
  if (!updatedFindings.length) {
    throw boom.badRequest(
      "There was not findings/vulnerabilities to update. This happens when all changes aren't allowed. Please refer to the documentation or contact support."
    );
  }

  return res.status(200).send({ updatedFindings });
};

export const links = async (
  req: Request<any, any, any, { findingId: string; scanId: string | undefined }>,
  res: Response
) => {
  const {
    query: { findingId, scanId },
    permission
  } = req;

  const finding = await getFindingById(findingId);
  if (!finding) {
    throw boom.notFound(`Finding with id '${findingId}' doesn't exist.`);
  }

  permission!.repositoriesEnforce(finding.fkRepository);

  const { providerCodeLink } = await getFindingLinks(finding, scanId);

  return res.status(200).send({ providerCodeLink });
};

export const filters = async (
  req: Request<any, any, any, ListFindingQueryParams>,
  res: Response
) => {
  const {
    query: {
      repositoryIds,
      branchName,
      scanId,
      isParanoid,
      ruleIds,
      engineRuleIds,
      language,
      severityIds,
      status: statusParam,
      type,
      introducedBy,
      path,
      hasTicket
    },
    permission
  } = req;

  let parsedRepositoryIds = repositoryIds ? parseNumberParams(repositoryIds) : undefined;

  const parsedSeverityIds: string[] | undefined = severityIds
    ? parseStringParams(severityIds).map(severityId => severityMapping[severityId.toUpperCase()])
    : undefined;

  const noResults = {
    engineRule: [],
    introducedBy: [],
    language: [],
    severity: [],
    path: [],
    rule: [],
    status: [],
    type: []
  };

  if (scanId) {
    const scan = await getScan(scanId);

    if (!scan) {
      throw boom.notFound('Scan not found.');
    }

    // If user has filtered on both scan id and repository id, but the scan id doesn't belong to any of the repositories,
    // then we can short-circuit here as no results will match.
    if (parsedRepositoryIds && !parsedRepositoryIds.includes(scan.repository.idRepository)) {
      return res.status(200).send(noResults);
    }

    parsedRepositoryIds = [scan.repository.idRepository];
  }

  const allowedIds = permission!.repositoriesEnforce(parsedRepositoryIds);

  // we do not want to return an error since the user can have no repo registered yet
  if (!allowedIds.length) {
    return res.status(200).send(noResults);
  }

  if (!isValidStatusParam(statusParam)) {
    throw boom.badRequest(
      "Invalid value for parameter status. It can only be undefined, 'null', or a valid status enum"
    );
  }

  const status = parseStatusQueryParam(statusParam);

  const parsedFilters = parseListParams({
    ruleIds,
    engineRuleIds,
    language,
    type,
    introducedBy,
    path
  });

  const response = await queryFindingsFilters({
    repositoryIds: allowedIds,
    branchName,
    scanId,
    isParanoid,
    filters: {
      ...parsedFilters,
      severityIds: parsedSeverityIds,
      status,
      hasTicket
    }
  });

  return res.status(200).send(response);
};

export const codeBlock = async (req: Request, res: Response) => {
  const {
    params: { findingId },
    user,
    permission
  } = req;

  const finding = await getFindingById(findingId);
  if (!finding) {
    throw boom.notFound(`Finding with id '${findingId}' doesn't exist.`);
  }

  permission!.repositoriesEnforce(finding.fkRepository);

  const repository = await getRepositoryWithAccountById(finding.repository.idRepository);
  if (!repository) {
    throw boom.notFound('Repository not found.');
  }

  const content = await getCodeBlock(finding, repository, user);

  let language = 'general';
  if (finding.engineRule) {
    language = finding.engineRule.engine.language;
  } else if (finding.customEngineRule) {
    language = finding.customEngineRule.engine.language;
  }

  return res.status(200).send({
    content: content || '',
    language,
    error: content && Object.values<string>(FindingCodeBlockError).includes(content)
  });
};

export const requestChangeStatus = async (req: Request, res: Response) => {
  const {
    params: { findingId },
    body: { status, comments },
    permission,
    userInDb,
    account
  } = req;

  if (!account!.findingConfiguration?.requireApprovalOnUpdate) {
    throw boom.forbidden(
      'The approval process has been disabled. Please use this endpoint to update vulnerability status: v2/findings/{idFinding}'
    );
  }

  const finding = await getFindingById(findingId);
  if (!finding) {
    throw boom.notFound(`No finding exist with id '${findingId}'.`);
  }

  permission!.repositoriesEnforce(finding.repository.idRepository);

  if (!isStatusTransitionAllowed(finding.status, status)) {
    throw boom.badRequest(
      `You are not allowed to change a finding/vulnerability status from ${finding.status} to ${status}.`
    );
  }

  const requestedAction = await createChangeStatusRequestAction(
    finding,
    status,
    account!.idAccount,
    userInDb!,
    comments
  );

  return res.status(200).send(requestedAction);
};

export const bulkRequestChangeStatus = async (req: Request, res: Response) => {
  const {
    body: { findingIds, patch },
    permission,
    userInDb,
    account
  } = req;

  if (!account!.findingConfiguration?.requireApprovalOnUpdate) {
    throw boom.forbidden(
      'The approval process has been disabled. Please use this endpoint to update vulnerability status: v2/findings/bulk'
    );
  }

  const findings = await getFindingsByIds(findingIds);

  const repositoryIds = findings.map(finding => finding.fkRepository);
  const allowedIds = permission!.repositoriesEnforce(repositoryIds);

  const updatedFindingsResult = await Promise.all(
    findings
      .filter(
        f =>
          allowedIds.includes(f.repository.idRepository) &&
          isStatusTransitionAllowed(f.status, patch.status)
      )
      .map(finding =>
        createChangeStatusRequestAction(
          finding,
          patch.status,
          account!.idAccount,
          userInDb!,
          patch.comments
        )
      )
  );

  if (!updatedFindingsResult.length) {
    throw boom.badRequest(
      "There was not findings/vulnerabilities to update. This happens when all changes aren't allowed. Please refer to the documentation or contact support."
    );
  }
  return res.status(200).send({ updatedFindings: updatedFindingsResult });
};
