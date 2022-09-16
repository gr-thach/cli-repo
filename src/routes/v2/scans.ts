import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { validateAccountId, validateLimit, validateOffset } from '../../helpers/validations';

import * as ScansController from '../../controllers/scans';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 *  /v2/scans/lastPerRepo:
 *      post:
 *          summary: get a list of properties from scans
 *          description: Get details of last scans results of each repositories' default branch
 *          tags:
 *              - Scans
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: accountID to fetch the results for
 *                example: 1234
 *                in: query
 *                required: true
 *                type: number
 *                items:
 *                    type: integer
 *                    example: 1
 *              - name: repositoryIds
 *                description: comma separated list of id of repositories to fetch the results for
 *                example: 1,2,3,5
 *                in: query
 *                required: false
 *                type: string
 *              - name: limit
 *                description: maximum number of results to be returned for the pagination
 *                example: 5
 *                in: query
 *                required: false
 *                type: number
 *          responses:
 *              200:
 *                  description: Successful operation. Returns an array of scan object with limited properties corresponding to last scan ran on given repos and branches
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                  $ref: "#/components/schemas/last_scan"
 *
 */
router.get(
  '/lastPerRepo',
  permissionsMiddleware(PermissionAction.READ, Resource.SCANS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryIds: Joi.string(),
      ...validateAccountId,
      ...validateLimit
    })
  }),
  ScansController.listLast
);

/**
 * @swagger
 *  /v2/scans:
 *      get:
 *          summary: get list of scans
 *          description: Get all the scans by account or repositoryIds
 *          tags:
 *              - Scans
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the user's account
 *                example: 7
 *                in: query
 *                required: true
 *                type: string
 *              - name: repositoryIds
 *                description: array of repository ids for the corresponding scans
 *                in: query
 *                required: false
 *                type: array
 *                items:
 *                    type: integer
 *                    example: 430
 *              - name: branch
 *                description: name of the branch for the corresponding scans
 *                example: "master"
 *                in: query
 *                required: false
 *                type: string
 *              - name: sha
 *                description: sha to filter scans by
 *                example: "b905a6b2576a4fb6ddc000073ab8d5040fae6426"
 *                in: query
 *                required: false
 *                type: string
 *              - name: limit
 *                description: maximum number of scans to be returned for the pagination
 *                example: 5
 *                in: query
 *                required: false
 *                type: number
 *              - name: offset
 *                description: position of the pagination for the first result returned
 *                example: 10
 *                in: query
 *                required: false
 *                type: number
 *              - name: orderBy
 *                description: sorting parameter with format column,direction
 *                example: "updatedAt,desc"
 *                in: query
 *                required: false
 *                type: string
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns an array of scans filtered by repository and/or branch
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                  $ref: "#/components/schemas/scan"
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.SCANS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryIds: Joi.string(),
      branch: Joi.string(),
      orderBy: Joi.string(),
      search: Joi.string(),
      type: Joi.string(),
      sha: Joi.string(),
      sender: Joi.string(),
      hasVulnerabilities: Joi.string(),
      ...validateAccountId,
      ...validateLimit,
      ...validateOffset
    })
  }),
  ScansController.list
);

/**
 * @swagger
 *  /v2/scans/filters:
 *    get:
 *      summary: get list filters applicable for scans
 *      description: Get all the filters applicable for all scans for each repository's master branch.
 *      tags:
 *        - Scans
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
 *        - name: repositoryIds
 *          description: for corresponding respositories
 *          in: query
 *          required: false
 *          type: array
 *          items:
 *            type: integer
 *            example: 430
 *        - name: branch
 *          description: for a specific branch
 *          example: "master"
 *          in: query
 *          required: true
 *          type: string
 *        - name: sha
 *          description: for a specific sha
 *          example: de9f2c7fd25e1b3afad3e85a0bd17d9b100db4b3
 *          in: query
 *          required: false
 *          type: string
 *      responses:
 *        200:
 *          description: Successful operation. Returns an object including the array of filters applicable to scans
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  filters:
 *                    type: object
 *                    properties:
 *                      type:
 *                        type: array
 *                      sha:
 *                        type: array
 *                      sender:
 *                        type: array
 */
router.get(
  '/filters',
  permissionsMiddleware(PermissionAction.READ, Resource.SCANS, false),
  ScansController.filters
);

/**
 * @swagger
 *  /v2/scans/bulk:
 *    patch:
 *      summary: create a bulk scan
 *      description: create a bulk scan
 *      tags:
 *        - Scans
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: repositoryIds
 *          description: for corresponding respositories
 *          in: query
 *          required: false
 *          type: array
 *          items:
 *            type: integer
 *            example: 430
 *      responses:
 *        200:
 *          description: Successful operation.
 */
router.post(
  '/bulk',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SCANS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      repositoryIds: Joi.string()
    })
  }),
  ScansController.bulkTrigger
);

