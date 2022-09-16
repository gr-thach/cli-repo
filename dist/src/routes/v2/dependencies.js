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
const DependenciesController = __importStar(require("../../controllers/dependencies"));
const interfaces_1 = require("../../interfaces");
const permissionsMiddleware_1 = __importDefault(require("../../middlewares/permissionsMiddleware"));
const router = (0, express_1.Router)();
/**
 * @swagger
 *  /v2/dependencies:
 *    get:
 *      summary: get the paginated list of repositories
 *      description: Get all the filters applicable for all dependencies for each repository's master branch.
 *      tags:
 *        - Dependencies
 *        - Filters
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: accountId
 *          description: account id
 *          example: 7
 *          in: query
 *          required: true
 *          type: string
 *        - name: hasVulnerability
 *          description: Show dependencies that have vulnerabilities
 *          example: true
 *          schema:
 *            type: string
 *            enum: [true, false]
 *          in: query
 *          required: false
 *          type: string
 *        - name: repoId
 *          description: Filter dependencies by repository id
 *          example: 7
 *          in: query
 *          required: false
 *          type: string
 *        - name: license
 *          description: Filter dependencies by license
 *          example: MIT
 *          in: query
 *          required: false
 *          type: string
 *        - name: limit
 *          description: Amount of dependencies to get per page
 *          example: 10
 *          in: query
 *          required: false
 *          type: integer
 *        - name: offset
 *          description: Initial position of the dependencies list to get dependencies paginated from
 *          example: 0
 *          in: query
 *          required: false
 *          type: integer
 *      responses:
 *        200:
 *          description: Successful operation. Returns an object including the array of filters applicable to dependencies
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  filters:
 *                    type: object
 *                    properties:
 *                      language:
 *                        type: array
 */
router.get('/', (0, permissionsMiddleware_1.default)(interfaces_1.PermissionAction.READ, interfaces_1.Resource.REPOSITORIES, false), DependenciesController.list);
exports.default = router;
//# sourceMappingURL=dependencies.js.map