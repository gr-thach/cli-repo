"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.find = void 0;
const report_1 = require("../helpers/report");
const find = async (req, res) => {
    const { query: { resource, repositoryId, branch, days }, permission } = req;
    const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    let reportData = [];
    if (allowedIds.length) {
        reportData = await (0, report_1.generate)(resource, allowedIds, branch, days ? Number(days) : undefined);
    }
    return res.status(200).send((0, report_1.formatReport)(reportData, resource, allowedIds, branch));
};
exports.find = find;
//# sourceMappingURL=reports.js.map