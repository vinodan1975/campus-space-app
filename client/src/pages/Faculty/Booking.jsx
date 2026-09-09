import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Booking = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const getDefaultTimes = () => {
    const now = new Date();
    // Default start time is next hour
    const start = new Date(now);
    start.setHours(now.getHours() + 1, 0, 0, 0);
    // Default end time is 2 hours from now
    const end = new Date(now);
    end.setHours(now.getHours() + 2, 0, 0, 0);

    const formatTime = (d) => d.toTimeString().slice(0, 5); // "HH:MM"
    
    return {
      startTime: formatTime(start),
      endTime: formatTime(end)
    };
  };

  const defaultTimes = getDefaultTimes();

  const [formData, setFormData] = useState({
    room: '',
    subject: '',
    startTime: defaultTimes.startTime,
    endTime: defaultTimes.endTime,
    status: 'Reserved'
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
    
    // Fetch rooms to populate dropdown
    axios.get(`${API_URL}/rooms`).then(res => {
      // Only show available rooms or all rooms
      setRooms(res.data);
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, room: res.data[0]._id }));
      }
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create date objects for today
      const today = new Date();
      const [startHours, startMinutes] = formData.startTime.split(':');
      const [endHours, endMinutes] = formData.endTime.split(':');
      
      // Parse start time
      const start = new Date(today);
      start.setHours(startHours, startMinutes, 0, 0);
      
      // If the selected start time has already passed today, assume it's for tomorrow
      if (start < today) {
        start.setDate(start.getDate() + 1);
      }
      
      // Parse end time
      const end = new Date(today);
      end.setHours(endHours, endMinutes, 0, 0);
      
      // First, align end date with start date
      end.setDate(start.getDate());

      // If end time is still before start time, it means the booking crosses midnight
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }

      await axios.post(`${API_URL}/bookings`, {
        room: formData.room,
        subject: formData.subject,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: formData.status,
        faculty: user._id
      });

      alert('Room booked successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Error booking room: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl bg-white p-6 rounded-xl shadow-sm ring-1 ring-gray-900/5">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <CalendarPlus /> Book a Room
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Room</label>
            <select 
              value={formData.room}
              onChange={(e) => setFormData({...formData, room: e.target.value})}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              required
            >
              {rooms.map(r => (
                <option key={r._id} value={r._id}>{r.roomNumber} ({r.status})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Meeting Title</label>
            <input 
              type="text" 
              required
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full rounded-md border border-gray-300 p-2 text-sm" 
              placeholder="e.g. Extra Lecture for CS101" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input 
                type="time" 
                required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input 
                type="time" 
                required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full rounded-md border border-gray-300 p-2 text-sm" 
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;
