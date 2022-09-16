import { Router } from 'express';
import * as PlansController from '../../controllers/plans';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.SUBSCRIPTION),
  PlansController.list
);

export default router;
