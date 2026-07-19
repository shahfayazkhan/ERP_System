import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, clearAuthError } from '../store/slices/authSlice';

const Login = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/');
    }
    // Clear errors on load
    dispatch(clearAuthError());
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) return;
    dispatch(loginUser({ usernameOrEmail, password }));
  };

  return (
    <div className="login-wrapper">
      <div className="login-glow" />
      <div className="login-glow-bottom" />
      
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">ADVANCE ERP</div>
          <p className="login-subtitle">Sign in to manage your enterprise resource database</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. admin"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          <p>Demo accounts (Username / Password):</p>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span><strong>Admin</strong>: admin / admin123</span>
            <span><strong>Manager</strong>: manager / manager123</span>
            <span><strong>Employee</strong>: employee / employee123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
