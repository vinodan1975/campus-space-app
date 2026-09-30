import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, Users, GraduationCap, Building2, CheckCircle2, Clock, X } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

const API_URL = 'http://localhost:5000/api';

const Search = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    roomNumber: '',
    floor: '',
    type: '',
    capacity: '',
    status: '', // 'Available', 'Reserved', 'Occupied', or ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableFloors, setAvailableFloors] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/rooms`).then(res => {
      const floors = [...new Set(res.data.map(r => r.floor))].sort((a, b) => a - b);
      setAvailableFloors(floors);
      // Pre-load initial search with all rooms
      setResults(res.data);
      setHasSearched(true);
    }).catch(err => console.error("Failed to load floors:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.roomNumber) params.append('roomNumber', filters.roomNumber);
      if (filters.floor) params.append('floor', filters.floor);
      if (filters.type) params.append('type', filters.type);
      if (filters.capacity) params.append('capacity', filters.capacity);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`${API_URL}/rooms/search?${params.toString()}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-amber-400" />
              <span className="text-sm font-bold tracking-tight">Facility Directory &amp; Query</span>
            </div>
          </div>
        </div>
      </header>

      {/* Room Detail Modal in Search */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
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

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-semibold uppercase text-slate-500 tracking-wider">Live Status</span>
                <span className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold",
                  selectedRoom.status === 'Available' ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30" :
                  selectedRoom.status === 'Occupied' ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30" :
                  "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
                )}>
                  {selectedRoom.status}
                </span>
              </div>

              {selectedRoom.status !== 'Available' ? (
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Faculty</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRoom.faculty || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Subject</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedRoom.subject}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium">Time Slot</span>
                    <span className="font-bold text-amber-700">
                      🕒 {formatTime(selectedRoom.startTime)} – {formatTime(selectedRoom.endTime)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium text-center">
                  🟢 Currently free for self-study and practice.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Capacity</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedRoom.capacity} Seats</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-slate-400 uppercase text-[10px] font-bold">Campus Floor</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Floor {selectedRoom.floor}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200">
          
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <SearchIcon className="text-amber-500" size={24} /> Search &amp; Filter Campus Rooms
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Filter by availability, facility type (Classrooms, Labs, Study Rooms), floor, and capacity
              </p>
            </div>
            
            <button
              onClick={() => setFilters({ roomNumber: '', floor: '', type: '', capacity: '', status: '' })}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Quick Filter Badges for Feature 3 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'Available' ? '' : 'Available' }))}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                filters.status === 'Available'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              )}
            >
              <CheckCircle2 size={13} />
              <span>Available Rooms Only</span>
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'Study Room' ? '' : 'Study Room' }))}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                filters.type === 'Study Room'
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              )}
            >
              📚 Study Rooms
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'Computer Lab' ? '' : 'Computer Lab' }))}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                filters.type === 'Computer Lab'
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              )}
            >
              💻 Computer Labs
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'Classroom' ? '' : 'Classroom' }))}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                filters.type === 'Classroom'
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              )}
            >
              🏫 Classrooms
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, type: prev.type === 'Seminar Hall' ? '' : 'Seminar Hall' }))}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                filters.type === 'Seminar Hall'
                  ? "bg-slate-900 text-amber-400 shadow-xs"
                  : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
              )}
            >
              🏛️ Seminar Halls
            </button>
          </div>

          {/* Form Filter Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8 bg-slate-50 p-4.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Room ID</label>
              <input 
                type="text" 
                value={filters.roomNumber}
                onChange={e => setFilters(prev => ({...prev, roomNumber: e.target.value}))}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                placeholder="e.g. 101, Lab 1" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Status</label>
              <select 
                value={filters.status}
                onChange={e => setFilters(prev => ({...prev, status: e.target.value}))}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="">Any Status</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Campus Floor</label>
              <select 
                value={filters.floor}
                onChange={e => setFilters(prev => ({...prev, floor: e.target.value}))}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="">All Floors</option>
                {availableFloors.map(fl => (
                  <option key={fl} value={fl}>Floor {fl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Facility Type</label>
              <select 
                value={filters.type}
                onChange={e => setFilters(prev => ({...prev, type: e.target.value}))}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="Classroom">Classroom</option>
                <option value="Computer Lab">Computer Lab</option>
                <option value="Seminar Hall">Seminar Hall</option>
                <option value="Study Room">Study Room</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Min Capacity</label>
              <input 
                type="number" 
                value={filters.capacity}
                onChange={e => setFilters(prev => ({...prev, capacity: e.target.value}))}
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                placeholder="e.g. 30" 
              />
            </div>
          </div>
          
          {/* Results Area */}
          <div>
            {loading ? (
               <div className="text-center py-16 text-slate-400 font-medium text-xs">Querying database catalog...</div>
            ) : !hasSearched ? (
               <div className="text-center py-16 text-slate-400 font-medium text-xs">Specify search criteria above to view matching facilities.</div>
            ) : results.length === 0 ? (
               <div className="text-center py-14 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 <Building2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                 <p className="text-sm font-semibold text-slate-700">No facilities match your search</p>
                 <p className="text-xs text-slate-400 mt-1">Try broadening your floor, type, or capacity criteria</p>
               </div>
            ) : (
               <div>
                 <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-semibold">
                   <span>Found {results.length} room{results.length === 1 ? '' : 's'}</span>
                   <span className="text-[11px] text-slate-400 font-normal">Click any card for full details</span>
                 </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {results.map(room => (
                      <div 
                        key={room._id} 
                        onClick={() => setSelectedRoom(room)}
                        className="bg-white border border-slate-200 rounded-xl p-3 hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-base font-bold text-slate-900 truncate">{room.roomNumber}</h3>
                          <span className={clsx(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            room.status === 'Available' ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30" :
                            room.status === 'Occupied' ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/30" :
                            "bg-amber-50 text-amber-700 ring-1 ring-amber-600/30"
                          )}>
                            {room.status || 'Available'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="font-medium text-slate-700 truncate pr-1">
                            {room.type}
                          </span>
                          <span className="font-semibold text-slate-500 shrink-0">
                            {room.capacity} seats
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Search;



