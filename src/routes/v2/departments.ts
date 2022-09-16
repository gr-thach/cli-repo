import { Router } from 'express';
import * as DepartmentsController from '../../controllers/departments';
import { PermissionAction, Resource } from '../../interfaces';
import permissionsMiddleware from '../../middlewares/permissionsMiddleware';

const router = Router();

router.get(
  '/',
  permissionsMiddleware(PermissionAction.READ, Resource.TEAMS),
  DepartmentsController.list
);
router.post(
  '/',
  permissionsMiddleware(PermissionAction.WRITE, Resource.TEAMS),
  DepartmentsController.create
);

export default router;
