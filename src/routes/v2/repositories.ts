import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as RepositoriesController from '../../controllers/repositories';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId, validateLimit, validateOffset } from '../../helpers/validations';

const router = Router();

/**
 * @swagger
 *  /v2/repositories:
 *      get:
 *          summary: get the paginated list of repositories
 *          description: Get the paginated list of repositories and allows to filter them and order them by column
 *          tags:
 *              - Repositories
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the account to get the repositories from
 *                example: 123
 *                in: query
 *                required: true
 *                type: number
 *              - name: license
 *                description: Filter repositories has package license
 *                example: MIT
 *                in: query
 *                required: false
 *                type: string
 *              - name: pkg_ecosystem
 *                description: Filter repositories has package language
 *                example: npm
 *                in: query
 *                required: false
 *                type: string
 *              - name: dependency
 *                description: Filter repositories has dependency
 *                example: axios
 *                in: query
 *                required: false
 *                type: string
 *              - name: limit
 *                description: Amount of repositories to get per page
 *                example: 10
 *                in: query
 *                required: false
 *                type: integer
 *              - name: offset
 *                description: Initial position of the repositories list to get repositories paginated from
 *                example: 0
 *                in: query
 *                required: false
 *                type: integer
 *              - name: orderBy
 *                description: sorting parameter with format column,direction
 *                example: "updatedAt,desc"
 *                in: query
 *                required: false
 *                type: string
 *              - name: monorepoId
 *                description: get all repos descendant and sub-descendant for the repo with this id
 *                example: 238
 *                in: query
 *                required: false
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns an array of repositories
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                  $ref: "#/components/schemas/repository"
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      orderBy: Joi.string(),
      teamId: Joi.number(),
      pkg_ecosystem: Joi.string(),
      license: Joi.string(),
      search: Joi.string().allow(''),
      dependency: Joi.string(),
      isPrivate: Joi.string(),
      language: Joi.string(),
      isEnabled: Joi.string(),
      monorepoId: Joi.number(),
      ...validateAccountId,
      ...validateLimit,
      ...validateOffset
    })
  }),
  RepositoriesController.list
);

/**
 * @swagger
 *  /v2/repositories/stats:
 *      post:
 *          summary: get stats of scan enabled repositories of an organization within certain days
 *          description: Get stats of scan enabled repositories of an organization within certain days by providing an accountId and days
 *          tags:
 *              - Repositories
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: accountId
 *                description: id of the desired organization
 *                in: query
 *                required: true
 *                type: integer
 *              - name: repositoryIds
 *                description: comma separated ids of the desired repositories
 *                in: query
 *                required: false
 *                type: string
 *              - name: days
 *                description: scope of days to calculate stats of the scan enabled repositories of an organization
 *                example: 30
 *                in: query
 *                required: false
 *                type: integer
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the organization scan enabled repositories stats corresponding to the given account id
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/repo_stats"
 *              404:
 *                  description: Resource not found . No organization corresponds to the given accountId
 */
router.get(
  '/stats',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryIds: Joi.string(),
      days: Joi.number().integer(),
      ...validateAccountId
    })
  }),
  RepositoriesController.stats
);

/**
 * @swagger
 *  /v2/repositories/filters:
 *    get:
 *      summary: get list filters applicable for repositories
 *      description: Get all the filters applicable for all repositories for each repository's master branch.
 *      tags:
 *        - Repositories
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
 *          description: id of the user's account
 *          example: 7
 *          in: query
 *          required: true
 *          type: string
 *      responses:
 *        200:
 *          description: Successful operation. Returns an object including the array of filters applicable to repositories
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
  '/filters',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  RepositoriesController.filters
);

/**
 * @swagger
 *  /v2/repositories/{repoId}:
 *      get:
 *          summary: find a repository
 *          description: Find a specific repository by providing a repoId.
 *          tags:
 *              - Repositories
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: repoId
 *                description: id of the desired repository
 *                in: path
 *                required: true
 *                type: integer
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the repository corresponding to the given id
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/repository"
 *              404:
 *                  description: Resource not found . No repository corresponds to the given repoId
 */
