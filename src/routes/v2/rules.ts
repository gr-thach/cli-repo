import { Router } from 'express';
import * as RulesController from '../../controllers/rules';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 *
 * /v2/rules/listRules:
 *   get:
 *     summary: get the list of Guardrails curated rules
 *     tags:
 *       - Rules
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List Guardrails curated rules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rules'
 */
router.get(
  '/listRules',
  permissionsMiddleware(PermissionAction.READ, Resource.RULES),
  RulesController.listRules
);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      Rules:
 *        type: array
 *        example: [ { "name": "GR0001", "title": "Insecure Use of SQL Queries", "enable": true, "languages": { "c": true } } ]
 *        items:
 *          type: object
 *          properties:
 *            name: string
 *            title: string
 *            enable: boolean
 *            languages:
 *              type: object
 *              properties:
 *                languageName: string
 *
 */
export default router;
