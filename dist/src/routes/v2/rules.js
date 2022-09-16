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
const RulesController = __importStar(require("../../controllers/rules"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/rules/listRules:
 *   get:
 *     summary: get the list of Guardrails curated rules
 *     tags:
 *       - Rules
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List Guardrails curated rules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rules'
 */
router.get('/listRules', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.RULES), RulesController.listRules);
/**
 * @swagger
 *
 * components:
 *   schemas:
 *      Rules:
 *        type: array
 *        example: [ { "name": "GR0001", "title": "Insecure Use of SQL Queries", "enable": true, "languages": { "c": true } } ]
 *        items:
 *          type: object
 *          properties:
 *            name: string
 *            title: string
 *            enable: boolean
 *            languages:
 *              type: object
 *              properties:
 *                languageName: string
 *
 */
exports.default = router;
//# sourceMappingURL=rules.js.map