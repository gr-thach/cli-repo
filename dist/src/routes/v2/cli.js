"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const CliController = __importStar(require("../../controllers/cli"));
const triggerValidateObject = {
    clitoken: celebrate_1.Joi.string().required(),
    repository: celebrate_1.Joi.string().required(),
    sha: celebrate_1.Joi.string().required(),
    branch: celebrate_1.Joi.string().required()
};
const router = (0, express_1.Router)();
router.post('/trigger-scan', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object(triggerValidateObject)
}), CliController.trigger);
router.post('/trigger-zip-scan', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({ ...triggerValidateObject, fileName: celebrate_1.Joi.string().required() })
}), CliController.triggerZipScan);
router.post('/trigger-zip-scan-upload-url', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        clitoken: celebrate_1.Joi.string().required(),
        file: celebrate_1.Joi.string().required()
    })
}), CliController.uploadUrl);
router.get('/scan', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.HEADERS]: celebrate_1.Joi.object({
        clitoken: celebrate_1.Joi.string().required(),
        idscan: celebrate_1.Joi.string().required()
    })
}, {
    allowUnknown: true
}), CliController.getScan);
exports.default = router;
//# sourceMappingURL=cli.js.map