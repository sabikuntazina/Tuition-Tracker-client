import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import {
  MONTH_NAMES,
  calculateExpectedClassesForMonth,
  getCurrentMonthAndYear
} from '../utils/dateUtils.js';

/**
 * Checks if a student has completed their scheduled classes for the month.
 * If yes and no notification exists yet for this month, creates a notification.
 */
export async function checkAndCreateMonthlyCompletionNotification(studentId, month, year) {
  try {
    const sId = studentId instanceof ObjectId ? studentId : new ObjectId(studentId);
    const studentsCol = getCollection('students');
    const classesCol = getCollection('classes');
    const notificationsCol = getCollection('notifications');

    const student = await studentsCol.findOne({ _id: sId });
    if (!student) return null;

    const expectedClasses = calculateExpectedClassesForMonth(student, month, year);
    if (expectedClasses === 0) return null;

    const monthStr = String(month).padStart(2, '0');
    const datePrefix = `${year}-${monthStr}`;

    const completedClasses = await classesCol.countDocuments({
      studentId: sId,
      date: { $regex: `^${datePrefix}` },
      status: 'completed'
    });

    if (completedClasses >= expectedClasses) {
      // Check if notification already exists
      const existing = await notificationsCol.findOne({
        studentId: sId,
        month,
        year
      });

      if (!existing) {
        const monthName = MONTH_NAMES[month - 1];
        const newNotification = {
          studentId: sId,
          studentName: student.name,
          month,
          year,
          title: `${student.name}'s ${monthName} Classes Completed`,
          message: `${student.name}'s ${monthName} classes are completed. You have taught ${completedClasses} out of ${expectedClasses} scheduled classes this month.`,
          completedClasses,
          expectedClasses,
          isRead: false,
          createdAt: new Date()
        };

        const result = await notificationsCol.insertOne(newNotification);
        console.log(`Monthly completion notification created for ${student.name} (${monthName} ${year})`);
        return { ...newNotification, _id: result.insertedId };
      }
    }

    return null;
  } catch (err) {
    if (err.code !== 11000) {
      console.error('Error checking monthly completion notification:', err.message);
    }
    return null;
  }
}

/**
 * Check all active students for monthly completion target
 */
export async function checkAllActiveStudentsForMonthlyCompletion(targetMonth, targetYear) {
  const { month: currMonth, year: currYear } = getCurrentMonthAndYear();
  const m = targetMonth || currMonth;
  const y = targetYear || currYear;

  const studentsCol = getCollection('students');
  const activeStudents = await studentsCol.find({ status: 'active' }).toArray();

  const generated = [];
  for (const student of activeStudents) {
    const notif = await checkAndCreateMonthlyCompletionNotification(student._id, m, y);
    if (notif) {
      generated.push(notif);
    }
  }

  return generated;
}
