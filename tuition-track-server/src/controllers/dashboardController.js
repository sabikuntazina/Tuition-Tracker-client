import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import {
  getCurrentMonthAndYear,
  getTodayDateString
} from '../utils/dateUtils.js';
import { getAllStudentsMonthlySummary } from '../services/monthlySummaryService.js';

export async function getDashboardOverview(req, res, next) {
  try {
    const today = getTodayDateString();
    const { month, year } = getCurrentMonthAndYear();
    const monthPad = String(month).padStart(2, '0');
    const monthPrefix = `${year}-${monthPad}`;

    const studentsCol = getCollection('students');
    const classesCol = getCollection('classes');
    const paymentsCol = getCollection('payments');
    const notificationsCol = getCollection('notifications');

    // 1. Total Active Students
    const totalActiveStudents = await studentsCol.countDocuments({ status: 'active' });
    const totalStudents = await studentsCol.countDocuments();

    // 2. Today's classes
    const todayClasses = await classesCol
      .aggregate([
        { $match: { date: today } },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            studentId: 1,
            date: 1,
            status: 1,
            scheduledAt: 1,
            completedAt: 1,
            studentName: { $ifNull: ['$student.name', 'Unknown Student'] },
            studentPhone: { $ifNull: ['$student.phone', ''] },
            monthlyFee: { $ifNull: ['$student.monthlyFee', 0] }
          }
        },
        { $sort: { scheduledAt: 1, studentName: 1 } }
      ])
      .toArray();

    const todayScheduledClasses = todayClasses.filter(c => c.status === 'scheduled').length;
    const todayCompletedClasses = todayClasses.filter(c => c.status === 'completed').length;

    // 3. Monthly summaries
    const monthlySummary = await getAllStudentsMonthlySummary(month, year, 'active');

    // 4. Notifications
    const unreadNotificationsCount = await notificationsCol.countDocuments({ isRead: false });
    const latestNotifications = await notificationsCol
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // 5. Recent Activity
    // Fetch latest completed classes
    const recentCompletedClasses = await classesCol
      .aggregate([
        { $match: { status: 'completed' } },
        { $sort: { completedAt: -1, updatedAt: -1 } },
        { $limit: 4 },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: { $literal: 'class_completed' },
            title: { $concat: ['Completed class with ', { $ifNull: ['$student.name', 'Student'] }] },
            date: '$date',
            timestamp: { $ifNull: ['$completedAt', '$updatedAt'] },
            meta: { studentName: '$student.name', studentId: '$studentId' }
          }
        }
      ])
      .toArray();

    // Fetch latest payments
    const recentPayments = await paymentsCol
      .aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: { $literal: 'payment_recorded' },
            title: {
              $concat: [
                'Tuition payment received from ',
                { $ifNull: ['$student.name', 'Student'] },
                ' (৳',
                { $toString: '$paidAmount' },
                ')'
              ]
            },
            date: '$paymentDate',
            timestamp: '$createdAt',
            meta: { amount: '$paidAmount', status: '$paymentStatus' }
          }
        }
      ])
      .toArray();

    // Fetch latest student additions
    const recentStudents = await studentsCol
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .project({
        type: { $literal: 'student_added' },
        title: { $concat: ['New student enrolled: ', '$name'] },
        date: '$startDate',
        timestamp: '$createdAt',
        meta: { name: '$name', monthlyFee: '$monthlyFee' }
      })
      .toArray();

    // Combine and sort recent activities
    const activities = [...recentCompletedClasses, ...recentPayments, ...recentStudents]
      .sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date))
      .slice(0, 8);

    res.json({
      success: true,
      data: {
        currentMonth: month,
        currentYear: year,
        today,
        summaryCards: {
          totalActiveStudents,
          totalStudents,
          todayScheduledClasses,
          todayCompletedClasses,
          thisMonthCompletedClasses: monthlySummary.totals.totalCompletedClasses,
          thisMonthExpectedClasses: monthlySummary.totals.totalExpectedClasses,
          monthlyExpectedIncome: monthlySummary.totals.totalExpectedTuition,
          monthlyCollectedIncome: monthlySummary.totals.totalCollectedTuition,
          monthlyOutstandingIncome: monthlySummary.totals.totalOutstandingTuition,
          completedStudentsCount: monthlySummary.totals.completedStudentsCount
        },
        todayClasses,
        monthlyProgress: monthlySummary.students.slice(0, 6),
        recentActivity: activities,
        unreadNotificationsCount,
        latestNotifications
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardMonthlyProgress(req, res, next) {
  try {
    const { month, year } = getCurrentMonthAndYear();
    const summary = await getAllStudentsMonthlySummary(month, year, 'active');

    res.json({
      success: true,
      data: summary.students
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardUpcomingClasses(req, res, next) {
  try {
    const today = getTodayDateString();
    const classesCol = getCollection('classes');

    const upcoming = await classesCol
      .aggregate([
        {
          $match: {
            date: { $gte: today },
            status: 'scheduled'
          }
        },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            studentId: 1,
            date: 1,
            status: 1,
            scheduledAt: 1,
            studentName: { $ifNull: ['$student.name', 'Unknown Student'] },
            studentPhone: { $ifNull: ['$student.phone', ''] },
            monthlyFee: { $ifNull: ['$student.monthlyFee', 0] }
          }
        },
        { $sort: { date: 1, scheduledAt: 1 } },
        { $limit: 10 }
      ])
      .toArray();

    res.json({
      success: true,
      count: upcoming.length,
      data: upcoming
    });
  } catch (error) {
    next(error);
  }
}
