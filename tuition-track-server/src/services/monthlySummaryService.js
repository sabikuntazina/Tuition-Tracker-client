import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import {
  calculateExpectedClassesForMonth,
  getScheduledDatesForMonth,
  getCurrentMonthAndYear
} from '../utils/dateUtils.js';

/**
 * Calculates monthly summary for a single student for a given month and year.
 */
export async function getStudentMonthlySummary(student, month, year) {
  const studentsCol = getCollection('students');
  const classesCol = getCollection('classes');
  const paymentsCol = getCollection('payments');

  let studentDoc = student;
  if (typeof student === 'string' || student instanceof ObjectId) {
    studentDoc = await studentsCol.findOne({
      _id: student instanceof ObjectId ? student : new ObjectId(student)
    });
  }

  if (!studentDoc) return null;

  const sId = studentDoc._id instanceof ObjectId ? studentDoc._id : new ObjectId(studentDoc._id);
  const expectedClasses = calculateExpectedClassesForMonth(studentDoc, month, year);
  const scheduledDates = getScheduledDatesForMonth(studentDoc, month, year);

  const monthStr = String(month).padStart(2, '0');
  const datePrefix = `${year}-${monthStr}`;

  // Count completed classes in this month
  const completedClasses = await classesCol.countDocuments({
    studentId: sId,
    date: { $regex: `^${datePrefix}` },
    status: 'completed'
  });

  // Count cancelled classes in this month
  const cancelledClasses = await classesCol.countDocuments({
    studentId: sId,
    date: { $regex: `^${datePrefix}` },
    status: 'cancelled'
  });

  const remainingClasses = Math.max(0, expectedClasses - completedClasses);
  const completionPercentage = expectedClasses > 0
    ? Math.min(100, Math.round((completedClasses / expectedClasses) * 100))
    : 0;

  const classStatus = (completedClasses >= expectedClasses && expectedClasses > 0)
    ? 'Monthly Classes Completed'
    : (completedClasses > 0 ? 'In Progress' : 'Not Started');

  // Check payment for this month & year
  const payment = await paymentsCol.findOne({
    studentId: sId,
    month,
    year
  });

  const monthlyFee = Number(studentDoc.monthlyFee) || 0;
  const paidAmount = payment ? Number(payment.paidAmount) || 0 : 0;
  const outstandingAmount = Math.max(0, monthlyFee - paidAmount);

  let paymentStatus = 'unpaid';
  if (payment) {
    paymentStatus = payment.paymentStatus || (paidAmount >= monthlyFee ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));
  } else if (paidAmount >= monthlyFee && monthlyFee > 0) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  }

  return {
    studentId: sId,
    studentName: studentDoc.name,
    phone: studentDoc.phone || '',
    status: studentDoc.status,
    startDate: studentDoc.startDate,
    weeklyClasses: studentDoc.weeklyClasses,
    classDays: studentDoc.classDays,
    month,
    year,
    monthlyFee,
    expectedClasses,
    completedClasses,
    cancelledClasses,
    remainingClasses,
    completionPercentage,
    classStatus,
    paidAmount,
    outstandingAmount,
    paymentStatus,
    paymentDate: payment ? payment.paymentDate : null,
    paymentId: payment ? payment._id : null,
    paymentNotes: payment ? payment.notes : '',
    scheduledDates
  };
}

/**
 * Calculates monthly summary for all students (or filtered) for a given month and year.
 */
export async function getAllStudentsMonthlySummary(month, year, statusFilter = null) {
  const studentsCol = getCollection('students');
  const query = {};
  if (statusFilter) {
    query.status = statusFilter;
  }

  const students = await studentsCol.find(query).sort({ name: 1 }).toArray();

  const studentSummaries = [];
  let totalExpectedTuition = 0;
  let totalCollectedTuition = 0;
  let totalOutstandingTuition = 0;
  let totalExpectedClasses = 0;
  let totalCompletedClasses = 0;
  let completedStudentsCount = 0;

  for (const student of students) {
    const summary = await getStudentMonthlySummary(student, month, year);
    if (summary) {
      studentSummaries.push(summary);

      // Only add to monthly expected tuition if student started on or before this month
      totalExpectedTuition += summary.monthlyFee;
      totalCollectedTuition += summary.paidAmount;
      totalOutstandingTuition += summary.outstandingAmount;
      totalExpectedClasses += summary.expectedClasses;
      totalCompletedClasses += summary.completedClasses;

      if (summary.classStatus === 'Monthly Classes Completed') {
        completedStudentsCount++;
      }
    }
  }

  return {
    month,
    year,
    totals: {
      totalStudents: students.length,
      completedStudentsCount,
      totalExpectedTuition,
      totalCollectedTuition,
      totalOutstandingTuition,
      totalExpectedClasses,
      totalCompletedClasses
    },
    students: studentSummaries
  };
}
