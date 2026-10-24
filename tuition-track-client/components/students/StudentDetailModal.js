'use client';

import { X, Calendar, Phone, MapPin, DollarSign, Clock, BookOpen, Edit2, Trash2 } from 'lucide-react';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentDetailModal({ isOpen, onClose, student, onEdit, onDelete }) {
  if (!isOpen || !student) return null;

  const classDayNames = Array.isArray(student.classDays)
    ? student.classDays.map((d) => WEEKDAYS[d]).join(', ')
    : 'None';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>{student.name}</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    student.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Student Profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 flex items-center mb-1">
                <DollarSign className="w-3.5 h-3.5 mr-1 text-blue-600" /> Monthly Tuition
              </span>
              <span className="text-base font-bold text-slate-900">
                ৳{Number(student.monthlyFee).toLocaleString()}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 flex items-center mb-1">
                <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" /> Weekly Frequency
              </span>
              <span className="text-base font-bold text-slate-900">
                {student.weeklyClasses} {student.weeklyClasses === 1 ? 'class' : 'classes'} / week
              </span>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 border-t border-slate-100 pt-4">
            <div className="flex items-start justify-between py-1">
              <span className="text-slate-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Preferred Days:
              </span>
              <span className="font-semibold text-slate-900 text-right">{classDayNames}</span>
            </div>

            <div className="flex items-start justify-between py-1">
              <span className="text-slate-500 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Start Date:
              </span>
              <span className="font-semibold text-slate-900">{student.startDate}</span>
            </div>

            {student.phone && (
              <div className="flex items-start justify-between py-1">
                <span className="text-slate-500 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" /> Phone:
                </span>
                <span className="font-semibold text-slate-900">{student.phone}</span>
              </div>
            )}

            {student.address && (
              <div className="flex items-start justify-between py-1">
                <span className="text-slate-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-slate-400" /> Address:
                </span>
                <span className="font-semibold text-slate-900">{student.address}</span>
              </div>
            )}

            {student.notes && (
              <div className="py-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Notes:</span>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {student.notes}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                onClose();
                onDelete(student);
              }}
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-xl hover:bg-rose-50 transition"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Student
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(student);
              }}
              className="inline-flex items-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-sm transition"
            >
              <Edit2 className="w-4 h-4 mr-1.5" />
              Edit Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
