import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as ApplicationsController from '../../controllers/applications';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

/**
 * @swagger
 *
 * /v2/applications:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get paginated applications
 *     description: Get the list of applications for an account paginated and with the total count
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
 *         description: the accountId to get the applications from
 *         type: integer
 *       - name: search
 *         in: query
 *         required: false
 *         description: used to search applications by their name
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the list of applications for the current page and the total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                   $ref: "#/components/schemas/application"
 *                 totalCount:
 *                   type: integer
 */
router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.APPLICATIONS),
  ApplicationsController.list
);

/**
 * @swagger
 *
 * /v2/applications/filters:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get application filters
 *     description: Get the filters for the list of applications for an account
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
 *         description: used to filter out filters by the applications name
 *         type: string
 *       - name: department
 *         in: query
 *         required: false
 *         description: the department to filter out filters by
 *         type: string
 *     responses:
 *       200:
 *         description: Response will contain the filters for the entire list of applications in the account
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
router.get(
  '/filters',
  permissionsMiddleware(PermissionAction.READ, Resource.APPLICATIONS),
  ApplicationsController.filters
);

/**
 * @swagger
 *
 * /v2/applications/{applicationId}:
 *   get:
 *     tags:
 *       - Applications
 *     summary: get application by id
 *     description: Get the application for an account by the application id
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
 *         description: the accountId owner of the application
 *         type: integer
 *     responses:
 *       200:
 *         description: Response will contain the application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/application"
 */
router.get(
  '/:applicationId',
  permissionsMiddleware(PermissionAction.READ, Resource.APPLICATIONS),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      applicationId: Joi.number()
        .integer()
        .required()
    })
  }),
  ApplicationsController.getById
);

/**
 * @swagger
 *
 * /v2/applications:
 *   post:
 *     tags:
 *       - Applications
 *     summary: create a application
 *     description: Create a application based on the application sent in the request's body
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
 *         description: the accountId that will be the owner of the created application
 *         type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application:
 *                 $ref: "#/components/schemas/createOrPatchApplication"
 *     responses:
 *       200:
 *         description: Response will contain the created application
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               $ref: "#/components/schemas/application"
 */
router.post(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.APPLICATIONS),
  ApplicationsController.create
);

/**
 * @swagger
 *
 *  components:
 *      schemas:
 *          application:
 *              type: object
 *              properties:
 *                  idApplication:
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
 *                      example: "Frontend application"
 *          createOrPatchApplication:
 *              type: object
 *              properties:
 *                  name:
 *                      type: string
 *                      example: "Frontend"
 *                  description:
 *                      type: string
 *                      example: "Frontend application"
 */
export default router;