router.get(
  '/:repoId',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  RepositoriesController.find
);

router.patch(
  '/configuration',
  permissionsMiddleware(PermissionAction.WRITE, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      repoId: Joi.number()
        .integer()
        .required(),
      configuration: Joi.object().required()
    })
  }),
  RepositoriesController.config
);

/**
 * @swagger
 *  /v2/repositories/bulk:
 *    patch:
 *      summary: patch repositories by a list of ids
 *      description: patch one or more repositories in bulk
 *      tags:
 *        - repositories
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: patch
 *          in: body
 *          required: true
 *          description: what we want to patch on the repositories
 *          type: object
 *          properties:
 *            - isEnabled:
 *              type: boolean
 *            - repositoryIds:
 *              description: comma separated ids of the repositories to bulk patch
 *              type: string
 *      responses:
 *        200:
 *          description: Successful operation.
 */
router.patch(
  '/bulk',
  permissionsMiddleware(PermissionAction.WRITE, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      repositoryIds: Joi.string(),
      isEnabled: Joi.boolean().required()
    })
  }),
  RepositoriesController.bulkPatch
);

/**
 * @swagger
 *  /v2/repositories/{repoId}:
 *      patch:
 *          summary: update a repository
 *          description: Update a specific repository by providing a repoId and the properties to update.
 *          tags:
 *              - Repositories
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: repoId
 *                description: id of the desired repository
 *                in: path
 *                required: true
 *                type: integer
 *              - name: isEnabled
 *                description: enable/disable Guardrails for the given repository
 *                example: true
 *                in: body
 *                required: true
 *                type: boolean
 *          responses:
 *              200:
 *                  description:  Successful operation. The repository has been successfully updated
 *                  content:
 *                      application/json
 *              404:
 *                  description: Resource not found . No repository corresponds to the given repoId
 */
router.patch(
  '/:repositoryId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      isEnabled: Joi.boolean().required()
    }),
    [Segments.PARAMS]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required()
    })
  }),
  RepositoriesController.update
);

/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          repo_stats:
 *              type: object
 *              properties:
 *                  idRepository:
 *                      type: object
 *                      example: {"2020-02-25": 5}
 *                      properties:
 *                          date:
 *                              type: integer
 *                              example: 5
 *          repository:
 *              type: object
 *              properties:
 *                  idRepository:
 *                      type: integer
 *                      example: 42
 *                  name:
 *                      type: string
 *                      example: "MySuperRepo"
 *                  providerInternalId:
 *                      type: string
 *                      example: "1"
 *                  provider:
 *                      type: string
 *                      example: "github"
 *                  fkAccount:
 *                      type: integer
 *                      example: 3
 *                      description: Id of the account that owns the repository
 *                  isPrivate:
 *                      type: boolean
 *                      example: false
 *                  isEnabled:
 *                      type: boolean
 *                      example: true
 *                  description:
 *                      type: string
 *                      example: "description of my super repo"
 *                  default_branch:
 *                      type: string
 *                      example: "master"
 *                  ssh_url:
 *                      type: string
 *                      example: "ssh://mysuperrepossh_url"
 *                  homepage:
 *                      type: string
 *                      example: "http://mysuperepo.com"
 *                  http_url:
 *                      type: string
 *                      example: "mysuperrepo_url"
 *                  language:
 *                      type: string
 *                      example: "javascript"
 *                  archived:
 *                      type: boolean
 *                      example: false
 *                  badgeToken:
 *                      type: string
 *                      example: "b4dg3t0k3n"
 *                  configuration:
 *                      type: object
 *                  createdAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  updatedAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  deletedAt:
 *                      type: date
 *                      example: null
 *                  gitMetadata:
 *                      type: object
 *                  lastScan:
 *                      type: object
 *                      schema:
 *                          $ref: "#/components/schemas/last_scan"
 *          last_scan:
 *              type: object
 *              properties:
 *                  finishedAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  totalVulnerabilities:
 *                      type: integer
 *                      example: 7
 *                  branch:
 *                      type: string
 *                      example: "develop"
 *
 */
export default router;
