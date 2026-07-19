import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { 
  LayoutDashboard, 
  Boxes, 
  Receipt, 
  ShoppingBag, 
  Users, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { path: '/products', label: 'Inventory', icon: Boxes, roles: ['admin', 'manager', 'employee'] },
    { path: '/sales', label: 'Sales Orders', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
    { path: '/purchases', label: 'Purchasing', icon: ShoppingBag, roles: ['admin', 'manager'] },
    { path: '/users', label: 'User Admin', icon: Users, roles: ['admin'] },
  ];

  const currentItem = navItems.find(item => item.path === location.pathname);
  const pageTitle = currentItem ? currentItem.label : 'ERP System';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-text">ANTIGRAVITY ERP</div>
        </div>

        <ul className="sidebar-menu">
          {navItems
            .filter(item => item.roles.includes(user?.role || ''))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
        </ul>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.username || 'User'}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="navbar-toggle" 
            title="Log Out"
            style={{ marginLeft: 'auto' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Navbar */}
        <header className="navbar">
          <button 
            className="navbar-toggle"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          <div style={{ flexGrow: 1, marginLeft: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>
              {pageTitle}
            </span>
          </div>

          <div className="navbar-right">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <User size={16} />
              <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                Connected as <strong>{user?.username}</strong> ({user?.role})
              </span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="content-container">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
