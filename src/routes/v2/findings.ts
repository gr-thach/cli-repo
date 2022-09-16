import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as FindingsController from '../../controllers/findings';
import { ActionType, PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId, validateLimit, validateOffset } from '../../helpers/validations';

const router = Router();

router.get(
  '/links',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      findingId: Joi.string().required(),
      scanId: Joi.string(),
      ...validateAccountId
    })
  }),
  FindingsController.links
);

router.get(
  '/codeBlock/:findingId',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  FindingsController.codeBlock
);

/**
 * @swagger
 *  /v2/findings:
 *    get:
 *      summary: get list of findings grouped by rule
 *      description: Get all the findings for each repository's master branch. They can by filtered to get either only findings, or only vulnerabilities
 *      tags:
 *        - Findings
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
 *        - name: branchName
 *          description: for a specific branch
 *          example: "master"
 *          in: query
 *          required: true
 *          type: string
 *        - name: scanId
 *          description: for a specific scan
 *          example: 5
 *          in: query
 *          required: false
 *          type: string
 *        - name: isVulnerability
 *          description: to filter out only vulnerabilities or findings. If true, will only includes vulnerabilities, if false or undefined, will onl includes findings
 *          example: true
 *          in: query
 *          required: false
 *          type: boolean
 *      responses:
 *        200:
 *          description: Successful operation. Returns an object including the array of findings count grouped by rules filtered by repository and/or branch and/or scan and the total count
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  count:
 *                    type: integer
 *                    example: 190
 *                  findings:
 *                    type: array
 *                    items:
 *                      type: object
 *                      properties:
 *                        rule:
 *                          type: object
 *                          properties:
 *                            idRule:
 *                              type: integer
 *                              example: 1
 *                            name:
 *                              type: string
 *                              example: GR0001
 *                            title:
 *                              type: string
 *                              example: Vulnerable Library
 *                        languages:
 *                          type: array
 *                          items:
 *                            type: string
 *                            example: Javascript
 *                        count:
 *                          type: object
 *                          properties:
 *                            total:
 *                              type: integer
 *                              example: 50
 *                            open:
 *                              type: integer
 *                              example: 11
 *                            resolved:
 *                              type: integer
 *                              example: 12
 *                            fixed:
 *                              type: integer
 *                              example: 13
 *                            findings:
 *                              type: integer
 *                              example: 14
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  FindingsController.list
);

router.get(
  '/count',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required(),
      branchName: Joi.string().required(),
      ...validateAccountId
    })
  }),
  FindingsController.getFindingsCount
);

/**
 * @swagger
 *  /v2/findings/filters:
 *    get:
 *      summary: get list filters applicable for findings grouped by rule
 *      description: Get all the filters applicable for all findings for each repository's master branch.
 *      tags:
 *        - Findings
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
 *        - name: branchName
 *          description: for a specific branch
 *          example: "master"
 *          in: query
 *          required: true
 *          type: string
 *        - name: scanId
 *          description: for a specific scan
 *          example: 5
 *          in: query
 *          required: false
 *          type: string
 *        - name: status
 *          description: to filter out only vulnerabilities or findings by status. Normally used to separate between findings and vulnerabilities.
 *          example: FIXED,MARK_AS_FIXED
 *          in: query
 *          required: false
 *          type: string
 *      responses:
 *        200:
 *          description: Successful operation. Returns an object including the array of filters applicable to findings
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  filters:
 *                    type: object
 *                    properties:
 *                      rule:
 *                        type: array
 *                      status:
 *                        type: array
 *                      language:
 *                        type: array
 *                      type:
 *                        type: array
 *                      introducedBy:
 *                        type: array
 *                      path:
 *                        type: array
 */
router.get(
  '/filters',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  FindingsController.filters
);

/**
 * @swagger
 *  /v2/findings/{ruleId}:
 *    get:
 *      summary: get list of findings for a given rule
 *      description: Get all the findings for a given rule They can by filtered to get either only findings, or only vulnerabilities
 *      tags:
 *        - Findings
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
 *        - name: branchName
 *          description: for a specific branch
 *          example: "master"
 *          in: query
 *          required: true
 *          type: string
 *        - name: scanId
 *          description: for a specific scan
 *          example: 5
 *          in: query
 *          required: false
 *          type: string
 *        - name: languages
 *          description: for specific languages
 *          in: query
 *          required: false
 *          type: array
 *          items:
 *            type: string
 *            example: javascript
 *        - name: isVulnerability
 *          description: to filter out only vulnerabilities or findings. If true, will only includes vulnerabilities, if false or undefined, will onl includes findings
 *          example: true
 *          in: query
 *          required: false
 *          type: boolean
 *      responses:
 *        200:
 *          description: Successful operation. Returns an  array of findings filtered by repository and/or branch and/or scan
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  $ref: "#/components/schemas/finding"
 *
 */
