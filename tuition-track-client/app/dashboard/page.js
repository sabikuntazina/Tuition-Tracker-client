'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  ArrowRight,
  Plus,
  Calendar,
  Sparkles,
  Phone,
  CreditCard
} from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { classService } from '@/services/classService';
import Toast from '@/components/ui/Toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, upcomingRes] = await Promise.all([
        dashboardService.getDashboardOverview(),
        dashboardService.getUpcomingClasses()
      ]);

      if (overviewRes?.data) {
        setData(overviewRes.data);
      }
      if (upcomingRes?.data) {
        setUpcomingClasses(upcomingRes.data);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load dashboard data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleMarkClassCompleted = async (classId) => {
    try {
      setActionLoadingId(classId);
      const res = await classService.markClassCompleted(classId);
      const celebration = res.notification ? ` 🎉 ${res.notification.title}!` : '';
      setToast({
        message: `Class marked as completed!${celebration}`,
        type: 'success'
      });
      fetchDashboardData();
    } catch (err) {
      setToast({ message: err.message || 'Failed to complete class.', type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading TuitionTrack dashboard...</p>
      </div>
    );
  }

  const cards = data?.summaryCards || {};
  const currentMonthName = data?.currentMonth ? MONTH_NAMES[data.currentMonth - 1] : '';

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-slate-950/10">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tutor Productivity Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to TuitionTrack
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            You have{' '}
            <span className="font-bold text-white">
              {cards.todayScheduledClasses || 0} scheduled classes today
            </span>{' '}
            and{' '}
            <span className="font-bold text-white">
              {cards.totalActiveStudents || 0} active students
            </span>{' '}
            for {currentMonthName} {data?.currentYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/calendar"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition border border-white/15"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Open Calendar
          </Link>
          <Link
            href="/students"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Unread Notification Alert if present */}
      {data?.unreadNotificationsCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-blue-950">
                You have {data.unreadNotificationsCount} monthly completion milestone notification(s)!
              </p>
              <p className="text-[11px] text-blue-700">
                Students have reached their monthly class quota. Review details in Notifications.
              </p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 7 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Active Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            {cards.totalActiveStudents || 0}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {cards.totalStudents || 0} total enrolled
          </span>
        </div>

        {/* Card 2: Today's Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Today's Classes
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-slate-900">
              {cards.todayCompletedClasses || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {(cards.todayScheduledClasses || 0) + (cards.todayCompletedClasses || 0)} done
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {cards.todayScheduledClasses || 0} remaining today
          </span>
        </div>

        {/* Card 3: This Month's Classes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              This Month Classes
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-emerald-700">
              {cards.thisMonthCompletedClasses || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {cards.thisMonthExpectedClasses || 0} target
            </span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">
            {currentMonthName} progress
          </span>
        </div>

        {/* Card 4: Monthly Tuition Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tuition Income
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            ৳{(cards.monthlyCollectedIncome || 0).toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            ৳{(cards.monthlyExpectedIncome || 0).toLocaleString()} expected
          </span>
        </div>
      </div>

      {/* Main Grid: Today's Classes & Monthly Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Today's Classes & Upcoming Classes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Today's Classes</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  {data?.todayClasses?.length || 0} sessions
                </span>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Full Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {!data?.todayClasses || data.todayClasses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No classes scheduled for today. Take a break or check your upcoming schedule!
                </div>
              ) : (
                data.todayClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {cls.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{cls.studentName}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {cls.scheduledAt || '16:00'}
                          </span>
                          <span>•</span>
                          <span>৳{Number(cls.monthlyFee).toLocaleString()}/mo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                          cls.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cls.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {cls.status}
                      </span>

                      {cls.status === 'scheduled' && (
                        <button
                          onClick={() => handleMarkClassCompleted(cls._id)}
                          disabled={actionLoadingId === cls._id}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                        >
                          {actionLoadingId === cls._id ? 'Updating...' : 'Mark Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Upcoming Scheduled Classes</h3>
              </div>
              <span className="text-xs text-slate-400">Next scheduled sessions</span>
            </div>

            <div className="divide-y divide-slate-100">
              {upcomingClasses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No upcoming scheduled classes found.
                </div>
              ) : (
                upcomingClasses.slice(0, 6).map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 sm:px-5 flex items-center justify-between text-xs hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center">
                        {item.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-sm">
                          {item.studentName}
                        </span>
                        <span className="text-slate-400">{item.date} at {item.scheduledAt || '16:00'}</span>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                      Scheduled
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Student Monthly Progress & Recent Activities */}
        <div className="space-y-6">
          {/* Student Monthly Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Monthly Progress</h3>
              </div>
              <Link
                href="/reports"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                All Reports
              </Link>
            </div>

            <div className="p-5 space-y-4">
              {!data?.monthlyProgress || data.monthlyProgress.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No student progress records for this month.
                </div>
              ) : (
                data.monthlyProgress.map((student) => {
                  const isDone = student.classStatus === 'Monthly Classes Completed';

                  return (
                    <div key={student.studentId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{student.studentName}</span>
                        <span className="font-semibold text-slate-600">
                          ৳{student.monthlyFee.toLocaleString()}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {student.completedClasses} / {student.expectedClasses} classes completed
                        </span>
                        {isDone ? (
                          <span className="text-emerald-600 font-bold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            {student.remainingClasses} remaining
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${student.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Recent Activities</h3>
              <p className="text-xs text-slate-400">Latest class completions, payments, and enrollees</p>
            </div>

            <div className="p-4 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {!data?.recentActivity || data.recentActivity.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No recent activities recorded.
                </div>
              ) : (
                data.recentActivity.map((act, idx) => (
                  <div key={idx} className="py-2.5 text-xs flex items-start space-x-3">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">{act.title}</p>
                      <span className="text-[10px] text-slate-400">{act.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
