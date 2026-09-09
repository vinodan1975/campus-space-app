import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Booking from './pages/Faculty/Booking';
import Reports from './pages/Admin/Reports';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        {/* Navigation could go here */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/faculty/booking" element={<Booking />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
