import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token && !user) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('auth_user', JSON.stringify(res.user));
          }
        } catch (e) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
    };
    checkAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      if (!username || !password) {
        throw new Error('Please enter both username and password');
      }

      const response = await authApi.login({ username, password });
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        localStorage.setItem('auth_token', response.token);
        return { success: true, user: response.user };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Invalid username or password';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isFaculty = user?.role === 'FACULTY';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isFaculty,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
