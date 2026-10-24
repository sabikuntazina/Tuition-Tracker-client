'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Filter,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Edit2
} from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { studentService } from '@/services/studentService';
import PaymentModal from '@/components/payments/PaymentModal';
import Toast from '@/components/ui/Toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentsPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    totalExpected: 0,
    totalOutstanding: 0
  });
  const [loading, setLoading] = useState(true);

  // Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchStudents = async () => {
    try {
      const res = await studentService.getStudents({ status: 'active' });
      if (res?.data) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedMonth !== 'all') params.month = selectedMonth;
      if (selectedYear !== 'all') params.year = selectedYear;
      if (selectedStudentId !== 'all') params.studentId = selectedStudentId;
      if (statusFilter !== 'all') params.paymentStatus = statusFilter;

      const res = await paymentService.getPayments(params);
      if (res?.data) {
        setPayments(res.data);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load payments.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedStudentId, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleOpenAdd = () => {
    setEditingPayment(null);
    setPaymentModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingPayment(p);
    setPaymentModalOpen(true);
  };

  const handlePaymentSaved = (msg) => {
    setToast({ message: msg, type: 'success' });
    fetchPayments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Tuition Payments</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track monthly tuition income, record full/partial collections, and view pending dues.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition hover:shadow-lg active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Collected
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              ৳{metrics.totalCollected.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Expected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Expected
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              ৳{metrics.totalExpected.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Outstanding Due
            </span>
            <span className="text-2xl font-extrabold text-amber-600">
              ৳{metrics.totalOutstanding.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-400 mr-2 font-medium">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Months</option>
              {MONTHS.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-400 mr-2 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Years</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Student Filter */}
          <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-400 mr-2 font-medium">Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">All Students</option>
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          {['all', 'paid', 'partial', 'unpaid'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <CreditCard className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No payment records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            No payments match the selected criteria. Record a new tuition collection to track monthly revenue.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Record Payment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Student</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Amount Paid</th>
                  <th className="py-3.5 px-4">Remaining Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {payments.map((p) => {
                  const fee = Number(p.monthlyFee) || 0;
                  const paid = Number(p.paidAmount) || 0;
                  const due = Math.max(0, fee - paid);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student */}
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        {p.studentName || 'Student'}
                      </td>

                      {/* Period */}
                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        {MONTHS[(p.month || 1) - 1]} {p.year}
                      </td>

                      {/* Fee */}
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        ৳{fee.toLocaleString()}
                      </td>

                      {/* Paid */}
                      <td className="py-4 px-4 font-bold text-emerald-700">
                        ৳{paid.toLocaleString()}
                      </td>

                      {/* Remaining Due */}
                      <td className="py-4 px-4 font-semibold text-slate-600">
                        {due > 0 ? (
                          <span className="text-amber-600 font-bold">৳{due.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">৳0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            p.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.paymentStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </td>

                      {/* Date & Notes */}
                      <td className="py-4 px-4 text-xs text-slate-500">
                        <div className="flex flex-col">
                          <span>{p.paymentDate || 'N/A'}</span>
                          {p.notes && (
                            <span className="text-[11px] text-slate-400 italic line-clamp-1">
                              {p.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        initialData={editingPayment}
        students={students}
        currentMonth={selectedMonth !== 'all' ? selectedMonth : undefined}
        currentYear={selectedYear !== 'all' ? selectedYear : undefined}
        onPaymentSaved={handlePaymentSaved}
      />

      {/* Toast Alert */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
