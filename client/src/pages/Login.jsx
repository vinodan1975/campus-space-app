import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, Lock, User as UserIcon, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!userId || !password) {
      setError('Please provide both identification ID and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        userId,
        password
      });
      
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative campus ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-900/60 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Emblem */}
        <div className="flex justify-center mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-xl ring-4 ring-amber-400/20">
            <GraduationCap size={32} className="stroke-[2.2]" />
          </div>
        </div>

        <h2 className="text-center text-3xl font-extrabold tracking-tight text-white ">
          Campus Space
        </h2>
        <p className="mt-1.5 text-center text-xs tracking-wider uppercase font-semibold text-amber-400">
          Academic Facilities Management Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800 ring-1 ring-white/5">
          
          {error && (
            <div className="mb-6 rounded-xl bg-rose-950/50 border border-rose-800/80 p-3.5 text-xs text-rose-300 flex items-center gap-2.5">
              <ShieldAlert size={16} className="text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="userId">
                University ID
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <UserIcon size={16} />
                </div>
                <input
                  id="userId"
                  type="text"
                  placeholder="e.g. STU001 or FAC001"
                  className="block w-full rounded-xl bg-slate-950/80 border border-slate-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="block w-full rounded-xl bg-slate-950/80 border border-slate-700/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In to Campus'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          {/* Quick info footer */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center text-[11px] text-slate-400 flex justify-center gap-4">
            <span>Student: <strong className="text-slate-300">STU001</strong></span>
            <span>•</span>
            <span>Faculty: <strong className="text-slate-300">FAC001</strong></span>
            <span>•</span>
            <span>Admin: <strong className="text-slate-300">ADM001</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

