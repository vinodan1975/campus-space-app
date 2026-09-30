import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Search, PlusCircle, GraduationCap, Bell, X, Compass, ShieldCheck, 
  Clock, User as UserIcon, BookOpen, Calendar, ChevronDown, ChevronUp, 
  History, Info, CheckCircle2, AlertCircle, Building2, Users
} from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import clsx from 'clsx';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const notifRef = useRef(null);

  const socketRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Click outside to close notification center dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;

    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('room_booked', (data) => {
      const now = new Date();
      const notifItem = {
        id: Date.now(),
        type: 'booked',
        roomNumber: data.roomNumber,
        floor: data.floor,
        subject: data.subject,
        faculty: data.faculty,
        department: data.department,
        year: data.year,
        startTime: data.startTime,
        endTime: data.endTime,
        timestamp: now,
      };

      // Check if this student is targeted
      // If user is Student, only notify if department and year match (or if booking is General / All)
      const isTargetedStudent = user.role !== 'Student' || (
        (!data.department || data.department === 'General' || !user.department || data.department === user.department) &&
        (!data.year || data.year === 'All' || !user.year || data.year === user.year)
      );

      if (isTargetedStudent) {
        setNotifications(prev => [notifItem, ...prev]);
        pushToast(notifItem);
      }

      // Add to general activity log (all room events)
      setActivityLog(prev => [
        {
          id: Date.now(),
          type: 'booked',
          roomNumber: data.roomNumber,
          floor: data.floor,
          desc: `${data.faculty} booked for "${data.subject}"${data.department ? ` (${data.department} ${data.year || ''})` : ''}`,
          timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev
      ]);

      fetchRooms();
    });

    socket.on('room_cancelled', (data) => {
      const now = new Date();
      const notifItem = {
        id: Date.now(),
        type: 'cancelled',
        roomNumber: data.roomNumber,
        floor: data.floor,
        timestamp: now,
      };

      setNotifications(prev => [notifItem, ...prev]);
      pushToast(notifItem);

      setActivityLog(prev => [
        {
          id: Date.now(),
          type: 'cancelled',
          roomNumber: data.roomNumber,
          floor: data.floor,
          desc: `Booking cancelled, now Available`,
          timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev
      ]);

      fetchRooms();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const pushToast = (item) => {
    setToasts(prev => [item, ...prev]);
    setTimeout(() => {
      dismissToast(item.id);
    }, 6000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleLogout = () => {
    if (socketRef.current) socketRef.current.disconnect();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {});

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) return null;

  const totalRooms = rooms.length;
  const availableCount = rooms.filter(r => r.status === 'Available').length;
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const reservedCount = rooms.filter(r => r.status === 'Reserved').length;

  // Filter Today's Schedule for Students:
  // Must match student's department & year if specified!
  const todaysSchedule = rooms
    .filter(r => {
      if (r.status !== 'Reserved' && r.status !== 'Occupied') return false;
      if (user.role === 'Student' && user.department && user.year) {
        const matchesDept = !r.department || r.department === 'General' || r.department === user.department;
        const matchesYear = !r.year || r.year === 'All' || r.year === user.year;
        return matchesDept && matchesYear;
      }
      return true;
    })
    .sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 w-92 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 bg-slate-950 text-white border-l-4 border-amber-500 p-4 rounded-xl shadow-2xl text-xs animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
              <Bell size={16} />
            </div>
            <div className="flex-1 min-w-0">
              {t.type === 'booked' ? (
                <>
                  <p className="font-bold text-amber-400 text-xs flex items-center justify-between">
                    <span>Room {t.roomNumber} Reserved</span>
                    {t.department && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {t.department} {t.year}
                      </span>
                    )}
                  </p>
                  <p className="text-slate-200 mt-0.5 font-medium leading-snug">
                    {t.faculty} booked Room {t.roomNumber} for <span className="text-amber-300 font-semibold">{t.subject}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>🕒 {formatTime(t.startTime)} – {formatTime(t.endTime)}</span>
                    {t.floor && <span>• Floor {t.floor}</span>}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-emerald-400 text-xs">
                    Room {t.roomNumber} is now Available
                  </p>
                  <p className="text-slate-300 mt-0.5 text-[11px]">
                    Booking was cancelled · Open for study{t.floor ? ` · Floor ${t.floor}` : ''}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-lg">
                  {selectedRoom.roomNumber}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Facility Details</h3>
                  <p className="text-xs text-slate-400">{selectedRoom.type} • Floor {selectedRoom.floor}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Status</span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                  selectedRoom.status === 'Available' ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30" :
                  selectedRoom.status === 'Occupied' ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30" :
                  "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
                )}>
                  <span className={clsx(
                    "h-2 w-2 rounded-full",
                    selectedRoom.status === 'Available' ? "bg-emerald-500" : selectedRoom.status === 'Occupied' ? "bg-rose-500" : "bg-amber-500"
                  )} />
                  {selectedRoom.status}
                </span>
              </div>

              {selectedRoom.status !== 'Available' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Faculty / Instructor</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRoom.faculty || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Subject / Course</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRoom.subject}</span>
                  </div>
                  {selectedRoom.department && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Target Class</span>
                      <span className="font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                        {selectedRoom.department} • {selectedRoom.year}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Reserved Time</span>
                    <span className="font-bold text-amber-700">
                      🕒 {formatTime(selectedRoom.startTime)} – {formatTime(selectedRoom.endTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium text-center">
                  🟢 This space is currently free and open for student self-study or practice.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Capacity</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedRoom.capacity} Seats</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Campus Floor</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Floor {selectedRoom.floor}</p>
                </div>
              </div>

              {selectedRoom.labType && (
                <div className="text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-800 font-medium">
                  💻 Specialized Lab Specification: <strong>{selectedRoom.labType}</strong>
                </div>
              )}

              <div className="pt-2">
                {user.role === 'Faculty' && selectedRoom.status === 'Available' ? (
                  <button
                    onClick={() => {
                      const id = selectedRoom._id;
                      setSelectedRoom(null);
                      navigate(`/faculty/booking?roomId=${id}`);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Proceed to Reserve Room {selectedRoom.roomNumber}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close Facility Card
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Clean Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-md">
                <GraduationCap size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Campus <span className="text-amber-400 font-black text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">Space</span>
                </span>
                <p className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">Academic Facilities Hub</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              
              {/* User Identity Chip */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3.5 py-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/20">
                  {user.role} {user.department ? `• ${user.department} ${user.year || ''}` : ''}
                </span>
              </div>

              {/* Notification Center Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 transition-colors cursor-pointer"
                  title="Notification Center"
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 shadow-xs">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown Panel */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-900 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="text-amber-400" />
                        <span className="text-xs font-bold tracking-tight">Notification Center</span>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="max-h-84 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium">
                          <Bell size={24} className="mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                          No new notifications yet.<br />
                          Live booking updates will appear here!
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors text-xs">
                            {n.type === 'booked' ? (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-900">
                                    • Room {n.roomNumber} Reserved
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 mt-1 leading-snug">
                                  {n.faculty} booked for <strong className="text-slate-900">{n.subject}</strong>
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-medium">
                                  <span>🕒 {formatTime(n.startTime)} – {formatTime(n.endTime)} {n.floor ? `· Floor ${n.floor}` : ''}</span>
                                  {n.department && (
                                    <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      {n.department} {n.year}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-700">
                                    • Room {n.roomNumber} is now available
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-slate-500 mt-1 text-[11px]">
                                  Booking was cancelled{n.floor ? ` · Floor ${n.floor}` : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Search Page */}
              <button
                onClick={() => navigate('/search')}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                title="Search Rooms"
              >
                <Search size={15} className="text-amber-400" />
                <span className="hidden md:inline">Find Room</span>
              </button>

              {/* Faculty Book Room */}
              {user.role === 'Faculty' && (
                <button
                  onClick={() => navigate('/faculty/booking')}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition-all cursor-pointer"
                >
                  <PlusCircle size={15} className="stroke-[2.5]" />
                  <span>Reserve Room</span>
                </button>
              )}

              {/* Admin Panel */}
              {user.role === 'Admin' && (
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors cursor-pointer"
                >
                  <ShieldCheck size={15} />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner with Stats */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
                <span className="text-xs font-medium text-slate-400">Campus Real-Time Facilities Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Hall &amp; Classroom Availability
              </h1>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                <div className="text-xl font-bold text-emerald-400">{availableCount}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">Available</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                <div className="text-xl font-bold text-rose-400">{occupiedCount}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">Occupied</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 backdrop-blur-xs">
                <div className="text-xl font-bold text-amber-400">{reservedCount}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">Reserved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Schedule for Students */}
        {user.role === 'Student' && (
          <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">MY TODAY'S SCHEDULE</h2>
                  <p className="text-xs text-slate-500">
                    {user.department && user.year ? (
                      <span>Classes for <strong>{user.department} ({user.year})</strong></span>
                    ) : (
                      <span>Scheduled lectures and reserved classrooms for today</span>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {todaysSchedule.length} Sessions
              </span>
            </div>

            {todaysSchedule.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                🎉 No classes scheduled for your class right now!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {todaysSchedule.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedRoom(item)}
                    className="p-3.5 bg-slate-50/80 hover:bg-amber-50/50 border border-slate-200/80 hover:border-amber-300 rounded-xl transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-amber-400 font-bold text-xs">
                        {item.roomNumber}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.subject}</p>
                          {item.department && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded">
                              {item.department} {item.year}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{item.faculty || 'Faculty'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md">
                        {formatTime(item.startTime)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">Floor {item.floor}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Room Grid by Floor */}
        {rooms.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Compass className="mx-auto h-12 w-12 text-slate-300 animate-spin" />
            <p className="mt-3 text-sm font-semibold text-slate-600">Gathering classroom availability data...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.keys(roomsByFloor).sort().map((floor) => (
              <section key={floor} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
                
                {/* Floor Title with Modern Sans Font */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-amber-400 font-bold text-xs shadow-xs">
                      F{floor}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Floor {floor} Facilities</h2>
                      <p className="text-xs text-slate-500 font-medium">{roomsByFloor[floor].length} Spaces cataloged</p>
                    </div>
                  </div>
                  
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {roomsByFloor[floor].filter(r => r.status === 'Available').length} Free Now
                  </span>
                </div>

                {/* Compact Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {roomsByFloor[floor].map((room) => {
                    const isAvail = room.status === 'Available';
                    const isOcc = room.status === 'Occupied';

                    return (
                      <div
                        key={room._id}
                        onClick={() => setSelectedRoom(room)}
                        className={clsx(
                          "relative rounded-xl bg-white border p-3 transition-all duration-150 shadow-xs hover:shadow-md hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between",
                          isAvail ? "border-slate-200 hover:border-emerald-500" :
                          isOcc ? "border-rose-200 bg-rose-50/15 hover:border-rose-400" :
                          "border-amber-200 bg-amber-50/15 hover:border-amber-400"
                        )}
                      >
                        {/* Top Indicator Strip */}
                        <div
                          className={clsx(
                            "absolute top-0 left-0 right-0 h-1 rounded-t-xl",
                            isAvail ? "bg-emerald-500" : isOcc ? "bg-rose-500" : "bg-amber-500"
                          )}
                        />

                        {/* Top Row: Room Number & Status Pill */}
                        <div className="flex items-center justify-between gap-1.5 pt-0.5 mb-2">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                            {room.roomNumber}
                          </h3>
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                            isAvail ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30" :
                            isOcc ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30" :
                            "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
                          )}>
                            <span className={clsx(
                              "h-1.5 w-1.5 rounded-full",
                              isAvail ? "bg-emerald-500" : isOcc ? "bg-rose-500" : "bg-amber-500"
                            )} />
                            {room.status}
                          </span>
                        </div>

                        {/* Bottom Row: Room Type & Capacity */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="font-medium text-slate-700 truncate pr-1">
                            {room.type}
                          </span>
                          <span className="font-semibold text-slate-500 shrink-0">
                            {room.capacity} seats
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </section>
            ))}
          </div>
        )}

        {/* Feature 5: Booking History / Recent Activity Log */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm">
          <div 
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-amber-400">
                <History size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">RECENT CAMPUS ACTIVITY LOG</h2>
                <p className="text-xs text-slate-500">Live feed of today's room reservations and cancellations</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>{activityLog.length} Events</span>
              {isActivityOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {isActivityOpen && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              {activityLog.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No activity events recorded yet in this session.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {activityLog.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-400 text-[11px] font-semibold">{act.timeStr}</span>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[11px] font-bold",
                          act.type === 'booked' ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        )}>
                          Room {act.roomNumber}
                        </span>
                        <span className="text-slate-700 font-medium">{act.desc}</span>
                      </div>
                      {act.floor && (
                        <span className="text-[11px] text-slate-400 font-medium">Floor {act.floor}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
