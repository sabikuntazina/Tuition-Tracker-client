import { Router } from 'express';
import {
  getAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  triggerNotificationCheck
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', getAllNotifications);
router.patch('/read-all', markAllNotificationsAsRead);
router.post('/check', triggerNotificationCheck);
router.patch('/:id/read', markNotificationAsRead);
router.delete('/:id', deleteNotification);

export default router;
