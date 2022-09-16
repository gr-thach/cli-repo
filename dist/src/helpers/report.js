"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = exports.formatReport = void 0;
const scans_1 = require("./core-api/scans");
const formatReport = (reportData, resource, repositoryIds, branch) => {
    return {
        metadata: {
            resource,
            ...(repositoryIds.length === 1 && reportData.length && { repo: reportData[0].repo }),
            ...(branch && { branch })
        },
        data: reportData.length > 200 ? reportData.slice(0, 199) : reportData
    };
};
exports.formatReport = formatReport;
const generate = async (resource, repositoryIds, branch, days = 30) => {
    switch (resource) {
        case 'scan':
            return (0, scans_1.queryScansReport)(repositoryIds, branch, days);
        case 'vulnerability':
            return []; // createVulnerabilityReport(repoId, branch, days);
        default:
            return [];
    }
};
exports.generate = generate;
//# sourceMappingURL=report.js.map