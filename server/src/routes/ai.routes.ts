import { Router } from 'express';
import { parseJobDescription } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Secure behind JWT auth
router.use(protect);

router.post('/parse-jd', parseJobDescription);

export default router;
