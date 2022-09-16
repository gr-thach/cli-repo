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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const celebrate_1 = require("celebrate");
const ActionsController = __importStar(require("../../controllers/actions"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const validations_1 = require("../../helpers/validations");
const router = (0, express_1.Router)();
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.ACTIONS, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        repositoryId: celebrate_1.Joi.number()
            .integer()
            .required(),
        ...validations_1.validateAccountId
    })
}), ActionsController.list);
router.get('/count', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        status: celebrate_1.Joi.string()
            .required()
            .valid(...Object.values(interfaces_1.ActionStatus)),
        ...validations_1.validateAccountId
    })
}), ActionsController.getActionsCount);
router.get('/filters', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), ActionsController.getActionFilters);
router.get('/groupedByRules', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), ActionsController.getActionsGroupedByRules);
router.get('/:ruleId', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), ActionsController.getActionsByRule);
router.delete('/:actionId', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
        actionId: celebrate_1.Joi.number()
            .integer()
            .required()
    })
}), ActionsController.destroy);
router.patch('/bulk', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), ActionsController.bulkUpdatePendingActions);
router.patch('/:actionId', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.WRITE, interfaces_1.Resource.ACTIONS, false), ActionsController.updatePendingAction);
exports.default = router;
//# sourceMappingURL=actions.js.map