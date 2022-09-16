import boom from '@hapi/boom';
import { getScanWithFindings } from './core-api/scans';
import { queryFindingScans } from './core-api/findings';
import { findBaseAccountById } from './core-api/accounts';
import { linkToCode, linkToScan } from './common';
import { findFindingInScan } from './findings';
import { Finding, Scan } from '../interfaces';

export const getFindingLinks = async (finding: Finding, idScan?: string) => {
  let scan: Scan;

  if (idScan) {
    // If scan id is provided then we must make sure that the finding exist in that scan.
    const filter = {
      idFinding: { equalTo: finding.idFinding }
    };

    scan = await getScanWithFindings(idScan, filter);

    if (!scan) {
      throw boom.notFound('Scan not found.');
    }

    if (!findFindingInScan(scan, finding.idFinding)) {
      throw boom.notFound("Finding doesn't exist in the provided scan.");
    }
  } else {
    // If no scan id is provided then we will create a link to the commit sha of the latest scan.

    // Get a list of all the scans that the finding can be found in.
    const scans = await queryFindingScans({
      idFinding: finding.idFinding,
      offset: 0,
      limit: 1
    });

    if (scans.length === 0) {
      throw new Error(`Found a finding (${finding.idFinding}) that doesn't exist in a scan.`);
    } else if (scans.length > 1) {
      throw new Error('Received more than one scan, expected to get only one or zero scans.');
    }

    [scan] = scans;
  }

  const account = await findBaseAccountById(finding.repository?.fkAccount);

  const dashboardLink = linkToScan(account, finding.repository?.idRepository, scan.sha);

  const providerCodeLink = linkToCode(
    account,
    finding.repository.name,
    finding.path,
    finding.lineNumber,
    scan.sha
  );

  return {
    dashboardLink,
    providerCodeLink
  };
};
