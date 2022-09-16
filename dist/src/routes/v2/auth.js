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
const AuthController = __importStar(require("../../controllers/auth"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/auth:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: exchange API key for a JWT
 *     description: Exchange API key for a JWT
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: apiKey
 *         in: body
 *         type: string
 *         example: { "apiKey": "7bbc8bf6-9899-4f2f-ae47-5478fbb92b4b"}
 *         required: true
 *     responses:
 *       200:
 *         description: response will contain a JWT token that is valid for 6 hours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwtToken:
 *                   type: string
 */
router.post('/', (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
        apiKey: celebrate_1.Joi.string().required()
    })
}), AuthController.authenticate);
exports.default = router;
//# sourceMappingURL=auth.js.map