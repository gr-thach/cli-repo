import { Router } from 'express';
import * as RolesController from '../../controllers/roles';

const router = Router();

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
export default router;
