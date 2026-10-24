import { Router } from 'express';
import {
  getMonthlySummary,
  getStudentMonthlySummaryRoute
} from '../controllers/monthlySummaryController.js';

const router = Router();

router.get('/', getMonthlySummary);
router.get('/student/:studentId', getStudentMonthlySummaryRoute);

export default router;
