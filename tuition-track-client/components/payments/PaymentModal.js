'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, AlertCircle, Check } from 'lucide-react';
import { paymentService } from '@/services/paymentService';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PaymentModal({
  isOpen,
  onClose,
  initialData = null,
  students = [],
  currentMonth,
  currentYear,
  onPaymentSaved
}) {
  const [studentId, setStudentId] = useState('');
  const [month, setMonth] = useState(currentMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear || new Date().getFullYear());
  const [monthlyFee, setMonthlyFee] = useState(0);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setStudentId(initialData.studentId || (initialData.student?._id) || '');
      setMonth(initialData.month || currentMonth || new Date().getMonth() + 1);
      setYear(initialData.year || currentYear || new Date().getFullYear());
      setMonthlyFee(initialData.monthlyFee || 0);
      setPaidAmount(initialData.paidAmount !== undefined ? String(initialData.paidAmount) : '');
      setPaymentDate(initialData.paymentDate || new Date().toISOString().split('T')[0]);
      setNotes(initialData.notes || '');
    } else {
      if (students.length > 0) {
        const first = students[0];
        setStudentId(first._id);
        setMonthlyFee(first.monthlyFee || 0);
        setPaidAmount(String(first.monthlyFee || ''));
      }
      setMonth(currentMonth || new Date().getMonth() + 1);
      setYear(currentYear || new Date().getFullYear());
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError('');
  }, [initialData, students, currentMonth, currentYear, isOpen]);

  const handleStudentChange = (id) => {
    setStudentId(id);
    const selected = students.find((s) => s._id === id);
    if (selected) {
      setMonthlyFee(selected.monthlyFee || 0);
      if (!initialData) {
        setPaidAmount(String(selected.monthlyFee || ''));
      }
    }
  };

  const handleQuickFullPay = () => {
    setPaidAmount(String(monthlyFee));
  };

  if (!isOpen) return null;

  const paidNum = Number(paidAmount) || 0;
  const remaining = Math.max(0, monthlyFee - paidNum);
  const statusPreview = paidNum >= monthlyFee && monthlyFee > 0 ? 'paid' : paidNum > 0 ? 'partial' : 'unpaid';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await paymentService.createOrUpdatePayment({
        studentId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        monthlyFee: Number(monthlyFee),
        paidAmount: paidNum,
        paymentDate,
        notes
      });
      if (onPaymentSaved) onPaymentSaved('Payment recorded successfully.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save payment record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData ? 'Update Payment' : 'Record Tuition Payment'}
            </h3>
            <p className="text-xs text-slate-500">
              Track student monthly tuition collections and partial dues.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Student selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => handleStudentChange(e.target.value)}
              disabled={Boolean(initialData)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
            >
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} — ৳{Number(st.monthlyFee).toLocaleString()}/mo
                </option>
              ))}
            </select>
          </div>

          {/* Month & Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Month <span className="text-rose-500">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={Boolean(initialData)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              >
                {MONTHS.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Year <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={Boolean(initialData)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Monthly fee & Paid amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Fee (৳)
              </label>
              <input
                type="number"
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Paid Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleQuickFullPay}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-800"
                >
                  Full Fee
                </button>
              </div>
              <input
                type="number"
                min="0"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-semibold"
              />
            </div>
          </div>

          {/* Status calculation preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Status:</span>
              <span
                className={`font-bold capitalize ${
                  statusPreview === 'paid'
                    ? 'text-emerald-700'
                    : statusPreview === 'partial'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {statusPreview}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 block">Remaining Due:</span>
              <span className="font-bold text-slate-800">৳{remaining.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (e.g. bKash / Cash / Reference)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in cash via mother"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
