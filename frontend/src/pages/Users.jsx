import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../utils/api';
import { Plus, Edit, Trash2, X, ShieldAlert } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null); // null means create

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [status, setStatus] = useState('active');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/users');
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditUser(user);
      setUsername(user.username);
      setEmail(user.email);
      setPassword(''); // Don't prefill password
      setRole(user.role);
      setStatus(user.status);
    } else {
      setEditUser(null);
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('employee');
      setStatus('active');
    }
    setModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError(null);

    const userData = {
      username,
      email,
      role,
      status
    };

    if (password) {
      userData.password = password;
    }

    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, userData);
      } else {
        if (!password) {
          alert('Password is required for new users');
          return;
        }
        await api.post('/users', { ...userData, password });
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own logged-in admin account.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      setError(null);
      try {
        await api.delete(`/users/${id}`);
        loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>User Administration</h1>
          <p className="page-subtitle">Configure credentials, roles, and status of backend operators.</p>
        </div>

        <button onClick={() => handleOpenModal(null)} className="btn btn-primary">
          <Plus size={16} />
          <span>Register New User</span>
        </button>
      </div>

      {error && (
        <div className="notification-banner error">
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'inherit' }}><X size={16} /></button>
        </div>
      )}

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading user credentials directory...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users registered in system directory.
            </div>
          ) : (
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email Address</th>
                  <th>Permission Role</th>
                  <th>Operator Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: '700' }}>
                      {u.username}
                      {u.id === currentUser.id && (
                        <span style={{ fontSize: '10px', color: 'var(--primary)', marginLeft: '8px', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>
                          You
                        </span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-role-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.status === 'active' ? 'active' : 'inactive'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenModal(u)} 
                          className="btn btn-secondary btn-icon"
                          title="Modify Account"
                        >
                          <Edit size={14} />
                        </button>
                        {u.id !== currentUser.id && (
                          <button 
                            onClick={() => handleDeleteUser(u.id)} 
                            className="btn btn-secondary btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="Delete Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* USER CREATION/EDIT MODAL */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User Credentials' : 'Register Operator'}</h2>
              <button onClick={() => setModalOpen(false)} className="modal-close"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. jsmith"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. jsmith@erp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editUser ? 'Reset Password (Leave blank to keep current)' : 'Account Password *'}
                  </label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editUser}
                  />
                </div>

                <div className="cols-2">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select 
                      className="form-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={editUser?.id === currentUser.id} // Cannot demote self
                    >
                      <option value="admin">Administrator</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account status</label>
                    <select 
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={editUser?.id === currentUser.id} // Cannot deactivate self
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                {editUser?.id === currentUser.id && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '10px', borderRadius: '6px', fontSize: '11px', color: 'var(--warning)' }}>
                    <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                    <span>Role and status updates are locked for your own active administrator account.</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Operator</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
