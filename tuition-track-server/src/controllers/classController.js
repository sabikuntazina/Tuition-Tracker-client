import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import { generateClassesForStudent } from '../services/scheduleService.js';
import { checkAndCreateMonthlyCompletionNotification } from '../services/notificationService.js';
import { parseDateString, getCurrentMonthAndYear } from '../utils/dateUtils.js';

export async function getAllClasses(req, res, next) {
  try {
    const { month, year, studentId, status, date, startDate, endDate } = req.query;
    const query = {};

    if (studentId) {
      if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID.' });
      }
      query.studentId = new ObjectId(studentId);
    }

    if (status && ['scheduled', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }

    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const monthPad = String(m).padStart(2, '0');
      query.date = { $regex: `^${y}-${monthPad}` };

      // Ensure active students have their schedules generated for this month
      const studentsCol = getCollection('students');
      const activeStudents = await studentsCol.find({ status: 'active' }).toArray();
      for (const st of activeStudents) {
        await generateClassesForStudent(st, [{ month: m, year: y }]);
      }
    }

    const classesCol = getCollection('classes');
    const classes = await classesCol
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $unwind: {
            path: '$student',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            studentId: 1,
            date: 1,
            status: 1,
            scheduledAt: 1,
            completedAt: 1,
            notes: 1,
            createdAt: 1,
            updatedAt: 1,
            studentName: { $ifNull: ['$student.name', 'Unknown Student'] },
            studentPhone: { $ifNull: ['$student.phone', ''] },
            monthlyFee: { $ifNull: ['$student.monthlyFee', 0] }
          }
        },
        { $sort: { date: 1, scheduledAt: 1 } }
      ])
      .toArray();

    res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    next(error);
  }
}

export async function getClassById(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    }

    const classesCol = getCollection('classes');
    const classDoc = await classesCol.findOne({ _id: new ObjectId(id) });
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const student = await getCollection('students').findOne({ _id: classDoc.studentId });

    res.json({
      success: true,
      data: {
        ...classDoc,
        studentName: student ? student.name : 'Unknown Student',
        studentPhone: student ? student.phone : ''
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createClass(req, res, next) {
  try {
    const { studentId, date, status = 'scheduled', scheduledAt = '16:00', notes = '' } = req.body;

    if (!studentId || !ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId is required.' });
    }

    if (!date || !parseDateString(date)) {
      return res.status(400).json({ success: false, message: 'A valid class date (YYYY-MM-DD) is required.' });
    }

    const student = await getCollection('students').findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student does not exist.' });
    }

    const classesCol = getCollection('classes');
    const existing = await classesCol.findOne({
      studentId: new ObjectId(studentId),
      date
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A class already exists for ${student.name} on ${date}.`
      });
    }

    const newClass = {
      studentId: new ObjectId(studentId),
      date,
      status: ['scheduled', 'completed', 'cancelled'].includes(status) ? status : 'scheduled',
      scheduledAt: scheduledAt || '16:00',
      completedAt: status === 'completed' ? new Date() : null,
      notes: notes ? notes.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await classesCol.insertOne(newClass);
    newClass._id = result.insertedId;

    // If marked as completed, check monthly completion target
    if (newClass.status === 'completed') {
      const parsed = parseDateString(date);
      if (parsed) {
        await checkAndCreateMonthlyCompletionNotification(studentId, parsed.month, parsed.year);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: {
        ...newClass,
        studentName: student.name
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClass(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    }

    const { date, status, scheduledAt, notes } = req.body;
    const classesCol = getCollection('classes');

    const existing = await classesCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const updates = { updatedAt: new Date() };

    if (date !== undefined) {
      if (!parseDateString(date)) {
        return res.status(400).json({ success: false, message: 'Invalid date format (YYYY-MM-DD).' });
      }

      // Check duplicate if date is changed
      if (date !== existing.date) {
        const conflict = await classesCol.findOne({
          studentId: existing.studentId,
          date,
          _id: { $ne: new ObjectId(id) }
        });
        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `A class already exists for this student on ${date}.`
          });
        }
      }
      updates.date = date;
    }

    if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt;
    if (notes !== undefined) updates.notes = notes.trim();

    if (status !== undefined) {
      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid class status.' });
      }
      updates.status = status;
      if (status === 'completed' && !existing.completedAt) {
        updates.completedAt = new Date();
      } else if (status !== 'completed') {
        updates.completedAt = null;
      }
    }

    await classesCol.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await classesCol.findOne({ _id: new ObjectId(id) });

    if (updates.status === 'completed') {
      const parsed = parseDateString(updated.date);
      if (parsed) {
        await checkAndCreateMonthlyCompletionNotification(updated.studentId, parsed.month, parsed.year);
      }
    }

    res.json({
      success: true,
      message: 'Class updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function markClassCompleted(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    }

    const classesCol = getCollection('classes');
    const existing = await classesCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const completedAt = new Date();
    await classesCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'completed',
          completedAt,
          updatedAt: completedAt
        }
      }
    );

    const updated = await classesCol.findOne({ _id: new ObjectId(id) });

    // Check monthly completion target for notification
    const parsed = parseDateString(updated.date);
    let notificationCreated = null;
    if (parsed) {
      notificationCreated = await checkAndCreateMonthlyCompletionNotification(
        updated.studentId,
        parsed.month,
        parsed.year
      );
    }

    res.json({
      success: true,
      message: 'Class marked as completed.',
      data: updated,
      notification: notificationCreated
    });
  } catch (error) {
    next(error);
  }
}

export async function markClassCancelled(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    }

    const classesCol = getCollection('classes');
    const existing = await classesCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const now = new Date();
    await classesCol.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: now,
          updatedAt: now
        }
      }
    );

    const updated = await classesCol.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Class marked as cancelled.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteClass(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    }

    const classesCol = getCollection('classes');
    const result = await classesCol.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
