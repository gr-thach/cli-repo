import { Router } from 'express';
import * as EnginesController from '../../controllers/engines';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 *
 * /v2/engines:
 *   get:
 *     summary: get the list of engines grouped by language
 *     tags:
 *       - Engines
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List engines grouped by language
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/engines'
 */

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.ENGINES),
  EnginesController.list
);

/**
 * @swagger
 *
 * /v2/engines/listRules:
 *   get:
 *     summary: get the list of engines and their respective rules
 *     tags:
 *       - Engines
 *     parameters:
 *       - name: accountId
 *         description: id of the user's account
 *         example: 7
 *         in: query
 *         required: true
 *         type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List of engines and their rules
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/engineRules'
 */
router.get(
  '/listRules',
  permissionsMiddleware(PermissionAction.READ, Resource.RULES),
  EnginesController.listRules
);

// This route works with login and provider params to get the account,
// so it won't use the permissionsMiddleware but handle permissions inside the controller
router.post('/custom', EnginesController.uploadCustomEngine);

/**
 * @swagger
 *
 * components:
 *   schemas:
 *      engines:
 *        type: array
 *        example: [ { javascript: [ "npm-audit", "eslint", "retirejs"]}]
 *        items:
 *          type: object
 *          properties:
 *            lang:
 *              type: array
 *              items:
 *                type: string
 *                example: "eslint"
 *
 *      engineRules:
 *        type: array
 *        example: [ { engineName: "general-detect-secrets", rules: [ { name: "gr-detect-secrets", docs: null, enable: true } ] } ]
 *        items:
 *          type: object
 *          properties:
 *            engineName: string
 *            rules:
 *              type: array
 *              items:
 *                name: string
 *                docs: string
 *                enable: boolean
 */
export default router;
