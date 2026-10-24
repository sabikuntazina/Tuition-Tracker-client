'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Printer,
  TrendingUp,
  User,
  Filter
} from 'lucide-react';
import { reportService } from '@/services/reportService';
import Toast from '@/components/ui/Toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [summaryData, setSummaryData] = useState({
    totals: {
      totalStudents: 0,
      completedStudentsCount: 0,
      totalExpectedTuition: 0,
      totalCollectedTuition: 0,
      totalOutstandingTuition: 0,
      totalExpectedClasses: 0,
      totalCompletedClasses: 0
    },
    students: []
  });

  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportService.getMonthlySummary({
        month: selectedMonth,
        year: selectedYear
      });
      if (res?.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load report data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = summaryData.students.filter((st) =>
    st.studentName.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const overallClassProgress = summaryData.totals.totalExpectedClasses > 0
    ? Math.min(100, Math.round((summaryData.totals.totalCompletedClasses / summaryData.totals.totalExpectedClasses) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Monthly Teaching & Revenue Reports</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Detailed breakdown of scheduled vs completed classes and tuition revenue for{' '}
            <span className="font-semibold text-blue-600">
              {MONTHS[selectedMonth - 1]} {selectedYear}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Month selector */}
          <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 mr-2 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {MONTHS.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-400 mr-2 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected Tuition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Expected Tuition</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            ৳{summaryData.totals.totalExpectedTuition.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            Based on {summaryData.totals.totalStudents} enrolled students
          </span>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Collected Tuition</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-emerald-700 block">
            ৳{summaryData.totals.totalCollectedTuition.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {summaryData.totals.totalExpectedTuition > 0
              ? `${Math.round((summaryData.totals.totalCollectedTuition / summaryData.totals.totalExpectedTuition) * 100)}% collected`
              : 'No tuition expected'}
          </span>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Outstanding Tuition</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-600 block">
            ৳{summaryData.totals.totalOutstandingTuition.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">Pending tuition payments</span>
        </div>

        {/* Class Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Teaching Progress</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">
            {summaryData.totals.totalCompletedClasses} / {summaryData.totals.totalExpectedClasses}
          </span>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${overallClassProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Breakdown Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Student-wise Performance Breakdown</h3>
            <p className="text-xs text-slate-500">
              Classes calculated using exact calendar days, matching weekdays, and join dates.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search student in report..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p>Generating monthly report...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No students found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Student</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Classes (Done / Target)</th>
                  <th className="py-3.5 px-4">Completion %</th>
                  <th className="py-3.5 px-4">Class Status</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Outstanding</th>
                  <th className="py-3.5 px-4 sm:px-6">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredStudents.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student */}
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                      <div>
                        <span>{st.studentName}</span>
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {st.weeklyClasses} classes/wk • Started {st.startDate}
                        </span>
                      </div>
                    </td>

                    {/* Monthly Fee */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      ৳{st.monthlyFee.toLocaleString()}
                    </td>

                    {/* Classes */}
                    <td className="py-4 px-4 font-bold text-slate-800">
                      <span>{st.completedClasses} / {st.expectedClasses}</span>
                      {st.remainingClasses > 0 && (
                        <span className="block text-[11px] text-slate-400 font-normal">
                          {st.remainingClasses} remaining
                        </span>
                      )}
                    </td>

                    {/* Progress Bar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              st.completionPercentage >= 100
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${st.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {st.completionPercentage}%
                        </span>
                      </div>
                    </td>

                    {/* Class Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          st.classStatus === 'Monthly Classes Completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {st.classStatus}
                      </span>
                    </td>

                    {/* Paid */}
                    <td className="py-4 px-4 font-semibold text-emerald-700">
                      ৳{st.paidAmount.toLocaleString()}
                    </td>

                    {/* Outstanding */}
                    <td className="py-4 px-4 font-semibold">
                      {st.outstandingAmount > 0 ? (
                        <span className="text-amber-600 font-bold">
                          ৳{st.outstandingAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">৳0</span>
                      )}
                    </td>

                    {/* Payment Status Badge */}
                    <td className="py-4 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          st.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : st.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {st.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
