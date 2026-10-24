'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { notificationService } from '@/services/notificationService';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications({ unreadOnly: true });
      if (typeof res?.unreadCount === 'number') {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    // Poll notifications every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCount={unreadCount}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
          onNotificationUpdated={fetchUnreadCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
