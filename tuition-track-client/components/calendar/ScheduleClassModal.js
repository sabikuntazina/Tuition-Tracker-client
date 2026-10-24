'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { classService } from '@/services/classService';

export default function ScheduleClassModal({
  isOpen,
  onClose,
  initialDate,
  students = [],
  onClassCreated
}) {
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState('');
  const [scheduledAt, setScheduledAt] = useState('16:00');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
    }

    if (students.length > 0 && !studentId) {
      setStudentId(students[0]._id);
    }
    setError('');
    setStatus('scheduled');
    setNotes('');
  }, [initialDate, students, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setError('Please select a student.');
      return;
    }
    if (!date) {
      setError('Please provide a date.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await classService.createClass({
        studentId,
        date,
        scheduledAt,
        status,
        notes
      });
      if (onClassCreated) {
        const notifMsg = res.notification ? ` 🎉 ${res.notification.title}!` : '';
        onClassCreated(`Class created successfully!${notifMsg}`);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create class.');
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
            <h3 className="text-base font-bold text-slate-900">Add Class Session</h3>
            <p className="text-xs text-slate-500">
              Schedule or directly log a completed class session.
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

          {/* Student Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Student <span className="text-rose-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
            >
              {students.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.weeklyClasses} classes/wk)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Class Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time
              </label>
              <input
                type="time"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('scheduled')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  status === 'scheduled'
                    ? 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Mark Completed
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Chapter 4 review exercises"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition resize-none"
            />
          </div>

          {/* Footer Actions */}
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
              {submitting ? 'Saving...' : 'Save Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
