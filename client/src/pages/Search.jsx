import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search as SearchIcon, Users } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

const API_URL = 'http://localhost:5000/api';

const Search = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    roomNumber: '',
    floor: '',
    type: '',
    capacity: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [availableFloors, setAvailableFloors] = useState([]);

  useEffect(() => {
    // Fetch all rooms once to extract available floors dynamically
    axios.get(`${API_URL}/rooms`).then(res => {
      const floors = [...new Set(res.data.map(r => r.floor))].sort((a, b) => a - b);
      setAvailableFloors(floors);
    }).catch(err => console.error("Failed to load floors:", err));
  }, []);

  useEffect(() => {
    // Whenever filters change, debounce and search
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.roomNumber) params.append('roomNumber', filters.roomNumber);
      if (filters.floor) params.append('floor', filters.floor);
      if (filters.type) params.append('type', filters.type);
      if (filters.capacity) params.append('capacity', filters.capacity);

      const response = await axios.get(`${API_URL}/rooms/search?${params.toString()}`);
      setResults(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl bg-white p-6 rounded-xl shadow-sm ring-1 ring-gray-900/5">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <SearchIcon /> Search Rooms
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room No</label>
            <input 
              type="text" 
              value={filters.roomNumber}
              onChange={e => setFilters(prev => ({...prev, roomNumber: e.target.value}))}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
              placeholder="e.g. 101" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select 
              value={filters.floor}
              onChange={e => setFilters(prev => ({...prev, floor: e.target.value}))}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              {availableFloors.map(fl => (
                <option key={fl} value={fl}>Floor {fl}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              value={filters.type}
              onChange={e => setFilters(prev => ({...prev, type: e.target.value}))}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Any</option>
              <option value="Classroom">Classroom</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Study Room">Study Room</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Capacity</label>
            <input 
              type="number" 
              value={filters.capacity}
              onChange={e => setFilters(prev => ({...prev, capacity: e.target.value}))}
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
              placeholder="e.g. 30" 
            />
          </div>
        </div>
        
        {/* Results Section */}
        <div>
          {loading ? (
             <div className="text-center py-12 text-gray-500">Searching...</div>
          ) : !hasSearched ? (
             <div className="text-center py-12 text-gray-500">Enter search criteria to find available spaces.</div>
          ) : results.length === 0 ? (
             <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
               No rooms found matching your criteria.
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {results.map(room => (
                 <div key={room._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                   <div className="flex justify-between items-start mb-2">
                     <h3 className="text-lg font-bold text-gray-900">{room.roomNumber}</h3>
                     <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                       Floor {room.floor}
                     </span>
                   </div>
                   <p className="text-sm text-gray-500 mb-3">{room.type}</p>
                   <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded inline-flex">
                     <Users size={14} /> Cap: {room.capacity}
                   </div>
                   {room.labType && (
                     <div className="mt-2 text-xs text-indigo-600 font-medium">
                       💻 {room.labType}
                     </div>
                   )}
                 </div>
               ))}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Search;