/**
 * @swagger
 *  /v2/scans/{repositoryId}:
 *      post:
 *          summary: create a scan
 *          description: create a new scan for a repository's branch
 *          tags:
 *              - Scans
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the user's account
 *                example: 7
 *                in: query
 *                required: true
 *                type: string
 *              - name: repositoryId
 *                description: id of the corresponding repository
 *                example: 7
 *                in: path
 *                required: true
 *                type: string
 *              - name: branch
 *                description: name of corresponding branch to scan
 *                in: query
 *                required: true
 *                type: string
 *                example: "master"
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the id of the newly created scan.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  idScan:
 *                                      type: string
 *                                      example: "newScanId"
 *
 */
router.post(
  '/:repositoryId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SCANS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      branch: Joi.string().required(),
      ...validateAccountId
    }),
    [Segments.PARAMS]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required()
    })
  }),
  ScansController.trigger
);

/**
 * @swagger
 *  /v2/scans/{repositoryId}:
 *      put:
 *          summary: retriger a scan
 *          description: regriger a particular scan given idScan
 *          tags:
 *              - Scans
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                in: query
 *                required: true
 *                description: the accountId to get the applications from
 *                type: integer
 *              - name: repositoryId
 *                description: id of the corresponding repository
 *                example: 7
 *                in: path
 *                required: true
 *                type: string
 *              - name: idScan
 *                description: uuid of the corresponding scan
 *                example: f63e3c55-dca9-4a32-afe9-9e12b4a8aa04
 *                in: path
 *                required: true
 *                type: string
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the id of the re-triggered scan.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: object
 *                              properties:
 *                                  idScan:
 *                                      type: string
 *                                      example: "f63e3c55-dca9-4a32-afe9-9e12b4a8aa04"
 */
router.put(
  '/:repositoryId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SCANS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      scanId: Joi.string().required(),
      ...validateAccountId
    }),
    [Segments.PARAMS]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required()
    })
  }),
  ScansController.reTrigger
);

/**
 * @swagger
 *  components:
 *      schemas:
 *          githook_metadata:
 *              type: object
 *              properties:
 *                  ref:
 *                      type: string
 *                      example: "master-UserName"
 *                  commit:
 *                      type: object
 *                      properties:
 *                          message:
 *                              type: string
 *                              example: "On-demand scan triggered via the Dashboard"
 *                  sender:
 *                      type: object
 *                      properties:
 *                          login:
 *                              type: string
 *                              example: "GreatUser"
 *                          avatar_url:
 *                              type: string
 *                              example: "http://myavatarUrl.com"
 *                  config:
 *                      type: object
 *                      properties:
 *                          report:
 *                              type: object
 *                              properties:
 *                                  pullRequest:
 *                                      type: object
 *                                      properties:
 *                                          comment:
 *                                              type: boolean
 *                                              example: true
 *                                          findings:
 *                                              type: string
 *                                              example: "onChangedLinesOnly"
 *                          bundles:
 *                              type: string
 *                              example: "auto"
 *                          ruleOverride:
 *                              type: object
 *                              properties:
 *                                  engineRules:
 *                                      type: object
 *                                  GuardRailsRules:
 *                                      type: object
 *                          notification:
 *                              type: object
 *                              properties:
 *                                  slack:
 *                                      type: object
 *                                      properties:
 *                                          enabled:
 *                                              type: boolean
 *                                              example: false
 *          scan:
 *              type: object
 *              properties:
 *                  idScan:
 *                      type: string
 *                      example: "scanId"
 *                  type:
 *                      type: string
 *                      enum:
 *                          - BRANCH
 *                          - PULL
 *                          - CLI
 *                  branch:
 *                      type: string
 *                      example: "master"
 *                  sha:
 *                      type: string
 *                      example: "094t523s"
 *                  githookMetadata:
 *                      type: object
 *                      schema:
 *                          $ref: "#/components/schemas/githook_metadata"
 *                  totalVulnerabilities:
 *                      type: integer
 *                      example: 7
 *                  newVulnerabilities:
 *                      type: integer
 *                      example: 3
 *                  queuedAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  scanningAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  finishedAt:
 *                      type: date
 *                      example: 2020-02-25T05:28:36.134+00:00
 *                  prNumber:
 *                      type: number
 *                      example: 42
 *                  repository:
 *                      type: object
 *                      properties:
 *                          idRepository:
 *                              type: integer
 *                              example: 12
 *                          name:
 *                              type: string
 *                              example: "MySuperRepo"
 *                          isEnabled:
 *                              type: boolean
 *                              example: true
 *                  status:
 *                      type: object
 *                      properties:
 *                          idScanStatus:
 *                              type: integer
 *                              example: 99
 *                          name:
 *                              type: string
 *                              enum:
 *                                  - queued
 *                                  - scanning
 *                                  - success
 *                                  - error
 *                  result:
 *                      type: object
 *                      properties:
 *                          idScanResult:
 *                              type: integer
 *                              example: 100
 *                          name:
 *                              type: string
 *                              enum:
 *                                  - pass
 *                                  - fail
 *                  engineRuns:
 *                      type: array
 *                      items:
 *                          type: object
 *
 *          last_scan:
 *              type: object
 *              properties:
 *                  fkRepository:
 *                      type: number
 *                      example: 99
 *                  branch:
 *                      type: string
 *                      example: master
 *                  totalVulnerabilities:
 *                      type: number
 *                      example: 666
 *                  finishedAt:
 *                      type: string
 *                      example: 2020-08-06 16:31:03
 *
 */

export default router;
