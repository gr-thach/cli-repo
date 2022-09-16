"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRules = void 0;
const grRules_1 = require("../helpers/core-api/grRules");
const yml_1 = require("../helpers/yml");
const listRules = async (req, res) => {
    const rules = await (0, grRules_1.listGrRules)();
    return res.status(200).send(rules.map(x => ({
        ...x,
        languages: Object.assign({}, ...yml_1.allowedLanguages.map(language => ({ [language]: true })))
    })));
};
exports.listRules = listRules;
//# sourceMappingURL=rules.js.map