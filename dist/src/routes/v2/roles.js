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
const RolesController = __importStar(require("../../controllers/roles"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *
 * /v2/roles:
 *   get:
 *     tags:
 *       - Role
 *     summary: get the list of roles
 *     description: Get the list of account roles
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of account roles
 *         content:
 *           application/json:
 *             schema:
 *               schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/role"
 */
router.get('/', RolesController.list);
/**
 * @swagger
 *
 * /v2/roles:
 *   get:
 *     tags:
 *       - Team Role
 *     summary: get the list of roles
 *     description: Get the list of account roles
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of team roles
 *         content:
 *           application/json:
 *             schema:
 *               schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/teamRole"
 */
router.get('/teamRoles', RolesController.listTeamRoles);
/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          role:
 *              type: object
 *              properties:
 *                  idRole:
 *                      type: integer
 *                      example: 1
 *                  name:
 *                      type: string
 *                      example: "developer"
 *                  description:
 *                      type: string
 *                      example: "Developer Role"
 *          teamRole:
 *              type: object
 *              properties:
 *                  idTeamRole:
 *                      type: integer
 *                      example: 1
 *                  name:
 *                      type: string
 *                      example: "team_admin"
 *                  description:
 *                      type: string
 *                      example: "Team Admin"
 */
exports.default = router;
//# sourceMappingURL=roles.js.map