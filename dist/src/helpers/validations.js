"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccountId = exports.validateOffset = exports.validateLimit = void 0;
const celebrate_1 = require("celebrate");
exports.validateLimit = {
    limit: celebrate_1.Joi.number()
        .integer()
        .greater(0)
};
exports.validateOffset = {
    offset: celebrate_1.Joi.number()
        .integer()
        .min(0)
};
exports.validateAccountId = {
    accountId: celebrate_1.Joi.number()
        .integer()
        .required()
};
//# sourceMappingURL=validations.js.map