import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import {
  getScheduledDatesForMonth,
  getCurrentMonthAndYear,
  getTodayDateString,
  parseDateString
} from '../utils/dateUtils.js';

/**
 * Ensures scheduled class records exist for a student for the given months.
 * Uses $setOnInsert so existing completed or cancelled classes are never overwritten.
 * 
 * @param {Object} student - student document with _id, startDate, classDays, etc.
 * @param {Array<{ month: number, year: number }>} monthYearList
 */
export async function generateClassesForStudent(student, monthYearList) {
  if (!student || student.status !== 'active') return [];

  const studentId = student._id instanceof ObjectId ? student._id : new ObjectId(student._id);
  const classesCollection = getCollection('classes');
  const insertedOrUpdated = [];

  for (const { month, year } of monthYearList) {
    const dates = getScheduledDatesForMonth(student, month, year);

    for (const dateStr of dates) {
      try {
        const result = await classesCollection.updateOne(
          {
            studentId,
            date: dateStr
          },
          {
            $setOnInsert: {
              studentId,
              date: dateStr,
              status: 'scheduled',
              scheduledAt: '16:00', // Default convenient afternoon class time if not specified
              completedAt: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          insertedOrUpdated.push(dateStr);
        }
      } catch (err) {
        // Unique index collision might trigger duplicate key warning, safe to ignore
        if (err.code !== 11000) {
          console.error(`Error generating class for student ${student.name} on ${dateStr}:`, err.message);
        }
      }
    }
  }

  return insertedOrUpdated;
}

/**
 * Generate schedule for current month + next 2 months for a student
 */
export async function generateInitialScheduleForStudent(student) {
  const { year, month } = getCurrentMonthAndYear();
  const monthList = [];

  // If student started before current month in the same year, include start month too
  if (student.startDate) {
    const startParsed = parseDateString(student.startDate);
    if (startParsed && (startParsed.year < year || (startParsed.year === year && startParsed.month < month))) {
      monthList.push({ month: startParsed.month, year: startParsed.year });
    }
  }

  // Current month
  monthList.push({ month, year });

  // Next 2 months
  let nextM = month;
  let nextY = year;
  for (let i = 0; i < 2; i++) {
    nextM++;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    monthList.push({ month: nextM, year: nextY });
  }

  return generateClassesForStudent(student, monthList);
}

/**
 * Sync classes when student schedule (classDays or startDate) changes.
 * Deletes future uncompleted scheduled classes that no longer match, and inserts new matching ones.
 */
export async function syncScheduleOnStudentUpdate(student) {
  if (!student) return;
  const studentId = student._id instanceof ObjectId ? student._id : new ObjectId(student._id);
  const classesCollection = getCollection('classes');
  const todayStr = getTodayDateString();

  if (student.status === 'inactive') {
    // Optionally remove future scheduled (not completed) classes
    await classesCollection.deleteMany({
      studentId,
      date: { $gte: todayStr },
      status: 'scheduled'
    });
    return;
  }

  // Remove future scheduled classes that do not match new classDays or are before startDate
  const futureScheduled = await classesCollection.find({
    studentId,
    date: { $gte: todayStr },
    status: 'scheduled'
  }).toArray();

  for (const cls of futureScheduled) {
    const parsed = parseDateString(cls.date);
    if (!parsed) continue;
    const d = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
    const dayOfWeek = d.getUTCDay();

    const isBeforeStart = student.startDate && cls.date < student.startDate;
    const isNotSelectedDay = !student.classDays.includes(dayOfWeek);

    if (isBeforeStart || isNotSelectedDay) {
      await classesCollection.deleteOne({ _id: cls._id });
    }
  }

  // Re-generate for current and next 2 months
  await generateInitialScheduleForStudent(student);
}
