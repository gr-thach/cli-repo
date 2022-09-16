import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as TeamsController from '../../controllers/teams';
import { PermissionAction } from '../../interfaces';
import teamsPermissionsMiddleware from '../../middlewares/teamsPermissionsMiddleware';

const validateTeamIdParams = celebrate({
  [Segments.PARAMS]: Joi.object({
    teamId: Joi.number()
      .integer()
      .required()
  })
});

const router = Router();

/**
 * @swagger
 *
 * /v2/teams:
 *   get:
 *     tags:
 *       - Teams
 *     summary: get paginated teams
 *     description: Get the list of teams for an account paginated and with the total count
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId to get the teams from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to search teams by their name
 *         type: string
 *       - name: department
 *         in: query
 *         required: false
 *         description: the department to filter teams by
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of teams for the current page and the total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                   $ref: "#/components/schemas/team"
 *                 totalCount:
 *                   type: integer
 */
router.get('/', teamsPermissionsMiddleware(PermissionAction.READ), TeamsController.list);

/**
 * @swagger
 *
 * /v2/teams/listFromGitProvider:
 *   get:
 *     tags:
 *       - Teams
 *     summary: List of teams to import
 *     description: Get list of teams that are not imported to Guardrails
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId that will be the owner of the created team
 *         type: integer
 *     responses:
 *       200:
 *         description: Response will contain the teams from git provider
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: "#/components/schemas/GitProviderTeam"
 */
router.get(
  '/listFromGitProvider',
  teamsPermissionsMiddleware(PermissionAction.READ),
  TeamsController.listFromGitProvider
);

/**
 * @swagger
 *
 * /v2/teams/filters:
 *   get:
 *     tags:
 *       - Teams
 *     summary: get team filters
 *     description: Get the filters for the list of teams for an account
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId to get the filters from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to filter out filters by the teams name
 *         type: string
 *       - name: department
 *         in: query
 *         required: false
 *         description: the department to filter out filters by
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the filters for the entire list of teams in the account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 department:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/filters', teamsPermissionsMiddleware(PermissionAction.READ), TeamsController.filters);

/**
 * @swagger
 *
 * /v2/teams/{teamId}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: get team by id
 *     description: Get the team for an account by the team id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId owner of the team
 *         type: integer
 *     responses:
 *       200:
 *         description: Response will contain the team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/team"
 */
router.get(
  '/:teamId',
  teamsPermissionsMiddleware(PermissionAction.READ, false),
  validateTeamIdParams,
  TeamsController.getById
);

/**
 * @swagger
 *
 * /v2/teams:
 *   post:
 *     tags:
 *       - Teams
 *     summary: create a team
 *     description: Create a team based on the team sent in the request's body
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId that will be the owner of the created team
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team:
 *                 $ref: "#/components/schemas/createOrPatchTeam"
 *     responses:
 *       200:
 *         description: Response will contain the created team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/team"
 */
router.post('/', teamsPermissionsMiddleware(PermissionAction.WRITE), TeamsController.create);

/**
 * @swagger
 *
 * /v2/teams/import:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Import git provider teams to Guardrails
 *     description: Import git provider teams to Guardrails
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId that will be the owner of the created team
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teams:
 *                  type: array
 *                  items:
 *                    $ref: "#/components/schemas/GitProviderTeam"
 *     responses:
 *       200:
 *         description: Response will contain the import result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  addedUsers:
 *                    type: number
 *                  addedRepositories:
 *                    type: number
 *                  addedTeams:
 *                    type: number
 */
router.post(
  '/import',
  teamsPermissionsMiddleware(PermissionAction.WRITE),
  TeamsController.importTeams
);

/**
 * @swagger
 *
 * /v2/teams/{teamId}:
 *   patch:
 *     tags:
 *       - Teams
 *     summary: update a team
 *     description: Update a team based on the team sent in the request's body
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId that will be the owner of the updated team
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patch:
 *                 $ref: "#/components/schemas/createOrPatchTeam"
 *     responses:
 *       200:
 *         description: Response will contain the updated team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/team"
 */
router.patch(
  '/:teamId',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.patch
);

/**
 * @swagger
 *
 * /v2/teams/{teamId}:
 *   delete:
 *     tags:
 *       - Teams
 *     summary: delete team by id
 *     description: Delete the team for an account by the team id
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: accountId
 *         in: query
 *         required: true
 *         description: the accountId owner of the team
 *         type: integer
 *     responses:
 *       200:
 *         description: ok if the team was deleted
 *       404:
 *         description: if the team couldn't be found or deleted
 */
router.delete(
  '/:teamId',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.destroy
);

router.post(
  '/:teamId/applications',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.addApplications
);

router.put(
  '/:teamId/applications',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.putApplications
);

router.delete(
  '/:teamId/applications',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.removeApplications
);

router.post(
  '/:teamId/repositories',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.addRepositories
);

router.put(
  '/:teamId/repositories',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.putRepositories
);

router.delete(
  '/:teamId/repositories',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.removeRepositories
);

router.post(
  '/:teamId/users',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.addUsers
);

router.put(
  '/:teamId/users',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.putUsers
);

router.patch(
  '/:teamId/users',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.patchUsers
);

router.delete(
  '/:teamId/users',
  teamsPermissionsMiddleware(PermissionAction.WRITE, false),
  validateTeamIdParams,
  TeamsController.removeUsers
);

/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          team:
 *              type: object
 *              properties:
 *                  idTeam:
 *                      type: integer
 *                      example: 1
 *                  fkAccount:
 *                      type: integer
 *                      example: 100
 *                  name:
 *                      type: string
 *                      example: "Frontend"
 *                  description:
 *                      type: string
 *                      example: "Frontend team in charge of web apps"
 *                  department:
 *                      type: string
 *                      example: "Development"
 *          createOrPatchTeam:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      example: "Frontend"
 *                  description:
 *                      type: string
 *                      example: "Frontend team in charge of web apps"
 *                  department:
 *                      type: string
 *                      example: "Development"
 *          GitProviderTeam:
 *              type: object
 *              properties:
 *                  id:
 *                    type: number
 *                    required: true
 *                    example: 1
 *                  name:
 *                    type: string
 *                    required: true
 *                    example: "Justice League"
 *                  memberCount:
 *                    type: number
 *                    required: true
 *                    example: 2
 *                  repositoryCount:
 *                    type: number
 *                    required: true
 *                    example: 2
 *                  children:
 *                    type: array
 *                    items:
 *                       $ref: "#/components/schemas/GitProviderTeam"
 *                  slug:
 *                    type: string
 *                    required: true
 *                    example: "justice-league"
 *                  htmlUrl:
 *                    type: string
 *                  description:
 *                    type: string
 */
export default router;
