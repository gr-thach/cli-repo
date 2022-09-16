"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamRoles = exports.list = void 0;
const roles_1 = require("../helpers/core-api/roles");
const list = async (req, res) => {
    const roles = await (0, roles_1.findAllRoles)();
    return res.status(200).send(roles);
};
exports.list = list;
const listTeamRoles = async (req, res) => {
    const teamRoles = await (0, roles_1.findAllTeamRoles)();
    return res.status(200).send(teamRoles);
};
exports.listTeamRoles = listTeamRoles;
//# sourceMappingURL=roles.js.map