import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import { checkAllActiveStudentsForMonthlyCompletion } from '../services/notificationService.js';
import { getCurrentMonthAndYear } from '../utils/dateUtils.js';

export async function getAllNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const query = {};
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notificationsCol = getCollection('notifications');
    const notifications = await notificationsCol
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = await notificationsCol.countDocuments({ isRead: false });

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const notificationsCol = getCollection('notifications');
    const result = await notificationsCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true, readAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsRead(req, res, next) {
  try {
    const notificationsCol = getCollection('notifications');
    await notificationsCol.updateMany(
      { isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID.' });
    }

    const notificationsCol = getCollection('notifications');
    const result = await notificationsCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerNotificationCheck(req, res, next) {
  try {
    const { month, year } = getCurrentMonthAndYear();
    const generated = await checkAllActiveStudentsForMonthlyCompletion(month, year);

    res.json({
      success: true,
      message: `Checked monthly completions. Generated ${generated.length} new notification(s).`,
      generated
    });
  } catch (error) {
    next(error);
  }
}
