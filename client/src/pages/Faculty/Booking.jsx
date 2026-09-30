import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Booking = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  
  const getDefaultTimes = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() + 1, 0, 0, 0);
    const end = new Date(now);
    end.setHours(now.getHours() + 2, 0, 0, 0);

    const formatTime = (d) => d.toTimeString().slice(0, 5);
    const formatDate = (d) => d.toISOString().slice(0, 10);
    
    return {
      date: formatDate(now),
      startTime: formatTime(start),
      endTime: formatTime(end)
    };
  };

  const defaultTimes = getDefaultTimes();

  const [formData, setFormData] = useState({
    room: '',
    department: 'BSc-IT',
    year: 'SY',
    subject: '',
    date: defaultTimes.date,
    startTime: defaultTimes.startTime,
    endTime: defaultTimes.endTime,
    status: 'Reserved'
  });
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
    
    axios.get(`${API_URL}/rooms`).then(res => {
      setRooms(res.data);
      const params = new URLSearchParams(window.location.search);
      const preselectedRoomId = params.get('roomId');
      if (preselectedRoomId && res.data.some(r => r._id === preselectedRoomId)) {
        setFormData(prev => ({ ...prev, room: preselectedRoomId }));
      } else if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, room: res.data[0]._id }));
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setBookingError('');
    try {
      const selectedDate = formData.date ? new Date(formData.date) : new Date();
      const [startHours, startMinutes] = formData.startTime.split(':');
      const [endHours, endMinutes] = formData.endTime.split(':');
      
      const start = new Date(selectedDate);
      start.setHours(Number(startHours), Number(startMinutes), 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(Number(endHours), Number(endMinutes), 0, 0);

      // Handle rollover if end time is before/equal start time
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }

      await axios.post(`${API_URL}/bookings`, {
        room: formData.room,
        department: formData.department,
        year: formData.year,
        subject: formData.subject,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: formData.status,
        faculty: user._id
      });

      navigate('/dashboard');
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Error reserving facility. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-amber-400" />
              <span className="text-sm font-bold tracking-tight">Faculty Room Reservation</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <CalendarPlus className="text-amber-500" size={24} /> Book Classroom
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Select room, target department and academic year, and schedule the session.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Conflict / Error Banner */}
            {bookingError && (
              <div className="rounded-xl bg-rose-950/10 border border-rose-300 p-4 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="font-medium">{bookingError}</span>
              </div>
            )}

            {/* Room selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room
              </label>
              <select 
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                required
              >
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    Room {r.roomNumber} (Floor {r.floor} • {r.type} • {r.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Department + Year Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Department
                </label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  required
                >
                  <option value="BSc-IT">BSc-IT</option>
                  <option value="BAF">BAF</option>
                  <option value="BMS">BMS</option>
                  <option value="BSc-CS">BSc-CS</option>
                  <option value="BFM">BFM</option>
                  <option value="General">General / All Departments</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Year
                </label>
                <select 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  required
                >
                  <option value="FY">FY (First Year)</option>
                  <option value="SY">SY (Second Year)</option>
                  <option value="TY">TY (Third Year)</option>
                  <option value="All">All Years</option>
                </select>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Subject
              </label>
              <input 
                type="text" 
                required
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                placeholder="e.g. MERN, Java, DBMS" 
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Date
              </label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
              />
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Start Time
                </label>
                <input 
                  type="time" 
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  End Time
                </label>
                <input 
                  type="time" 
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                />
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Targeting <strong>{formData.department} ({formData.year})</strong>: Only students enrolled in this department and year will receive the live notification and see this session in their schedule.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 px-4 py-3 text-sm font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Booking Room...' : 'BOOK ROOM'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Booking;
