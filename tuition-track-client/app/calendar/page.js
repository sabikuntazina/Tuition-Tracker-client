'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { classService } from '@/services/classService';
import { studentService } from '@/services/studentService';
import ClassDetailModal from '@/components/calendar/ClassDetailModal';
import ScheduleClassModal from '@/components/calendar/ScheduleClassModal';
import Toast from '@/components/ui/Toast';

export default function CalendarPage() {
  const calendarRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedClassEvent, setSelectedClassEvent] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Current calendar range
  const [currentRange, setCurrentRange] = useState({
    start: '',
    end: ''
  });

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

  const fetchClasses = useCallback(async (startStr, endStr) => {
    try {
      setLoading(true);
      const params = {};
      if (selectedStudentId !== 'all') {
        params.studentId = selectedStudentId;
      }
      if (startStr && endStr) {
        params.startDate = startStr.split('T')[0];
        params.endDate = endStr.split('T')[0];
      }

      const res = await classService.getClasses(params);
      if (res?.data) {
        setClasses(res.data);
      }
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch calendar classes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDatesSet = (dateInfo) => {
    setCurrentRange({
      start: dateInfo.startStr,
      end: dateInfo.endStr
    });
    fetchClasses(dateInfo.startStr, dateInfo.endStr);
  };

  useEffect(() => {
    if (currentRange.start && currentRange.end) {
      fetchClasses(currentRange.start, currentRange.end);
    }
  }, [fetchClasses, selectedStudentId, currentRange.start, currentRange.end]);

  // Format events for FullCalendar
  const todayStr = new Date().toISOString().split('T')[0];
  const events = classes.map((cls) => {
    let backgroundColor = '#2563EB'; // Blue for scheduled
    let borderColor = '#2563EB';

    if (cls.status === 'completed') {
      backgroundColor = '#16A34A'; // Green for completed
      borderColor = '#16A34A';
    } else if (cls.status === 'cancelled') {
      backgroundColor = '#DC2626'; // Red for cancelled/missed
      borderColor = '#DC2626';
    } else if (cls.date > todayStr) {
      backgroundColor = '#64748B'; // Gray for upcoming scheduled
      borderColor = '#64748B';
    }

    return {
      id: cls._id,
      title: `${cls.studentName || 'Student'} (${cls.status})`,
      start: cls.date,
      allDay: true,
      backgroundColor,
      borderColor,
      textColor: '#FFFFFF',
      extendedProps: cls
    };
  });

  const handleEventClick = (clickInfo) => {
    const rawClass = clickInfo.event.extendedProps;
    setSelectedClassEvent(rawClass);
    setDetailModalOpen(true);
  };

  const handleDateClick = (dateInfo) => {
    setClickedDate(dateInfo.dateStr);
    setScheduleModalOpen(true);
  };

  const handleRefresh = (msg) => {
    setToast({ message: msg, type: 'success' });
    if (currentRange.start && currentRange.end) {
      fetchClasses(currentRange.start, currentRange.end);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Interactive Calendar</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            View schedules, track attendance, and complete tutoring sessions in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Student Filter */}
          <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
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

          {/* Quick Schedule Button */}
          <button
            onClick={() => {
              setClickedDate(new Date().toISOString().split('T')[0]);
              setScheduleModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Session
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-xs font-medium text-slate-600">
        <span className="font-semibold text-slate-800">Color System:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
          <span>Scheduled Class</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#16A34A]" />
          <span>Completed Class</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#64748B]" />
          <span>Upcoming Future</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
          <span>Cancelled / Missed</span>
        </div>
        <div className="ml-auto text-[11px] text-slate-400 hidden md:block">
          Click any event to mark completed or edit • Click any date to add a class
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm relative">
        {loading && (
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Updating...</span>
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          height="auto"
          dayMaxEvents={3}
          editable={false}
          selectable={true}
        />
      </div>

      {/* Modals */}
      <ClassDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        classEvent={selectedClassEvent}
        onClassUpdated={handleRefresh}
        onClassDeleted={handleRefresh}
      />

      <ScheduleClassModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        initialDate={clickedDate}
        students={students}
        onClassCreated={handleRefresh}
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