router.get(
  '/:ruleId',
  permissionsMiddleware(PermissionAction.READ, Resource.FINDINGS, false),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      ruleId: Joi.string().required()
    }),
    [Segments.QUERY]: Joi.object({
      repositoryIds: Joi.string(),
      branchName: Joi.string(),
      scanId: Joi.string(),
      isParanoid: Joi.boolean(),
      ruleIds: Joi.string(),
      engineRuleIds: Joi.string(),
      language: Joi.string(),
      severityIds: Joi.string(),
      status: Joi.string(),
      type: Joi.string().allow(''),
      introducedBy: Joi.string(),
      path: Joi.string(),
      hasTicket: Joi.boolean(),
      ...validateAccountId,
      ...validateLimit,
      ...validateOffset
    })
  }),
  FindingsController.find
);

/**
 * @swagger
 *  /v2/findings/bulk:
 *    patch:
 *      summary: patch findings by a list of ids
 *      description: patch one or more findings in bulk
 *      tags:
 *        - Findings
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
 *          description: what we want to patch on the findings
 *          type: object
 *          properties:
 *            - status:
 *              type: string
 *              enum:
 *                - MARK_AS_VULNERABILITY
 *                - MARK_AS_FIXED
 *                - WONT_FIX
 *                - FALSE_POSITIVE
 *      responses:
 *        200:
 *          description: Successful operation.
 */
router.patch(
  '/bulk',
  permissionsMiddleware(PermissionAction.WRITE, Resource.FINDINGS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      patch: Joi.object({
        status: Joi.string()
          .required()
          .valid(...Object.values(ActionType))
      }).required(),
      findingIds: Joi.array()
        .items(Joi.string())
        .required()
    })
  }),
  FindingsController.bulkPatch
);

/**
 * @swagger
 *  /v2/findings/bulkByRules:
 *    patch:
 *      summary: patch findings on the same rules
 *      description: patch findings on the same rules
 *      tags:
 *        - Findings
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
 *        - name: status
 *          in: body
 *          required: true
 *          description: New status of the findings
 *          type: string
 *          enum:
 *            - MARK_AS_VULNERABILITY
 *            - MARK_AS_FIXED
 *            - WONT_FIX
 *            - FALSE_POSITIVE
 *        - name: total
 *          in: body
 *          required: true
 *          description: Total number of updating findings
 *          type: number
 *        - name: excludedIds
 *          in: body
 *          required: true
 *          description: Ids of findings that should be excluded
 *          type: array
 *        - name: ruleIds
 *          in: body
 *          required: true
 *          description: Ids of rules
 *          type: array
 *      responses:
 *        200:
 *          description: Successful operation.
 */
router.patch(
  '/bulkByRules',
  permissionsMiddleware(PermissionAction.WRITE, Resource.FINDINGS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      status: Joi.string()
        .required()
        .valid(...Object.values(ActionType)),
      total: Joi.number()
        .integer()
        .required(),
      excludedIds: Joi.array()
        .items(Joi.string())
        .required(),
      ruleIds: Joi.array()
        .items(Joi.number().integer())
        .required()
    })
  }),
  FindingsController.updateFindings
);

/**
 * @swagger
 *  /v2/findings/bulk-request-change:
 *    patch:
 *      summary: request change findings' statuses by a list of ids
 *      description:  request change one or more findings' statuses in bulk
 *      tags:
 *        - Findings
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
 *          description: what we want to patch on the findings
 *          type: object
 *          properties:
 *            - status:
 *              type: string
 *              enum:
 *                - MARK_AS_VULNERABILITY
 *                - MARK_AS_FIXED
 *                - WONT_FIX
 *                - FALSE_POSITIVE
 *            - note:
 *              type: string
 *      responses:
 *        200:
 *          description: Successful operation.
 */
router.patch(
  '/bulk-request-change',
  permissionsMiddleware(PermissionAction.WRITE, Resource.FINDINGS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      patch: Joi.object({
        status: Joi.string()
          .required()
          .valid(...Object.values(ActionType)),
        comments: Joi.string().required()
      }).required(),
      findingIds: Joi.array()
        .items(Joi.string())
        .required()
    })
  }),
  FindingsController.bulkRequestChangeStatus
);

/**
 * @swagger
 *  /v2/findings/{idFinding}:
 *    patch:
 *      summary: patch a finding's status
 *      description: patch a finding with a status to manually alter the state of a finding or vulnerability
 *      tags:
 *        - Findings
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: status
 *          in: body
 *          required: true
 *          description: the status we want to assign to the finding
 *          type: string
 *          enum:
 *            - MARK_AS_VULNERABILITY
 *            - MARK_AS_FIXED
 *            - WONT_FIX
 *            - FALSE_POSITIVE
 *      responses:
 *        200:
 *          description: Successful operation. The finding is returned with the updated status, and if applicatble, the updated fixedAt and fixedBy properties
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/finding"
 */
