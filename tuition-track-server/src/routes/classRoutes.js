import { Router } from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  markClassCompleted,
  markClassCancelled,
  deleteClass
} from '../controllers/classController.js';

const router = Router();

router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.post('/', createClass);
router.put('/:id', updateClass);
router.patch('/:id/complete', markClassCompleted);
router.patch('/:id/cancel', markClassCancelled);
router.delete('/:id', deleteClass);

export default router;
