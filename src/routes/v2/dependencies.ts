import { Router } from 'express';
import * as DependenciesController from '../../controllers/dependencies';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

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
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  DependenciesController.list
);

export default router;
