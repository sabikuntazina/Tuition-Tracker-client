import { ObjectId } from 'mongodb';
import { getCollection } from '../config/db.js';
import { getCurrentMonthAndYear, parseDateString, getTodayDateString } from '../utils/dateUtils.js';

export async function getAllPayments(req, res, next) {
  try {
    const { month, year, studentId, paymentStatus } = req.query;
    const query = {};

    if (month) query.month = parseInt(month, 10);
    if (year) query.year = parseInt(year, 10);
    if (paymentStatus && ['paid', 'partial', 'unpaid'].includes(paymentStatus)) {
      query.paymentStatus = paymentStatus;
    }
    if (studentId) {
      if (!ObjectId.isValid(studentId)) {
        return res.status(400).json({ success: false, message: 'Invalid student ID.' });
      }
      query.studentId = new ObjectId(studentId);
    }

    const paymentsCol = getCollection('payments');
    const payments = await paymentsCol
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
            month: 1,
            year: 1,
            monthlyFee: 1,
            paidAmount: 1,
            paymentDate: 1,
            paymentStatus: 1,
            notes: 1,
            createdAt: 1,
            updatedAt: 1,
            studentName: { $ifNull: ['$student.name', 'Unknown Student'] },
            studentPhone: { $ifNull: ['$student.phone', ''] }
          }
        },
        { $sort: { year: -1, month: -1, paymentDate: -1 } }
      ])
      .toArray();

    // Calculate aggregated metrics
    const totalCollected = payments.reduce((acc, p) => acc + (Number(p.paidAmount) || 0), 0);
    const totalExpected = payments.reduce((acc, p) => acc + (Number(p.monthlyFee) || 0), 0);

    res.json({
      success: true,
      count: payments.length,
      metrics: {
        totalCollected,
        totalExpected,
        totalOutstanding: Math.max(0, totalExpected - totalCollected)
      },
      data: payments
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrUpdatePayment(req, res, next) {
  try {
    const {
      studentId,
      month,
      year,
      paidAmount,
      monthlyFee,
      paymentDate = getTodayDateString(),
      notes = '',
      paymentStatus: explicitStatus
    } = req.body;

    if (!studentId || !ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'A valid studentId is required.' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 2000) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year are required.' });
    }

    const student = await getCollection('students').findOne({ _id: new ObjectId(studentId) });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const fee = monthlyFee !== undefined ? Number(monthlyFee) : Number(student.monthlyFee);
    const paid = Number(paidAmount) || 0;

    let computedStatus = 'unpaid';
    if (paid >= fee && fee > 0) {
      computedStatus = 'paid';
    } else if (paid > 0) {
      computedStatus = 'partial';
    }

    const finalStatus = explicitStatus && ['paid', 'partial', 'unpaid'].includes(explicitStatus)
      ? explicitStatus
      : computedStatus;

    const paymentsCol = getCollection('payments');

    // Find if payment record exists for this student, month, year
    const existing = await paymentsCol.findOne({
      studentId: new ObjectId(studentId),
      month: m,
      year: y
    });

    const now = new Date();
    let paymentDoc;

    if (existing) {
      await paymentsCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            monthlyFee: fee,
            paidAmount: paid,
            paymentDate,
            paymentStatus: finalStatus,
            notes: notes ? notes.trim() : existing.notes,
            updatedAt: now
          }
        }
      );
      paymentDoc = await paymentsCol.findOne({ _id: existing._id });
    } else {
      const newPayment = {
        studentId: new ObjectId(studentId),
        month: m,
        year: y,
        monthlyFee: fee,
        paidAmount: paid,
        paymentDate,
        paymentStatus: finalStatus,
        notes: notes ? notes.trim() : '',
        createdAt: now,
        updatedAt: now
      };
      const result = await paymentsCol.insertOne(newPayment);
      paymentDoc = { ...newPayment, _id: result.insertedId };
    }

    res.json({
      success: true,
      message: 'Payment record saved successfully.',
      data: {
        ...paymentDoc,
        studentName: student.name
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentPayments(req, res, next) {
  try {
    const { studentId } = req.params;
    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const paymentsCol = getCollection('payments');
    const payments = await paymentsCol
      .find({ studentId: new ObjectId(studentId) })
      .sort({ year: -1, month: -1 })
      .toArray();

    const student = await getCollection('students').findOne({ _id: new ObjectId(studentId) });

    res.json({
      success: true,
      studentName: student ? student.name : 'Unknown Student',
      monthlyFee: student ? student.monthlyFee : 0,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID.' });
    }

    const { paidAmount, monthlyFee, paymentDate, notes, paymentStatus } = req.body;
    const paymentsCol = getCollection('payments');

    const existing = await paymentsCol.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const updates = { updatedAt: new Date() };
    if (paidAmount !== undefined) updates.paidAmount = Number(paidAmount);
    if (monthlyFee !== undefined) updates.monthlyFee = Number(monthlyFee);
    if (paymentDate !== undefined) updates.paymentDate = paymentDate;
    if (notes !== undefined) updates.notes = notes.trim();

    const fee = updates.monthlyFee !== undefined ? updates.monthlyFee : existing.monthlyFee;
    const paid = updates.paidAmount !== undefined ? updates.paidAmount : existing.paidAmount;

    if (paymentStatus && ['paid', 'partial', 'unpaid'].includes(paymentStatus)) {
      updates.paymentStatus = paymentStatus;
    } else {
      if (paid >= fee && fee > 0) {
        updates.paymentStatus = 'paid';
      } else if (paid > 0) {
        updates.paymentStatus = 'partial';
      } else {
        updates.paymentStatus = 'unpaid';
      }
    }

    await paymentsCol.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await paymentsCol.findOne({ _id: new ObjectId(id) });

    res.json({
      success: true,
      message: 'Payment updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}
