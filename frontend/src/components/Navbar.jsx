import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, User, Users,
  LogOut, Sun, Moon
} from 'lucide-react';
import segulaLogo from '../assets/segula-logo.png';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const ROLE_LABELS = { admin: 'Administrateur', rh: 'Responsable RH', employe: 'Employé' };

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const langs = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
  ];

  const getInitials = (name = '') =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src={segulaLogo} alt="Segula Technologies" className="sidebar-segula-logo" />
        </div>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="user-avatar">{getInitials(user?.full_name)}</div>
            <div className="user-info-text">
              <div className="user-name">{user?.full_name}</div>
              <div className="user-role">{ROLE_LABELS[user?.role] || user?.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Navigation</span>

          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={17} className="nav-icon" />
            {t('nav.dashboard')}
          </NavLink>

          <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <User size={17} className="nav-icon" />
            {t('nav.profile')}
          </NavLink>

          {/* Admin only */}
          {user?.role === 'admin' && (
            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={17} className="nav-icon" />
              {t('nav.users')}
            </NavLink>
          )}
        </nav>

        {/* Bottom: theme + lang + logout */}
        <div className="sidebar-bottom">
          {/* Language */}
          <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
            {langs.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  background: i18n.language === code ? 'var(--accent-grad)' : 'var(--bg-input)',
                  color: i18n.language === code ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button className="nav-item" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={17} className="nav-icon" /> : <Moon size={17} className="nav-icon" />}
            {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          </button>

          {/* Logout */}
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <LogOut size={17} className="nav-icon" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* ── TOPBAR ──────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-left">
          <h2>{t('nav.dashboard')}</h2>
          <p>{new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="topbar-right">
          <div className="user-avatar" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
            {getInitials(user?.full_name)}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
