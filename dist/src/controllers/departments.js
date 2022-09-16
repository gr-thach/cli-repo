"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.list = void 0;
const departments_1 = require("../helpers/core-api/departments");
const list = async (req, res) => {
    const { account } = req;
    const result = await (0, departments_1.queryDepartments)(account.idAccount);
    return res.status(200).send(result);
};
exports.list = list;
const create = async (req, res) => {
    const { body: { department }, account } = req;
    const result = await (0, departments_1.createDepartments)(account.idAccount, department);
    return res.status(200).send(result);
};
exports.create = create;
//# sourceMappingURL=departments.js.map