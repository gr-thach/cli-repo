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
const EnginesController = __importStar(require("../../controllers/engines"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/engines:
 *   get:
 *     summary: get the list of engines grouped by language
 *     tags:
 *       - Engines
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List engines grouped by language
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/engines'
 */
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.ENGINES), EnginesController.list);
/**
 * @swagger
 *
 * /v2/engines/listRules:
 *   get:
 *     summary: get the list of engines and their respective rules
 *     tags:
 *       - Engines
 *     parameters:
 *       - name: accountId
 *         description: id of the user's account
 *         example: 7
 *         in: query
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List of engines and their rules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/engineRules'
 */
router.get('/listRules', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.RULES), EnginesController.listRules);
// This route works with login and provider params to get the account,
// so it won't use the permissionsMiddleware but handle permissions inside the controller
router.post('/custom', EnginesController.uploadCustomEngine);
/**
 * @swagger
 *
 * components:
 *   schemas:
 *      engines:
 *        type: array
 *        example: [ { javascript: [ "npm-audit", "eslint", "retirejs"]}]
 *        items:
 *          type: object
 *          properties:
 *            lang:
 *              type: array
 *              items:
 *                type: string
 *                example: "eslint"
 *
 *      engineRules:
 *        type: array
 *        example: [ { engineName: "general-detect-secrets", rules: [ { name: "gr-detect-secrets", docs: null, enable: true } ] } ]
 *        items:
 *          type: object
 *          properties:
 *            engineName: string
 *            rules:
 *              type: array
 *              items:
 *                name: string
 *                docs: string
 *                enable: boolean
 */
exports.default = router;
//# sourceMappingURL=engines.js.map