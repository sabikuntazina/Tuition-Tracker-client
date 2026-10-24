'use client';

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  XCircle,
  Trash2,
  Edit2,
  AlertCircle
} from 'lucide-react';
import { classService } from '@/services/classService';

export default function ClassDetailModal({
  isOpen,
  onClose,
  classEvent,
  onClassUpdated,
  onClassDeleted
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen || !classEvent) return null;

  const {
    _id,
    studentName,
    date,
    scheduledAt,
    completedAt,
    status,
    notes
  } = classEvent;

  const handleStartEdit = () => {
    setEditDate(date);
    setEditTime(scheduledAt || '16:00');
    setEditNotes(notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await classService.updateClass(_id, {
        date: editDate,
        scheduledAt: editTime,
        notes: editNotes
      });
      setIsEditing(false);
      if (onClassUpdated) onClassUpdated('Class details updated.');
    } catch (err) {
      setError(err.message || 'Failed to update class.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await classService.markClassCompleted(_id);
      if (onClassUpdated) {
        const notifMsg = res.notification ? ` 🎉 ${res.notification.title}!` : '';
        onClassUpdated(`Class marked as completed!${notifMsg}`);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark class as completed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCancelled = async () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this scheduled class?');
    if (!confirmCancel) return;

    try {
      setLoading(true);
      setError('');
      await classService.markClassCancelled(_id);
      if (onClassUpdated) onClassUpdated('Class marked as cancelled.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel class.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to completely remove this class record?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError('');
      await classService.deleteClass(_id);
      if (onClassDeleted) onClassDeleted('Class record deleted.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                status === 'completed'
                  ? 'bg-emerald-500'
                  : status === 'cancelled'
                  ? 'bg-rose-500'
                  : 'bg-blue-600'
              }`}
            />
            <h3 className="text-base font-bold text-slate-900">Class Details</h3>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Date
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Time
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Topics covered, homework assigned, etc."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Student info */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{studentName}</h4>
                    <span className="text-xs text-slate-500">Student</span>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                    status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Date & Time info */}
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center text-slate-500">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Date:
                  </span>
                  <span className="font-semibold text-slate-800">{date}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center text-slate-500">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" /> Scheduled Time:
                  </span>
                  <span className="font-semibold text-slate-800">{scheduledAt || '16:00'}</span>
                </div>

                {completedAt && (
                  <div className="flex items-center justify-between py-1 text-emerald-700">
                    <span className="flex items-center font-medium">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Completed At:
                    </span>
                    <span className="font-semibold text-emerald-800">
                      {new Date(completedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {notes && (
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Notes:</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                {status !== 'completed' && (
                  <button
                    onClick={handleMarkCompleted}
                    disabled={loading}
                    className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {loading ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleStartEdit}
                      disabled={loading}
                      className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>

                    {status === 'scheduled' && (
                      <button
                        onClick={handleMarkCancelled}
                        disabled={loading}
                        className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Class
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    title="Delete Class Record"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
