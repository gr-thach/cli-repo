import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';
import { validateAccountId, validateLimit, validateOffset } from '../../helpers/validations';

import * as BranchesController from '../../controllers/branches';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 * /v2/branches:
 *   get:
 *     summary: find branches by repository
 *     description: Get all branches for a given repository id
 *     tags:
 *      - Branches
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: repoId
 *         in: query
 *         type: integer
 *         example: 42
 *         required: true
 *         description: The id of the repository containing the desired branches
 *       - name: limit
 *         in: query
 *         type: integer
 *         example: 16
 *         required: false
 *         description: Amount of branches to get per page
 *       - name: offset
 *         in: query
 *         type: integer
 *         example: 0
 *         required: false
 *         description: Initial position of the branches list to get branches paginated from
 *       - name: total
 *         in: query
 *         type: integer
 *         example: 30
 *         required: false
 *         description: Total amount of branches to avoid getting this value from the git providers (specially for Gitlab, because they not always return it)
 *     responses:
 *       200:
 *         description: Successful operation. Returns an array containing all the branches of a given repository and the totalCount of them
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/branch'
 *                 totalCount:
 *                   type: number
 *       404:
 *         description: Resources not Found. The Branches could not be found with the given repoId
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.QUERY]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required(),
      ...validateAccountId,
      ...validateLimit,
      ...validateOffset,
      total: Joi.number().integer()
    })
  }),
  BranchesController.list
);

/**
 * @swagger
 * /v2/branches/find:
 *   get:
 *     summary: find branches by repository
 *     description: Get all branches for a given repository id
 *     tags:
 *      - Branches
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: Authorization
 *         description: Authorization jwt token
 *         in: header
 *         required: true
 *         type: string
 *       - name: repositoryId
 *         in: query
 *         type: integer
 *         example: 42
 *         required: true
 *         description: The id of the repository containing the desired branches
 *       - name: branch
 *         in: param
 *         type: string
 *         example: 'master'
 *         required: true
 *         description: The name of the desired branch
 *     responses:
 *       200:
 *         description: Successful operation. Returns an object containing the branch
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: '#/components/schemas/branch'
 *       404:
 *         description: Resource not Found. The Branch could not be found with the given repoId and branch
 */
router.get(
  '/:branch',
  permissionsMiddleware(PermissionAction.READ, Resource.REPOSITORIES, false),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      branch: Joi.string().required()
    }),
    [Segments.QUERY]: Joi.object({
      repositoryId: Joi.number()
        .integer()
        .required(),
      ...validateAccountId
    })
  }),
  BranchesController.find
);

/**
 * @swagger
 *
 * components:
 *    schemas:
 *      branch:
 *        type: object
 *        properties:
 *          name:
 *            type: string
 *            example: "develop"
 *          commit:
 *            type: object
 *            properties:
 *              sha:
 *                type: string
 *                example: "c8a2d940efa6d1ef7afb4f6e154d74c2a3773999"
 *              url:
 *                type: string
 *                example: "https://api.github.com/repos/randomuser/reponame/commits/c8a2d940efa6d1ef7afb4f6e154d74c2a3773999"
 *          protected:
 *            type: boolean
 *            example: false
 *          lastScans:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                totalVulnerabilities:
 *                  type: integer
 *                  example: 4
 *                finishedAt:
 *                  type: date
 *                  example: 2020-02-25T05:28:36.134+00:00
 */
export default router;
