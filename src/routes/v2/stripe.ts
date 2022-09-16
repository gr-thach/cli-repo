import { Router } from 'express';
import * as StripeController from '../../controllers/stripe';

const router = Router();

router.post('/', StripeController.webhook);

export default router;
