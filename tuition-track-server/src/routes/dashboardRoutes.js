import { Router } from 'express';
import {
  getDashboardOverview,
  getDashboardMonthlyProgress,
  getDashboardUpcomingClasses
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/', getDashboardOverview);
router.get('/monthly-progress', getDashboardMonthlyProgress);
router.get('/upcoming-classes', getDashboardUpcomingClasses);

export default router;
