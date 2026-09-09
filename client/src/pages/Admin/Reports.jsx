import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, FileSpreadsheet, Users, DoorOpen, CheckCircle, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('import');
  const [importType, setImportType] = useState('rooms');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
    fetchRooms();
  }, [navigate]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_URL}/rooms`);
      setRooms(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_URL}/import/${importType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult({ success: true, ...res.data });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';
      fetchRooms();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || err.message });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (type) => {
    window.open(`${API_URL}/import/template/${type}`, '_blank');
  };

  const exportExcel = () => {
    window.open(`${API_URL}/import/export/rooms`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Upload size={16} /> Import CSV
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Download size={16} /> Export & Reports
          </button>
        </div>

        {/* ─── IMPORT TAB ─── */}
        {activeTab === 'import' && (
          <div className="space-y-6">

            {/* Step 1: Choose Type */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1 — Choose what to import</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setImportType('rooms'); setResult(null); }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all ${
                    importType === 'rooms'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <DoorOpen size={32} />
                  <span className="font-semibold">Rooms</span>
                  <span className="text-xs text-gray-500">Classrooms, Labs, Halls</span>
                </button>
                <button
                  onClick={() => { setImportType('users'); setResult(null); }}
                  className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all ${
                    importType === 'users'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Users size={32} />
                  <span className="font-semibold">Users</span>
                  <span className="text-xs text-gray-500">Students, Faculty, Admin</span>
                </button>
              </div>
            </div>

            {/* Step 2: Download Template */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 2 — Download CSV template</h2>
              <p className="text-sm text-gray-500 mb-4">Download the template, fill in your data, then upload it below.</p>
              <button
                onClick={() => downloadTemplate(importType)}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <FileSpreadsheet size={16} /> Download {importType}_template.csv
              </button>

              {importType === 'rooms' && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 text-xs text-gray-600 font-mono overflow-x-auto">
                  <p className="font-semibold text-gray-700 mb-1">Expected columns:</p>
                  <p>roomNumber, floor, type, capacity, labType</p>
                  <p className="mt-1 text-gray-400">type: Classroom | Computer Lab | Seminar Hall | Study Room</p>
                  <p className="text-gray-400">labType: optional (e.g. Windows, Mac, Electronics)</p>
                </div>
              )}
              {importType === 'users' && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4 text-xs text-gray-600 font-mono overflow-x-auto">
                  <p className="font-semibold text-gray-700 mb-1">Expected columns:</p>
                  <p>userId, password, role, name</p>
                  <p className="mt-1 text-gray-400">role: Student | Faculty | Admin</p>
                  <p className="text-gray-400">userId: STU+number for Students, FAC+number for Faculty</p>
                </div>
              )}
            </div>

            {/* Step 3: Upload */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 3 — Upload your CSV</h2>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="csv-file-input"
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
                >
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {file ? file.name : 'Click to select a .csv file'}
                  </span>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <button
                onClick={handleUpload}
                disabled={!file || importing}
                className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
                  !file || importing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {importing ? 'Importing...' : `Import ${importType}`}
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-xl p-5 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle size={20} className="text-green-600" />
                  ) : (
                    <AlertCircle size={20} className="text-red-600" />
                  )}
                  <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Import Successful!' : 'Import Failed'}
                  </h3>
                </div>
                {result.success ? (
                  <div className="text-sm text-green-700 space-y-1">
                    <p>✅ {result.inserted} records inserted</p>
                    {result.skipped > 0 && <p>⚠️ {result.skipped} records skipped</p>}
                    {result.errors?.length > 0 && (
                      <div className="mt-2 bg-white/60 rounded-lg p-3 text-xs text-gray-600 max-h-32 overflow-y-auto">
                        {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-700">{result.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── EXPORT TAB ─── */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Export All Rooms to Excel</h2>
              <p className="text-sm text-gray-500 mb-4">Download a complete .xlsx file with all room data.</p>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
              >
                <Download size={16} /> Export rooms_export.xlsx
              </button>
            </div>

            {/* Room usage overview */}
            <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Room Usage Overview</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{rooms.filter(r => r.status === 'Available').length}</p>
                  <p className="text-xs text-green-600 mt-1">🟢 Available</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{rooms.filter(r => r.status === 'Occupied').length}</p>
                  <p className="text-xs text-red-600 mt-1">🔴 Occupied</p>
                </div>
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{rooms.filter(r => r.status === 'Reserved').length}</p>
                  <p className="text-xs text-yellow-600 mt-1">🟡 Reserved</p>
                </div>
              </div>

              {/* Room Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Floor</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Faculty</th>
                      <th className="px-4 py-3">Subject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rooms.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.roomNumber}</td>
                        <td className="px-4 py-3">{r.floor}</td>
                        <td className="px-4 py-3">{r.type}</td>
                        <td className="px-4 py-3">{r.capacity}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.status === 'Available' ? 'bg-green-100 text-green-800' :
                            r.status === 'Occupied' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{r.faculty || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.subject || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
