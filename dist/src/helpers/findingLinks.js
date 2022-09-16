"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFindingLinks = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const scans_1 = require("./core-api/scans");
const findings_1 = require("./core-api/findings");
const accounts_1 = require("./core-api/accounts");
const common_1 = require("./common");
const findings_2 = require("./findings");
const getFindingLinks = async (finding, idScan) => {
    let scan;
    if (idScan) {
        // If scan id is provided then we must make sure that the finding exist in that scan.
        const filter = {
            idFinding: { equalTo: finding.idFinding }
        };
        scan = await (0, scans_1.getScanWithFindings)(idScan, filter);
        if (!scan) {
            throw boom_1.default.notFound('Scan not found.');
        }
        if (!(0, findings_2.findFindingInScan)(scan, finding.idFinding)) {
            throw boom_1.default.notFound("Finding doesn't exist in the provided scan.");
        }
    }
    else {
        // If no scan id is provided then we will create a link to the commit sha of the latest scan.
        // Get a list of all the scans that the finding can be found in.
        const scans = await (0, findings_1.queryFindingScans)({
            idFinding: finding.idFinding,
            offset: 0,
            limit: 1
        });
        if (scans.length === 0) {
            throw new Error(`Found a finding (${finding.idFinding}) that doesn't exist in a scan.`);
        }
        else if (scans.length > 1) {
            throw new Error('Received more than one scan, expected to get only one or zero scans.');
        }
        [scan] = scans;
    }
    const account = await (0, accounts_1.findBaseAccountById)(finding.repository?.fkAccount);
    const dashboardLink = (0, common_1.linkToScan)(account, finding.repository?.idRepository, scan.sha);
    const providerCodeLink = (0, common_1.linkToCode)(account, finding.repository.name, finding.path, finding.lineNumber, scan.sha);
    return {
        dashboardLink,
        providerCodeLink
    };
};
exports.getFindingLinks = getFindingLinks;
//# sourceMappingURL=findingLinks.js.map