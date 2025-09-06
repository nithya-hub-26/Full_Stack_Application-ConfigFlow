import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/Login/Login';
import Signup from './auth/Signup/Signup';
import Dashboard from './tabs/Dashboard/Dashboard';

const AppRoutes = () => {
  return (
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
  );
};

export default AppRoutes;