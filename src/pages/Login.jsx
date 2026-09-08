import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('e.ramesh');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          ⚡
        </div>
        <h1>Electrical Stock Monitoring System</h1>
        <p className="login-sub">
          National Engineering College — Maintenance Department
        </p>

        {/* Quick Demo Access Buttons */}
        <div className="login-hint-box">
          <div style={{ fontWeight: 700, marginBottom: '6px' }}>Quick Demo Login:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => handleQuickFill('e.ramesh', 'password123')}
              style={{ flex: 1, fontSize: '0.74rem' }}
            >
              🔑 Store Admin (E. Ramesh)
            </button>
            <button
              type="button"
              className="btn-outline btn-sm"
              onClick={() => handleQuickFill('cse.faculty', 'faculty123')}
              style={{ flex: 1, fontSize: '0.74rem' }}
            >
              👤 CSE Faculty (Dr. Saravanan)
            </button>
          </div>
        </div>

        {error && (
          <div className="login-error-box" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-username">Username or Email</label>
            <input
              type="text"
              id="login-username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Authenticating...' : 'Login to System'}
          </Button>
        </form>

        <div className="login-foot">
          Role-Based Access Control · Store Admin & Department Indents
        </div>
      </div>
    </div>
  );
};

export default Login;
