'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';

export default function Navbar({ onMenuClick, unreadCount = 0, onNotificationUpdated }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Formatted current date string
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    setCurrentDateStr(now.toLocaleDateString('en-US', options));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDropdownNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res?.data) {
        setNotifications(res.data.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching notifications for dropdown:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    if (!dropdownOpen) {
      fetchDropdownNotifications();
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onNotificationUpdated) onNotificationUpdated();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-sm">
      {/* Left: Mobile hamburger & Today's Date */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{currentDateStr || 'Today'}</span>
        </div>
      </div>

      {/* Right: Notification bell & Quick links */}
      <div className="flex items-center space-x-3">
        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleDropdown}
            className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {loading ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 flex items-start justify-between space-x-3 ${
                        !notif.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <p className={`font-semibold text-slate-800 ${!notif.isRead ? 'text-blue-900' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          title="Mark as read"
                          className="p-1 text-slate-400 hover:text-blue-600 rounded"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 space-x-1"
                >
                  <span>View all notifications</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Badge / Profile (Single user personal workspace) */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-sm">
            T
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-800 leading-none">
              Tutor
            </span>
            <span className="text-[10px] text-slate-400">Personal Account</span>
          </div>
        </div>
      </div>
    </header>
  );
}
