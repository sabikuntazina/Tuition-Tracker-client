'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Phone,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { studentService } from '@/services/studentService';
import StudentFormModal from '@/components/students/StudentFormModal';
import StudentDetailModal from '@/components/students/StudentDetailModal';
import Toast from '@/components/ui/Toast';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await studentService.getStudents({
        search,
        status: statusFilter
      });
      if (res?.data) {
        setStudents(res.data);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to load students.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (student) => {
    setViewingStudent(student);
    setDetailModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingStudent) {
      await studentService.updateStudent(editingStudent._id, formData);
      setToast({ message: `Student "${formData.name}" updated successfully.`, type: 'success' });
    } else {
      await studentService.createStudent(formData);
      setToast({
        message: `Student "${formData.name}" added and calendar schedule generated!`,
        type: 'success'
      });
    }
    fetchStudents();
  };

  const handleDelete = async (student) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${student.name}? Future scheduled classes will also be cleaned up.`
    );
    if (!confirmDelete) return;

    try {
      await studentService.deleteStudent(student._id);
      setToast({ message: `Student "${student.name}" deleted.`, type: 'info' });
      fetchStudents();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete student.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Student Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your tutoring students, weekly frequencies, class days, and fees.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline flex items-center">
            <Filter className="w-3.5 h-3.5 mr-1" /> Status:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-full sm:w-auto">
            {['all', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg capitalize transition-all ${
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
      </div>

      {/* Student List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Loading students...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No students found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {search || statusFilter !== 'all'
              ? 'No student matched your filter criteria. Try adjusting your search term.'
              : 'You have not added any students yet. Add your first student to automatically generate your calendar schedule!'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add First Student
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Student</th>
                  <th className="py-3.5 px-4">Monthly Fee</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Start Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {students.map((student) => {
                  const dayNames = Array.isArray(student.classDays)
                    ? student.classDays.map((d) => WEEKDAYS[d]).join(', ')
                    : '';

                  return (
                    <tr
                      key={student._id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(student)}
                    >
                      {/* Name & Phone */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block">
                              {student.name}
                            </span>
                            {student.phone ? (
                              <span className="text-xs text-slate-400 flex items-center mt-0.5">
                                <Phone className="w-3 h-3 mr-1 text-slate-400" />
                                {student.phone}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">No phone</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Monthly Fee */}
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        ৳{Number(student.monthlyFee).toLocaleString()}
                      </td>

                      {/* Schedule */}
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-800 text-xs block">
                          {student.weeklyClasses} {student.weeklyClasses === 1 ? 'class' : 'classes'} / wk
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {dayNames || 'None'}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        <span className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {student.startDate}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            student.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {student.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenDetail(student)}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Edit Student"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            title="Delete Student"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <StudentFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingStudent}
      />

      <StudentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        student={viewingStudent}
        onEdit={(st) => handleOpenEdit(st)}
        onDelete={(st) => handleDelete(st)}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
