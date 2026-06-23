import { useTranslation } from 'react-i18next';
import { MessageSquare, BookOpen, ClipboardList, TrendingUp, Bell, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ══ DASHBOARD EMPLOYÉ ════════════════════════════════════════ */
const DashboardEmploye = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const features = [
    {
      icon: <MessageSquare size={24} color="#fff" />,
      bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      title: t('dashboard.chatbot'),
      desc: t('dashboard.chatbotDesc'),
      glow: 'rgba(99,102,241,0.35)',
    },
    {
      icon: <BookOpen size={24} color="#fff" />,
      bg: 'linear-gradient(135deg,#06b6d4,#0891b2)',
      title: t('dashboard.trainings'),
      desc: t('dashboard.trainingsDesc'),
      glow: 'rgba(6,182,212,0.35)',
    },
    {
      icon: <ClipboardList size={24} color="#fff" />,
      bg: 'linear-gradient(135deg,#10b981,#059669)',
      title: t('dashboard.surveys'),
      desc: t('dashboard.surveysDesc'),
      glow: 'rgba(16,185,129,0.35)',
    },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {/* Welcome header */}
        <div className="page-header">
          <h1>
            {t('dashboard.welcomeBack')} {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p>{t('dashboard.employeTitle')} — {user?.department || 'Aucun département'}</p>
        </div>

        {/* Quick stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { label: 'Formations en cours', value: '3', icon: '📚' },
            { label: 'Enquêtes à compléter', value: '1', icon: '📋' },
            { label: 'Messages non lus', value: '5', icon: '💬' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div style={{ fontSize: '2rem' }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <div
                className="feature-card-icon"
                style={{
                  background: f.bg,
                  boxShadow: `0 0 20px ${f.glow}`,
                }}
              >
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--accent)',
                fontWeight: 600,
                marginTop: 4,
              }}>
                Accéder →
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

/* ══ DASHBOARD RH ═════════════════════════════════════════════ */
const DashboardRH = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const metrics = [
    { label: t('dashboard.totalEmployees'), value: '124', icon: <Users size={22} color="#fff" />, trend: '+3' },
    { label: t('dashboard.activeAccounts'), value: '117', icon: <TrendingUp size={22} color="#fff" />, trend: '+1' },
    { label: t('dashboard.engagement'), value: '84%', icon: <Bell size={22} color="#fff" />, trend: '+5%' },
    { label: t('dashboard.pendingRequests'), value: '7', icon: <ClipboardList size={22} color="#fff" />, trend: '-2' },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <h1>{t('dashboard.rhTitle')}</h1>
          <p>{t('dashboard.welcomeBack')} {user?.full_name}</p>
        </div>

        {/* Metrics */}
        <div className="stats-grid">
          {metrics.map((m, i) => (
            <div className="stat-card" key={i}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="stat-icon">{m.icon}</div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: m.trend.startsWith('+') ? 'var(--success)' : 'var(--danger)',
                  background: m.trend.startsWith('+') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  padding: '3px 8px',
                  borderRadius: 99,
                }}>
                  {m.trend}
                </span>
              </div>
              <div className="stat-value">{m.value}</div>
              <div className="stat-label">{m.label}</div>
            </div>
          ))}
        </div>

        {/* AI Analysis placeholder */}
        <div style={{
          marginTop: 32,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div className="stat-icon" style={{ width: 44, height: 44 }}>
              <span style={{ fontSize: '1.2rem' }}>🤖</span>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Analyse IA</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Insights en temps réel</p>
            </div>
          </div>
          {[
            { text: 'Taux d\'absentéisme en hausse de 2% ce mois-ci', type: 'warning' },
            { text: '3 contrats arrivent à échéance dans 30 jours', type: 'info' },
            { text: 'Score d\'engagement global : 84/100 (+5 pts)', type: 'success' },
          ].map((a, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: a.type === 'warning' ? 'rgba(245,158,11,0.08)' :
                          a.type === 'info' ? 'rgba(6,182,212,0.08)' :
                          'rgba(16,185,129,0.08)',
              border: `1px solid ${a.type === 'warning' ? 'rgba(245,158,11,0.2)' :
                                   a.type === 'info' ? 'rgba(6,182,212,0.2)' :
                                   'rgba(16,185,129,0.2)'}`,
              marginBottom: 8,
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}>
              <span>{a.type === 'warning' ? '⚠️' : a.type === 'info' ? 'ℹ️' : '✅'}</span>
              {a.text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

/* ══ DASHBOARD ADMIN ══════════════════════════════════════════ */
import { useState, useEffect } from 'react';
import api from '../api/axios';

const DashboardAdmin = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState({
    full_name: '', email: '', password: '', role: 'employe', department: '', phone: ''
  });
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/auth/users');
      setUsers(data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (userId) => {
    setActionLoading(userId + '-toggle');
    try {
      await api.put(`/api/auth/users/${userId}/toggle-active`);
      await fetchUsers();
    } catch (_) {}
    setActionLoading(null);
  };

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId + '-role');
    try {
      await api.put(`/api/auth/users/${userId}/role?new_role=${newRole}`);
      await fetchUsers();
    } catch (_) {}
    setActionLoading(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/api/auth/register', createForm);
      setCreateSuccess('Compte créé avec succès !');
      fetchUsers();
      setTimeout(() => { setShowCreateModal(false); setCreateSuccess(''); setCreateForm({ full_name:'',email:'',password:'',role:'employe',department:'',phone:'' }); }, 1500);
    } catch (err) {
      setCreateError(err?.response?.data?.detail || 'Erreur lors de la création.');
    }
  };

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admin: users.filter(u => u.role === 'admin').length,
    rh: users.filter(u => u.role === 'rh').length,
    employe: users.filter(u => u.role === 'employe').length,
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>{t('dashboard.adminTitle')}</h1>
            <p>{t('dashboard.manageUsers')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + {t('dashboard.createAccount')}
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[
            { label: t('dashboard.totalEmployees'), value: stats.total, icon: '👥' },
            { label: t('dashboard.activeAccounts'), value: stats.active, icon: '✅' },
            { label: 'Admins', value: stats.admin, icon: '🛡️' },
            { label: 'RH', value: stats.rh, icon: '📊' },
            { label: 'Employés', value: stats.employe, icon: '👤' },
          ].map((s, i) => (
            <div className="stat-card" key={i}>
              <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            className="form-input"
            style={{ maxWidth: 360, paddingLeft: 16 }}
            placeholder={t('common.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('common.loading')}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>{t('dashboard.role')}</th>
                  <th>Département</th>
                  <th>{t('dashboard.status')}</th>
                  <th>{t('dashboard.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={u.id === currentUser?.id || actionLoading === u.id + '-role'}
                        onChange={e => changeRole(u.id, e.target.value)}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          color: 'var(--text-primary)',
                          padding: '4px 8px',
                          fontSize: '0.82rem',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="employe">Employé</option>
                        <option value="rh">RH</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                      {u.department || '—'}
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                        {u.is_active ? t('dashboard.active') : t('dashboard.inactive')}
                      </span>
                    </td>
                    <td>
                      {u.id !== currentUser?.id && (
                        <button
                          className={`btn ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                          onClick={() => toggleActive(u.id)}
                          disabled={actionLoading === u.id + '-toggle'}
                        >
                          {actionLoading === u.id + '-toggle' ? '...' :
                            u.is_active ? t('dashboard.deactivate') : t('dashboard.activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create user modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
            <div className="modal-box">
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
                Créer un compte
              </h2>
              {createSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>✅ {createSuccess}</div>}
              {createError && <div className="alert alert-error" style={{ marginBottom: 16 }}>⚠️ {createError}</div>}
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { name: 'full_name', label: 'Nom complet', type: 'text', required: true },
                  { name: 'email', label: 'Email', type: 'email', required: true },
                  { name: 'password', label: 'Mot de passe', type: 'password', required: true },
                  { name: 'department', label: 'Département', type: 'text' },
                  { name: 'phone', label: 'Téléphone', type: 'text' },
                ].map(field => (
                  <div className="form-group" key={field.name}>
                    <label className="form-label">{field.label}</label>
                    <input
                      className="form-input"
                      style={{ paddingLeft: 16 }}
                      type={field.type}
                      value={createForm[field.name]}
                      onChange={e => setCreateForm(p => ({ ...p, [field.name]: e.target.value }))}
                      required={field.required}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Rôle</label>
                  <select
                    value={createForm.role}
                    onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                    style={{
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                      padding: '13px 16px', fontFamily: 'inherit', fontSize: '0.9rem',
                    }}
                  >
                    <option value="employe">Employé</option>
                    <option value="rh">Responsable RH</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Créer le compte
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ── Router component ──────────────────────────────────────── */
import { useAuth as useAuthCheck } from '../context/AuthContext';

const DashboardRouter = () => {
  const { user } = useAuthCheck();

  if (user?.role === 'admin')   return <DashboardAdmin />;
  if (user?.role === 'rh')      return <DashboardRH />;
  return <DashboardEmploye />;
};

export { DashboardEmploye, DashboardRH, DashboardAdmin };
export default DashboardRouter;
