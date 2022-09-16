"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByTime = exports.main = void 0;
const stats_1 = require("../helpers/core-api/stats");
const main = async (req, res) => {
    const { query: { repositoryId }, permission } = req;
    const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({});
    }
    const stats = await (0, stats_1.mainStats)(allowedIds);
    return res.status(200).send(stats);
};
exports.main = main;
const listByTime = async (req, res) => {
    const { query: { repositoryId, days }, permission } = req;
    const repositoryIds = repositoryId ? [Number(repositoryId)] : undefined;
    const allowedIds = permission.repositoriesEnforce(repositoryIds);
    if (!allowedIds.length) {
        return res.status(200).send({});
    }
    const stats = await (0, stats_1.statsOverTime)(allowedIds, Number(days));
    return res.status(200).send(stats);
};
exports.listByTime = listByTime;
//# sourceMappingURL=stats.js.map