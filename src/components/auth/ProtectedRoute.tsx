
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'technician' | 'administration' | Array<'admin' | 'technician' | 'administration'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      if (user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;