"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.getById = exports.filters = exports.list = void 0;
const applications_1 = require("../helpers/core-api/applications");
const list = async (req, res) => {
    const { query: { accountId, teamId, search, limit, offset } } = req;
    const result = await (0, applications_1.queryApplications)(Number(accountId), { teamId, search }, limit !== undefined ? Number(limit) : undefined, offset !== undefined ? Number(offset) : undefined);
    return res.status(200).send(result);
};
exports.list = list;
const filters = async (req, res) => {
    const { query: { accountId, teamId, search } } = req;
    const result = await (0, applications_1.queryApplicationsFilters)(Number(accountId), { teamId, search });
    return res.status(200).send(result);
};
exports.filters = filters;
const getById = async (req, res) => {
    const { params: { applicationId }, query: { accountId } } = req;
    const result = await (0, applications_1.queryApplicationById)(Number(accountId), Number(applicationId));
    return res.status(200).send(result);
};
exports.getById = getById;
const create = async (req, res) => {
    const { query: { accountId }, body: { application } } = req;
    const result = await (0, applications_1.createApplication)(Number(accountId), application);
    return res.status(200).send(result);
};
exports.create = create;
//# sourceMappingURL=applications.js.map