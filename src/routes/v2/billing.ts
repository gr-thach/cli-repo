import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import * as BillingController from '../../controllers/billing';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

router.get(
  '/payment-method',
  permissionsMiddleware(PermissionAction.READ, Resource.SUBSCRIPTION),
  BillingController.getPaymentMethod
);

router.post(
  '/payment-method',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  BillingController.savePaymentMethod
);

router.get(
  '/portal',
  permissionsMiddleware(PermissionAction.WRITE, Resource.SUBSCRIPTION),
  BillingController.redirectToBillingPortal
);

router.post(
  '/check-coupon',
  celebrate({
    [Segments.BODY]: Joi.object({
      code: Joi.string().required(),
      planId: Joi.number()
        .integer()
        .required()
    })
  }),
  BillingController.checkCoupon
);

export default router;
