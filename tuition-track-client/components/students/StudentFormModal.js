'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, BookOpen, AlertCircle } from 'lucide-react';

const WEEKDAYS = [
  { index: 0, label: 'Sunday', short: 'Sun' },
  { index: 1, label: 'Monday', short: 'Mon' },
  { index: 2, label: 'Tuesday', short: 'Tue' },
  { index: 3, label: 'Wednesday', short: 'Wed' },
  { index: 4, label: 'Thursday', short: 'Thu' },
  { index: 5, label: 'Friday', short: 'Fri' },
  { index: 6, label: 'Saturday', short: 'Sat' },
];

export default function StudentFormModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    monthlyFee: '',
    weeklyClasses: 2,
    classDays: [],
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'active'
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        monthlyFee: initialData.monthlyFee || '',
        weeklyClasses: initialData.weeklyClasses || 2,
        classDays: Array.isArray(initialData.classDays) ? initialData.classDays : [],
        startDate: initialData.startDate || new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        status: initialData.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        monthlyFee: '',
        weeklyClasses: 2,
        classDays: [],
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'active'
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleWeekdayToggle = (index) => {
    setFormData((prev) => {
      const exists = prev.classDays.includes(index);
      let updated;
      if (exists) {
        updated = prev.classDays.filter((d) => d !== index);
      } else {
        if (prev.classDays.length >= prev.weeklyClasses) {
          setError(`You have already selected ${prev.weeklyClasses} days for ${prev.weeklyClasses} weekly classes.`);
          return prev;
        }
        updated = [...prev.classDays, index].sort((a, b) => a - b);
      }
      setError('');
      return { ...prev, classDays: updated };
    });
  };

  const handleWeeklyClassesChange = (val) => {
    const count = parseInt(val, 10);
    setFormData((prev) => {
      // If new count is smaller, truncate classDays if needed
      const trimmedDays = prev.classDays.slice(0, count);
      return {
        ...prev,
        weeklyClasses: count,
        classDays: trimmedDays
      };
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Student name is required.');
      return;
    }

    if (!formData.monthlyFee || Number(formData.monthlyFee) < 0) {
      setError('Please provide a valid monthly fee (৳).');
      return;
    }

    if (formData.classDays.length !== formData.weeklyClasses) {
      setError(`Please select exactly ${formData.weeklyClasses} class days to match weekly classes.`);
      return;
    }

    if (!formData.startDate) {
      setError('Please provide a tuition start date.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        ...formData,
        monthlyFee: Number(formData.monthlyFee),
        weeklyClasses: Number(formData.weeklyClasses)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Student' : 'Add New Student'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update student details and weekly schedule.'
                : 'Enter student info to automatically generate calendar schedule.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="flex items-center p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahim Chowdhury"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="017XXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Address <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dhanmondi, Dhaka"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Monthly Fee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Tuition Fee (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">৳</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  placeholder="3000"
                  value={formData.monthlyFee}
                  onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                  className="w-full pl-8 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tuition Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              />
            </div>

            {/* Weekly Classes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classes Per Week <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.weeklyClasses}
                onChange={(e) => handleWeeklyClassesChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'class' : 'classes'} / week
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
              >
                <option value="active">Active (Currently Teaching)</option>
                <option value="inactive">Inactive (Paused / Stopped)</option>
              </select>
            </div>
          </div>

          {/* Preferred Class Days */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Preferred Class Days <span className="text-rose-500">*</span>
              </label>
              <span className={`text-xs font-medium ${
                formData.classDays.length === formData.weeklyClasses ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                Selected: {formData.classDays.length} / {formData.weeklyClasses} required
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-2">
              Select exactly {formData.weeklyClasses} weekdays matching the weekly frequency.
            </p>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((day) => {
                const isSelected = formData.classDays.includes(day.index);
                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => handleWeekdayToggle(day.index)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{day.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Notes / Subjects / Goals
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Class 10 Math & Physics syllabus, teaches at student's home."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Student' : 'Add Student & Generate Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
