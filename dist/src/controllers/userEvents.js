"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniqueUsersInPeriod = void 0;
const userEvents_1 = require("../helpers/core-api/userEvents");
const getUniqueUsersInPeriod = async (req, res) => {
    const { query: { from, to }, account } = req;
    const users = await (0, userEvents_1.uniqueUsersInPeriod)(account.idAccount, from, to);
    return res.status(200).send({ users });
};
exports.getUniqueUsersInPeriod = getUniqueUsersInPeriod;
//# sourceMappingURL=userEvents.js.map