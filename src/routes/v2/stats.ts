import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as StatsController from '../../controllers/stats';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';
import { validateAccountId } from '../../helpers/validations';

const router = Router();

router.get(
  '/main',
  permissionsMiddleware(PermissionAction.READ, Resource.STATS, false),
  StatsController.main
);

/**
 * @swagger
 *  /v2/stats/time:
 *      get:
 *          summary: get number of opened and fixed issues of an organization within certain days
 *          description: Get number of opened and fixed issues of an organization or a repository within certain days by providing an accountId a repositoryId and a number of days.
 *          tags:
 *              - Stats
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the desired organization
 *                in: query
 *                required: true
 *                type: integer
 *              - name: repositoryId
 *                description: id of the desired repository
 *                in: query
 *                required: false
 *                type: integer
 *              - name: days
 *                description: scope of days to get number of opened and fixed issues of an organization and/or a repository
 *                example: 30
 *                in: query
 *                required: true
 *                type: integer

 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the number of opened and fixed issues of an organization in certain days corresponding to the given account id and days
 *                  content:
 *                      application/json:
 *                          schema:
 *                              $ref: "#/components/schemas/stats_time"
 *              404:
 *                  description: Resource not found . No organization corresponds to the given accountId
 */
router.get(
  '/time',
  permissionsMiddleware(PermissionAction.READ, Resource.STATS, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      days: Joi.number()
        .integer()
        .required(),
      repositoryId: Joi.number().integer(),
      ...validateAccountId
    })
  }),
  StatsController.listByTime
);

/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          stats_rules:
 *              type: object
 *              example: {"XSS Vulnerability on closeText option": { javascript: 5 }}
 *              properties:
 *                  vulnerability:
 *                      type: object
 *                      properties:
 *                          language:
 *                              type: integer
 *          stats_organizations:
 *              type: object
 *              example: {"guardrailsio": { secret: 5 }}
 *              properties:
 *                  organization:
 *                      type: object
 *                      properties:
 *                          type:
 *                              type: integer
 *          stats_time:
 *              type: array
 *              example: ["2020-02-25": { opened: 50, fixed: 25}]
 *              items:
 *                  date:
 *                      type: object
 *                      properties:
 *                          opened:
 *                              type: integer
 *                          fixed:
 *                              type: integer
 *          stats_open:
 *              type: array
 *              example: [{ idFinding: "24345-sdfq3-fdsfr4-123ed", idRepository: 50, fixedAt: "2020-09-09", introducedAt: "2020-01-23"}]
 *              items:
 *                  stat:
 *                      type: object
 *                      properties:
 *                          idFinding:
 *                              type: string
 *                              example: "24345-sdfq3-fdsfr4-123ed"
 *                          idRepository:
 *                              type: integer
 *                              example: 99
 *                          introducedAt:
 *                              type: string
 *                              example: "2020-01-23"
 *                          fixedAt:
 *                              type: string
 *                              example: "2020-09-09"
 *          stats_average:
 *              type: object
 *              example: { avg: 50, perc: 75}
 *              properties:
 *                  avg:
 *                      type: float32
 *                      example: 55.1
 *                  perc:
 *                      type: integer
 *                      example: 75
 *          stats_languages:
 *              type: object
 *              example: { javascript: 42, php: 33, golang: 4, others: 3}
 *
 */
export default router;
