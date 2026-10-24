import { ObjectId } from 'mongodb';
import {
  getAllStudentsMonthlySummary,
  getStudentMonthlySummary
} from '../services/monthlySummaryService.js';
import { getCurrentMonthAndYear } from '../utils/dateUtils.js';

export async function getMonthlySummary(req, res, next) {
  try {
    const { month, year, status } = req.query;
    const current = getCurrentMonthAndYear();
    const m = month ? parseInt(month, 10) : current.month;
    const y = year ? parseInt(year, 10) : current.year;

    if (isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 2000) {
      return res.status(400).json({ success: false, message: 'Invalid month or year provided.' });
    }

    const summary = await getAllStudentsMonthlySummary(m, y, status);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

export async function getStudentMonthlySummaryRoute(req, res, next) {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    if (!ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    }

    const current = getCurrentMonthAndYear();
    const m = month ? parseInt(month, 10) : current.month;
    const y = year ? parseInt(year, 10) : current.year;

    const summary = await getStudentMonthlySummary(new ObjectId(studentId), m, y);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Student summary not found.' });
    }

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}
