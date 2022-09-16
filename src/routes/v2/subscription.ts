import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as SubscriptionController from '../../controllers/subscription';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

router.put(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  celebrate({
    [Segments.BODY]: Joi.object({
      planId: Joi.number()
        .integer()
        .required(),
      interval: Joi.string().required(),
      promoCode: Joi.string().allow(null),
      checkoutFields: Joi.object({
        paymentMethodId: Joi.string(),
        email: Joi.string().required(),
        name: Joi.string().required()
      }),
      freeTrial: Joi.string()
    })
  }),
  SubscriptionController.update
);

router.delete(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  SubscriptionController.cancel
);

router.post(
  '/renew',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  SubscriptionController.renew
);

router.patch(
  '/toggle-interval',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  SubscriptionController.toggleInterval
);

/**
 * @swagger
 *  /v2/subscription/changelogs:
 *      get:
 *          summary: returns the changelog for the account's subscription
 *          description: returns all saved records of changed made on the account's subscriptions with associated user and plan.
 *          tags:
 *              - Subscription
 *          produces:
 *              - application/json
 *          parameters:
 *              - name: Authorization
 *                description: Authorization jwt token
 *                in: header
 *                required: true
 *                type: string
 *              - name: accountId
 *                description: id of the account from where to return the changelogs from
 *                example: 10
 *                in: query
 *                required: true
 *                type: number
 *          responses:
 *              200:
 *                  description:  Successful operation. Returns the list of changelogs objects.
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              properties:
 *                                  idSubscriptionChangelog:
 *                                      type: int
 *                                      example: 1
 *                                  subscriptionStatus:
 *                                      type: string
 *                                      example: active
 *                                  subscriptionEvent:
 *                                      type: string
 *                                      example: created
 *                                  subscriptionInterval:
 *                                      type: string
 *                                      example: monthly
 *                                  createdAt:
 *                                      type: Date
 *                                      example: active
 *                                  plan:
 *                                      type: object
 *                                      example: { idPlan: 5, name: 'Free', code: 'FREE' }
 *                                  user:
 *                                      type: object
 *                                      example: { login: 'test' }
 *
 */
router.get(
  '/changelogs',
  permissionsMiddleware(PermissionAction.READ, Resource.SUBSCRIPTION),
  SubscriptionController.listChangelogs
);

export default router;
