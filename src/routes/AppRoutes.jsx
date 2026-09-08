import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Purchase from '../pages/Purchase';
import Transfer from '../pages/Transfer';
import Indents from '../pages/Indents';
import CreateIndent from '../pages/CreateIndent';
import IndentDetails from '../pages/IndentDetails';
import StockHistory from '../pages/StockHistory';
import LowStock from '../pages/LowStock';
import Analytics from '../pages/Analytics';
import Reports from '../pages/Reports';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* General Protected Routes (Admin & Faculty/Staff) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute>
            <ProductDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents"
        element={
          <ProtectedRoute>
            <Indents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents/create"
        element={
          <ProtectedRoute>
            <CreateIndent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/indents/:id"
        element={
          <ProtectedRoute>
            <IndentDetails />
          </ProtectedRoute>
        }
      />

      {/* Admin Only Routes */}
      <Route
        path="/purchases"
        element={
          <RoleRoute requireAdmin={true}>
            <Purchase />
          </RoleRoute>
        }
      />
      <Route
        path="/incoming"
        element={<Navigate to="/purchases" replace />}
      />

      <Route
        path="/transfers"
        element={
          <RoleRoute requireAdmin={true}>
            <Transfer />
          </RoleRoute>
        }
      />
      <Route
        path="/outgoing"
        element={<Navigate to="/transfers" replace />}
      />

      <Route
        path="/history"
        element={
          <RoleRoute requireAdmin={true}>
            <StockHistory />
          </RoleRoute>
        }
      />

      <Route
        path="/low-stock"
        element={
          <RoleRoute requireAdmin={true}>
            <LowStock />
          </RoleRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <RoleRoute requireAdmin={true}>
            <Analytics />
          </RoleRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <RoleRoute requireAdmin={true}>
            <Reports />
          </RoleRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
