import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Upload, FileSpreadsheet, Users, DoorOpen, CheckCircle, AlertCircle, ShieldCheck, GraduationCap, BarChart3 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Return to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-400" />
              <span className="text-sm font-bold  tracking-tight">University Administration Portal</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">

        {/* Tab Navigation */}
        <div className="flex gap-2.5 mb-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Upload size={15} /> Batch CSV Import
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-slate-900 text-amber-400 border border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={15} /> Facility Reports &amp; Export
          </button>
        </div>

        {/* IMPORT TAB */}
        {activeTab === 'import' && (
          <div className="space-y-6">

            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900  mb-1">Step 1 — Select Target Database Entity</h2>
              <p className="text-xs text-slate-500 mb-4">Choose whether you are cataloging facilities or registering users</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setImportType('rooms'); setResult(null); }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    importType === 'rooms'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <DoorOpen size={28} className={importType === 'rooms' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold">Classrooms &amp; Laboratories</span>
                  <span className="text-[11px] text-slate-500 font-normal">Classrooms, Labs, Halls</span>
                </button>
                <button
                  onClick={() => { setImportType('users'); setResult(null); }}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    importType === 'users'
                      ? 'border-amber-500 bg-amber-50/50 text-slate-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Users size={28} className={importType === 'users' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className="text-sm font-bold">University Accounts</span>
                  <span className="text-[11px] text-slate-500 font-normal">Students, Faculty, Staff</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900  mb-1">Step 2 — Acquire Standard Schema Template</h2>
              <p className="text-xs text-slate-500 mb-4">Download the official pre-formatted CSV template file to populate your records</p>
              
              <button
                onClick={() => downloadTemplate(importType)}
                className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={15} className="text-amber-600" />
                <span>Download {importType}_template.csv</span>
              </button>

              <div className="mt-4 bg-slate-950 rounded-xl p-4 text-xs font-mono text-slate-300">
                <p className="font-sans font-bold text-amber-400 mb-1 text-[11px] uppercase tracking-wider">Required Header Structure:</p>
                {importType === 'rooms' ? (
                  <>
                    <p className="text-emerald-400">roomNumber,floor,type,capacity,labType</p>
                    <p className="mt-1 text-[11px] text-slate-400">Allowed Types: Classroom | Computer Lab | Seminar Hall | Study Room</p>
                  </>
                ) : (
                  <>
                    <p className="text-emerald-400">userId,password,role,name</p>
                    <p className="mt-1 text-[11px] text-slate-400">Allowed Roles: Student | Faculty | Admin</p>
                  </>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900  mb-1">Step 3 — Ingest CSV File into Database</h2>
              <p className="text-xs text-slate-500 mb-4">Upload populated .csv file for instant validation and synchronization with MongoDB</p>
              
              <label
                htmlFor="csv-file-input"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/20 transition-all"
              >
                <Upload size={24} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700">
                  {file ? file.name : 'Click to select CSV file from your computer'}
                </span>
                <span className="text-[11px] text-slate-400">Accepts .csv format up to 5MB</span>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleUpload}
                disabled={!file || importing}
                className={`mt-4 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  !file || importing
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-amber-400 hover:bg-slate-800 shadow-md'
                }`}
              >
                {importing ? 'Processing Database Transaction...' : `Ingest ${importType} Records`}
              </button>
            </div>

            {/* Results Alert */}
            {result && (
              <div className={`rounded-2xl p-5 border ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {result.success ? (
                    <CheckCircle size={18} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={18} className="text-rose-600" />
                  )}
                  <h3 className={`font-bold text-sm  ${result.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {result.success ? 'Batch Transaction Complete' : 'Import Exception Encountered'}
                  </h3>
                </div>
                {result.success ? (
                  <div className="text-xs text-emerald-800 space-y-1">
                    <p>✅ <strong>{result.inserted}</strong> record(s) persisted to MongoDB</p>
                    {result.skipped > 0 && <p>⚠️ <strong>{result.skipped}</strong> record(s) skipped due to conflict or validation</p>}
                  </div>
                ) : (
                  <p className="text-xs text-rose-800">{result.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* EXPORT TAB */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 ">Export Full Facility Roster</h2>
                <p className="text-xs text-slate-500 mt-0.5">Generate verified Excel spreadsheet containing all active campus rooms &amp; specifications</p>
              </div>
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4.5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Export XLSX File</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900  mb-4">Real-Time Facility Inventory</h2>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-200 uppercase text-[10px] tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Floor</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Instructor</th>
                      <th className="px-4 py-3">Curriculum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50 font-medium">
                        <td className="px-4 py-3 font-bold text-slate-900 ">{r.roomNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">Floor {r.floor}</td>
                        <td className="px-4 py-3 text-slate-600">{r.type}</td>
                        <td className="px-4 py-3 text-slate-600">{r.capacity} seats</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            r.status === 'Available' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30' :
                            r.status === 'Occupied' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/30' :
                            'bg-amber-50 text-amber-700 ring-1 ring-amber-600/30'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.faculty || '—'}</td>
                        <td className="px-4 py-3 text-slate-700">{r.subject || '—'}</td>
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

