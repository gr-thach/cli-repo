import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as AuthController from '../../controllers/auth';

const router = Router();

/**
 * @swagger
 *
 * /v2/auth:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: exchange API key for a JWT
 *     description: Exchange API key for a JWT
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: apiKey
 *         in: body
 *         type: string
 *         example: { "apiKey": "7bbc8bf6-9899-4f2f-ae47-5478fbb92b4b"}
 *         required: true
 *     responses:
 *       200:
 *         description: response will contain a JWT token that is valid for 6 hours
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwtToken:
 *                   type: string
 */
router.post(
  '/',
  celebrate({
    [Segments.BODY]: Joi.object({
      apiKey: Joi.string().required()
    })
  }),
  AuthController.authenticate
);

export default router;
