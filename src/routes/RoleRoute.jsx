import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';

export const RoleRoute = ({ children, requireAdmin = false }) => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return <Loading message="Verifying user permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;