router.patch(
  '/:findingId',
  permissionsMiddleware(PermissionAction.WRITE, Resource.FINDINGS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      status: Joi.string()
        .required()
        .valid(...Object.values(ActionType))
    }),
    [Segments.PARAMS]: Joi.object({
      findingId: Joi.string().required()
    })
  }),
  FindingsController.patchOne
);

/**
 * @swagger
 *  /v2/findings/{idFinding}/request-change:
 *    patch:
 *      summary: request change a finding's status
 *      description: request change a finding with a status to manually alter the state of a finding or vulnerability
 *      tags:
 *        - Findings
 *      produces:
 *        - application/json
 *      parameters:
 *        - name: Authorization
 *          description: Authorization jwt token
 *          in: header
 *          required: true
 *          type: string
 *        - name: status
 *          in: body
 *          required: true
 *          description: the status we want to assign to the finding
 *          type: string
 *          enum:
 *            - MARK_AS_VULNERABILITY
 *            - MARK_AS_FIXED
 *            - WONT_FIX
 *            - FALSE_POSITIVE
 *      responses:
 *        200:
 *          description: Successful operation. A request to change finding's status is created and pending to review
 *          content:
 *            application/json:
 *              schema:
 *                $ref: "#/components/schemas/finding"
 */
router.patch(
  '/:findingId/request-change',
  permissionsMiddleware(PermissionAction.WRITE, Resource.FINDINGS, false),
  celebrate({
    [Segments.BODY]: Joi.object({
      status: Joi.string()
        .required()
        .valid(...Object.values(ActionType)),
      comments: Joi.string().required()
    }),
    [Segments.PARAMS]: Joi.object({
      findingId: Joi.string().required()
    })
  }),
  FindingsController.requestChangeStatus
);

/**
 * @swagger
 *  components:
 *    schemas:
 *      finding:
 *        type: object
 *        properties:
 *          idFinding:
 *            type: string
 *            example: b84f6cb0-26c4-49e8-81eb-4c2de96040ea
 *          repository:
 *            type: object
 *            properties:
 *              idRepository:
 *                type: integer
 *                example: 99
 *              name:
 *                type: string
 *                example: MyRepository
 *          branch:
 *            type: string
 *            example: master
 *          language:
 *            type: string
 *            example: php
 *          type:
 *            type: string
 *            example: sast
 *          status:
 *            type: string
 *            enum:
 *              - VULNERABILITY
 *              - MARK_AS_VULNERABILITY
 *              - FIXED
 *              - MARK_AS_FIXED
 *              - WONT_FIX
 *              - FALSE_POSITIVE
 *              - null
 *          path:
 *            type: string
 *            example: src/DataFixtures/ORM/LoadPurchasingPowerData.php
 *          lineNumber:
 *            type: integer
 *            example: 33
 *          score:
 *            type: integer
 *            nullable: true
 *            example: 1
 *          metadata:
 *            type: object
 *            properties:
 *              severity:
 *                type: string
 *                example: '5'
 *              description:
 *                type: string
 *                example: Filesystem function file_get_contents() detected with dynamic parameter
 *          ticketLink:
 *            type: string
 *            nullable: true
 *            example: null
 *          introducedBy:
 *            type: string
 *            example: aBadUser
 *          introducedAt:
 *            type: string
 *            example: 2020-03-17T08:09:32.823+00:00
 *          fixedAt:
 *            type: string
 *            nullable: true
 *            example: 2020-03-19T08:09:32.823+00:00
 *          fixedBy:
 *            type: string
 *            nullable: true
 *            example: aNiceUser
 *          rule:
 *            type: object
 *            properties:
 *              idRule:
 *                type: integer
 *                example: 1
 *              name:
 *                type: string
 *                example: GR0001
 *              title:
 *                type: string
 *                example: Vulnerable Library
 *          severity:
 *            type: object
 *            properties:
 *              idSeverity:
 *                type: integer
 *                example: 1
 *              name:
 *                type: string
 *                example: '5'
 *          sha:
 *            type: string
 *            example: d237d6cb5be3281c93cdad4511c5e47d34c0f7b1
 *          scanId:
 *            type: string
 *            example: 16124010-5550-4b17-b292-42c533bbeede
 *          engineRunId:
 *            type: string
 *            example: 8baecf14-9c56-4541-bbff-acd6cf2da7ec
 *          duplicatedWith:
 *            type: string
 *            nullable: true
 *            example: b84f6cb0-26c4-49e8-81eb-4c2de96040ea
 *
 */
export default router;
