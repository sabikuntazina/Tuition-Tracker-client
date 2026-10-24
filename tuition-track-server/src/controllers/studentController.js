import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import {
  generateInitialScheduleForStudent,
  syncScheduleOnStudentUpdate
} from '../services/scheduleService.js';
import { parseDateString } from '../utils/dateUtils.js';

export async function getAllStudents(req, res, next) {
  try {
    const { search, status } = req.query;
    const query = {};

    if (status && (status === 'active' || status === 'inactive')) {
      query.status = status;
    }

    if (search && search.trim()) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    const students = await getCollection('students')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const student = await getCollection('students').findOne({ _id: new ObjectId(id) });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req, res, next) {
  try {
    const {
      name,
      phone,
      address,
      monthlyFee,
      weeklyClasses,
      classDays,
      startDate,
      notes,
      status = 'active'
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Student name is required.' });
    }

    const feeNum = Number(monthlyFee);
    if (isNaN(feeNum) || feeNum < 0) {
      return res.status(400).json({ success: false, message: 'Monthly fee must be a non-negative number.' });
    }

    const weeklyClassesNum = parseInt(weeklyClasses, 10);
    if (isNaN(weeklyClassesNum) || weeklyClassesNum < 1 || weeklyClassesNum > 7) {
      return res.status(400).json({ success: false, message: 'Weekly classes must be a number between 1 and 7.' });
    }

    if (!Array.isArray(classDays) || classDays.length !== weeklyClassesNum) {
      return res.status(400).json({
        success: false,
        message: `Preferred class days count (${classDays?.length || 0}) must match weekly classes (${weeklyClassesNum}).`
      });
    }

    // Validate class day indexes (0-6)
    const validDays = classDays.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!validDays) {
      return res.status(400).json({
        success: false,
        message: 'Class days must be integers between 0 (Sunday) and 6 (Saturday).'
      });
    }

    if (!startDate || !parseDateString(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'A valid tuition start date (YYYY-MM-DD) is required.'
      });
    }

    const newStudent = {
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      monthlyFee: feeNum,
      weeklyClasses: weeklyClassesNum,
      classDays: [...new Set(classDays)].sort((a, b) => a - b),
      startDate: startDate.trim(),
      notes: notes ? notes.trim() : '',
      status: status === 'inactive' ? 'inactive' : 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getCollection('students').insertOne(newStudent);
    newStudent._id = result.insertedId;

    // Automatically generate scheduled classes in the calendar
    if (newStudent.status === 'active') {
      try {
        await generateInitialScheduleForStudent(newStudent);
      } catch (scheduleErr) {
        console.error('Error generating schedule for new student:', scheduleErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Student created and schedule generated successfully.',
      data: newStudent
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const {
      name,
      phone,
      address,
      monthlyFee,
      weeklyClasses,
      classDays,
      startDate,
      notes,
      status
    } = req.body;

    const studentCol = getCollection('students');
    const existing = await studentCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const updateFields = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Student name cannot be empty.' });
      }
      updateFields.name = name.trim();
    }

    if (phone !== undefined) updateFields.phone = phone ? phone.trim() : '';
    if (address !== undefined) updateFields.address = address ? address.trim() : '';
    if (notes !== undefined) updateFields.notes = notes ? notes.trim() : '';

    if (monthlyFee !== undefined) {
      const feeNum = Number(monthlyFee);
      if (isNaN(feeNum) || feeNum < 0) {
        return res.status(400).json({ success: false, message: 'Monthly fee must be a non-negative number.' });
      }
      updateFields.monthlyFee = feeNum;
    }

    let updatedWeeklyClasses = existing.weeklyClasses;
    if (weeklyClasses !== undefined) {
      const weeklyNum = parseInt(weeklyClasses, 10);
      if (isNaN(weeklyNum) || weeklyNum < 1 || weeklyNum > 7) {
        return res.status(400).json({ success: false, message: 'Weekly classes must be between 1 and 7.' });
      }
      updatedWeeklyClasses = weeklyNum;
      updateFields.weeklyClasses = weeklyNum;
    }

    if (classDays !== undefined) {
      if (!Array.isArray(classDays) || classDays.length !== updatedWeeklyClasses) {
        return res.status(400).json({
          success: false,
          message: `Preferred class days count (${classDays?.length || 0}) must match weekly classes (${updatedWeeklyClasses}).`
        });
      }
      const validDays = classDays.every(d => Number.isInteger(d) && d >= 0 && d <= 6);
      if (!validDays) {
        return res.status(400).json({
          success: false,
          message: 'Class days must be integers between 0 (Sunday) and 6 (Saturday).'
        });
      }
      updateFields.classDays = [...new Set(classDays)].sort((a, b) => a - b);
    }

    if (startDate !== undefined) {
      if (!parseDateString(startDate)) {
        return res.status(400).json({ success: false, message: 'Invalid start date format (YYYY-MM-DD).' });
      }
      updateFields.startDate = startDate.trim();
    }

    if (status !== undefined) {
      updateFields.status = status === 'inactive' ? 'inactive' : 'active';
    }

    await studentCol.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedStudent = await studentCol.findOne({ _id: new ObjectId(id) });

    // Sync future schedules if schedule parameters changed
    const scheduleChanged = (
      classDays !== undefined ||
      startDate !== undefined ||
      status !== undefined ||
      weeklyClasses !== undefined
    );

    if (scheduleChanged) {
      try {
        await syncScheduleOnStudentUpdate(updatedStudent);
      } catch (syncErr) {
        console.error('Error syncing student schedule:', syncErr);
      }
    }

    res.json({
      success: true,
      message: 'Student updated successfully.',
      data: updatedStudent
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const studentCol = getCollection('students');
    const classesCol = getCollection('classes');
    const paymentsCol = getCollection('payments');
    const notificationsCol = getCollection('notifications');

    const student = await studentCol.findOne({ _id: new ObjectId(id) });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Remove future uncompleted classes for clean database
    await classesCol.deleteMany({
      studentId: new ObjectId(id),
      status: 'scheduled'
    });

    // Delete student
    await studentCol.deleteOne({ _id: new ObjectId(id) });

    // Optionally cleanup student payments and notifications if requested or leave historical
    await notificationsCol.deleteMany({ studentId: new ObjectId(id) });

    res.json({
      success: true,
      message: `Student "${student.name}" and future scheduled classes deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}
