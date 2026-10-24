'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Trash2,
  CheckCheck,
  RefreshCw,
  Sparkles,
  Calendar,
  Clock
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import Toast from '@/components/ui/Toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ unreadOnly });
      if (res?.data) {
        setNotifications(res.data);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load notifications.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      setToast({ message: err.message || 'Failed to update notification.', type: 'error' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setToast({ message: 'All notifications marked as read.', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to update notifications.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setToast({ message: 'Notification removed.', type: 'info' });
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete notification.', type: 'error' });
    }
  };

  const handleTriggerCheck = async () => {
    try {
      setChecking(true);
      const res = await notificationService.triggerCheck();
      setToast({
        message: res.message || 'Checked active students for completions.',
        type: 'success'
      });
      fetchNotifications();
    } catch (err) {
      setToast({ message: err.message || 'Failed to check completions.', type: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Notifications</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automatic monthly target completion milestones and teaching alerts.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleTriggerCheck}
            disabled={checking}
            className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${checking ? 'animate-spin text-blue-600' : ''}`} />
            {checking ? 'Checking...' : 'Run Completion Check'}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              !unreadOnly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              unreadOnly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Unread Only {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {unreadOnly
              ? 'You have caught up with all notifications.'
              : 'When students complete their monthly scheduled class goals, celebratory notifications will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex items-start justify-between space-x-4 ${
                !notif.isRead
                  ? 'bg-blue-50/60 border-blue-200 shadow-sm'
                  : 'bg-white border-slate-200/80'
              }`}
            >
              <div className="flex items-start space-x-3.5 flex-1">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    !notif.isRead
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4
                      className={`text-sm font-bold ${
                        !notif.isRead ? 'text-blue-950' : 'text-slate-800'
                      }`}
                    >
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    {notif.message}
                  </p>

                  <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(notif.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-600">
                      Target Reached ({notif.completedClasses}/{notif.expectedClasses})
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif._id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDelete(notif._id)}
                  title="Delete notification"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
