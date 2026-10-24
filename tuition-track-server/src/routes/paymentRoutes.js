import { Router } from 'express';
import {
  getAllPayments,
  createOrUpdatePayment,
  getStudentPayments,
  updatePayment
} from '../controllers/paymentController.js';

const router = Router();

router.get('/', getAllPayments);
router.post('/', createOrUpdatePayment);
router.get('/student/:studentId', getStudentPayments);
router.patch('/:id', updatePayment);

export default router;
