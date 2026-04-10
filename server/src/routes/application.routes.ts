import { Router } from 'express';
import { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication,
  updateStatusAndOrder,
  batchReorder,
  addActivity
} from '../controllers/application.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All application routes require authentication
router.use(protect);

router.route('/')
  .get(getApplications)
  .post(createApplication);

router.patch('/reorder', batchReorder);
router.patch('/:id/status', updateStatusAndOrder);
router.post('/:id/activities', addActivity);

router.route('/:id')
  .put(updateApplication)
  .delete(deleteApplication);

export default router;
