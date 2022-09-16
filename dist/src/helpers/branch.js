"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignScansToBranches = void 0;
const scan_1 = require("./scan");
const fetchLatestBranchScans = async ({ branch, repositoryId }) => {
    const { scans } = await (0, scan_1.queryLatestScansByRepoBranch)({ repositoryId, branch });
    if (!scans || !scans.length) {
        return branch;
    }
    return {
        ...branch,
        lastScans: scans
            .map(({ totalVulnerabilities, status, finishedAt }) => ({
            totalVulnerabilities,
            status,
            finishedAt
        }))
            .filter(s => s.status.name === 'success')
    };
};
const assignScansToBranches = async ({ branches, repositoryId }) => {
    return Promise.all(branches.map(branch => fetchLatestBranchScans({ branch, repositoryId })));
};
exports.assignScansToBranches = assignScansToBranches;
//# sourceMappingURL=branch.js.map