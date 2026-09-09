import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, PlusCircle, LayoutDashboard, Bell, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import clsx from 'clsx';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
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

  // Connect socket & fetch rooms once user is set
  useEffect(() => {
    if (!user) return;

    fetchRooms();
    // Refresh every 10s as a background safety net
    const interval = setInterval(fetchRooms, 10000);

    // Connect to Socket.io
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    // When any faculty books a room → push notification + refresh rooms
    socket.on('room_booked', (data) => {
      const msg = `🔔 Room ${data.roomNumber} was booked by ${data.faculty} for "${data.subject}"`;
      pushNotification(msg);
      fetchRooms();
    });

    // When a booking is cancelled → notification + refresh
    socket.on('room_cancelled', (data) => {
      const msg = `✅ Room ${data.roomNumber} is now Available again`;
      pushNotification(msg);
      fetchRooms();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [user]);

  const pushNotification = (msg) => {
    setNotifications(prev => [{ id: Date.now(), msg }, ...prev]);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Notification Toasts — bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 w-80">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-3 bg-white border border-indigo-200 p-4 rounded-xl shadow-xl text-sm text-gray-800 animate-pulse"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <Bell size={16} />
            </div>
            <p className="flex-1 font-medium leading-snug">{n.msg}</p>
            <button
              onClick={() => dismissNotification(n.id)}
              className="text-gray-400 hover:text-gray-600 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <LayoutDashboard size={18} />
              </div>
              <span className="text-xl font-bold text-gray-900">Campus Space</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Welcome, {user.name}
              </span>
              {/* Notification Bell with count */}
              {notifications.length > 0 && (
                <div className="relative">
                  <Bell size={20} className="text-indigo-600" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notifications.length}
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate('/search')}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Search Rooms"
              >
                <Search size={20} />
              </button>
              {user.role === 'Faculty' && (
                <button
                  onClick={() => navigate('/faculty/booking')}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                  title="Book Room"
                >
                  <PlusCircle size={16} /> Book Room
                </button>
              )}
              {user.role === 'Admin' && (
                <button
                  onClick={() => navigate('/admin/reports')}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                  title="Admin Panel"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Live Availability Dashboard
            <span className="ml-3 text-xs font-normal text-gray-400 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">🟢 Live</span>
          </h1>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500"></span> Available</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500"></span> Occupied</div>
            <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-yellow-500"></span> Reserved</div>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Loading rooms...</div>
        ) : (
          <div className="space-y-10">
            {Object.keys(roomsByFloor).sort().map((floor) => (
              <div key={floor}>
                <h2 className="mb-4 text-lg font-semibold text-gray-700 border-b border-gray-200 pb-2">
                  Floor {floor}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {roomsByFloor[floor].map((room) => (
                    <div
                      key={room._id}
                      className="relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className={clsx(
                        "h-2 w-full",
                        room.status === 'Available' ? "bg-green-500" :
                        room.status === 'Occupied' ? "bg-red-500" : "bg-yellow-500"
                      )} />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{room.roomNumber}</h3>
                            <p className="text-sm text-gray-500">{room.type} • Cap: {room.capacity}</p>
                          </div>
                          <span className={clsx(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            room.status === 'Available' ? "bg-green-100 text-green-800" :
                            room.status === 'Occupied' ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                          )}>
                            {room.status}
                          </span>
                        </div>

                        {room.status !== 'Available' ? (
                          <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 space-y-1">
                            <p><span className="font-medium">Faculty:</span> {room.faculty || 'N/A'}</p>
                            <p><span className="font-medium">Subject:</span> {room.subject}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              🕒 {formatTime(room.startTime)} – {formatTime(room.endTime)}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 text-center text-sm text-gray-500">
                            Free for study &amp; practice
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
