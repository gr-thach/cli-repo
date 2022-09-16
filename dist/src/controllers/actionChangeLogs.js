"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const boom_1 = __importDefault(require("@hapi/boom"));
const actions_1 = require("../helpers/core-api/actions");
const actionChangeLogs_1 = require("../helpers/core-api/actionChangeLogs");
const list = async (req, res) => {
    const { query: { actionId }, permission } = req;
    const action = await (0, actions_1.findActionById)(Number(actionId));
    if (!action) {
        throw boom_1.default.badRequest('Action not found.');
    }
    permission.repositoriesEnforce(action.repository.idRepository);
    const actionChangeLogs = await (0, actionChangeLogs_1.findActionChangeLogsByActionId)(action.idAction);
    return res.status(200).send(actionChangeLogs);
};
exports.list = list;
//# sourceMappingURL=actionChangeLogs.js.map