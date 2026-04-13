import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import QRRegister from './pages/QRRegister';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import Events from './pages/Events';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/student" element={
            <PrivateRoute roles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          } />
          <Route path="/faculty" element={
            <PrivateRoute roles={['faculty']}>
              <FacultyDashboard />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="/events" element={
            <PrivateRoute roles={['student', 'faculty', 'admin']}>
              <Events />
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute roles={['admin']}>
              <AnalyticsDashboard />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
  <PrivateRoute roles={['student', 'faculty', 'admin']}>
    <Profile />
  </PrivateRoute>
} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register-event/:id" element={<QRRegister />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;