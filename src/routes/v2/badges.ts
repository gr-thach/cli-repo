import { Router } from 'express';
import * as BadgesController from '../../controllers/badges';

const router = Router();

router.get(
  ['/:accountIdentifier/:repoName.svg', '/:accountIdentifier/:repoName'],
  BadgesController.get
);

export default router;
