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
const validations_1 = require("../../helpers/validations");
const BranchesController = __importStar(require("../../controllers/branches"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 * /v2/branches:
 *   get:
 *     summary: find branches by repository
 *     description: Get all branches for a given repository id
 *     tags:
 *      - Branches
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: repoId
 *         in: query
 *         type: integer
 *         example: 42
 *         required: true
 *         description: The id of the repository containing the desired branches
 *       - name: limit
 *         in: query
 *         type: integer
 *         example: 16
 *         required: false
 *         description: Amount of branches to get per page
 *       - name: offset
 *         in: query
 *         type: integer
 *         example: 0
 *         required: false
 *         description: Initial position of the branches list to get branches paginated from
 *       - name: total
 *         in: query
 *         type: integer
 *         example: 30
 *         required: false
 *         description: Total amount of branches to avoid getting this value from the git providers (specially for Gitlab, because they not always return it)
 *     responses:
 *       200:
 *         description: Successful operation. Returns an array containing all the branches of a given repository and the totalCount of them
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/branch'
 *                 totalCount:
 *                   type: number
 *       404:
 *         description: Resources not Found. The Branches could not be found with the given repoId
 */
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.REPOSITORIES, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        repositoryId: celebrate_1.Joi.number()
            .integer()
            .required(),
        ...validations_1.validateAccountId,
        ...validations_1.validateLimit,
        ...validations_1.validateOffset,
        total: celebrate_1.Joi.number().integer()
    })
}), BranchesController.list);
/**
 * @swagger
 * /v2/branches/find:
 *   get:
 *     summary: find branches by repository
 *     description: Get all branches for a given repository id
 *     tags:
 *      - Branches
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: repositoryId
 *         in: query
 *         type: integer
 *         example: 42
 *         required: true
 *         description: The id of the repository containing the desired branches
 *       - name: branch
 *         in: param
 *         type: string
 *         example: 'master'
 *         required: true
 *         description: The name of the desired branch
 *     responses:
 *       200:
 *         description: Successful operation. Returns an object containing the branch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/branch'
 *       404:
 *         description: Resource not Found. The Branch could not be found with the given repoId and branch
 */
router.get('/:branch', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.REPOSITORIES, false), (0, celebrate_1.celebrate)({
    [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
        branch: celebrate_1.Joi.string().required()
    }),
    [celebrate_1.Segments.QUERY]: celebrate_1.Joi.object({
        repositoryId: celebrate_1.Joi.number()
            .integer()
            .required(),
        ...validations_1.validateAccountId
    })
}), BranchesController.find);
/**
 * @swagger
 *
 * components:
 *    schemas:
 *      branch:
 *        type: object
 *        properties:
 *          name:
 *            type: string
 *            example: "develop"
 *          commit:
 *            type: object
 *            properties:
 *              sha:
 *                type: string
 *                example: "c8a2d940efa6d1ef7afb4f6e154d74c2a3773999"
 *              url:
 *                type: string
 *                example: "https://api.github.com/repos/randomuser/reponame/commits/c8a2d940efa6d1ef7afb4f6e154d74c2a3773999"
 *          protected:
 *            type: boolean
 *            example: false
 *          lastScans:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                totalVulnerabilities:
 *                  type: integer
 *                  example: 4
 *                finishedAt:
 *                  type: date
 *                  example: 2020-02-25T05:28:36.134+00:00
 */
exports.default = router;
//# sourceMappingURL=branches.js.map