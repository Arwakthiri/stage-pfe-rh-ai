import { useTranslation } from 'react-i18next';
import { MessageSquare, BookOpen, ClipboardList, TrendingUp, Bell, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ══ DASHBOARD EMPLOYÉ ════════════════════════════════════════ */
const DashboardEmploye = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare size={24} color="#fff" />,
      bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      title: t('dashboard.chatbot'),
      desc: t('dashboard.chatbotDesc'),
      glow: 'rgba(99,102,241,0.35)',
      path: '/employe/chatbot'
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
            <div
              className="feature-card"
              key={i}
              style={{ cursor: f.path ? 'pointer' : 'default' }}
              onClick={() => f.path && navigate(f.path)}
            >
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
              {f.path && (
                <span style={{
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  marginTop: 4,
                }}>
                  Accéder →
                </span>
              )}
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

  // Nouveaux états pour les performances de l'IA
  const [activeTab, setActiveTab] = useState('comptes'); // 'comptes' ou 'modele'
  const [modelPerfXlm, setModelPerfXlm] = useState(null);
  const [modelPerfCamembert, setModelPerfCamembert] = useState(null);
  const [selectedModel, setSelectedModel] = useState('xlm'); // 'xlm' ou 'camembert'
  const [evaluating, setEvaluating] = useState(false);
  const [cmTimestamp, setCmTimestamp] = useState(Date.now());
  const [cmImage, setCmImage] = useState('');

  const activeModelPerf = selectedModel === 'xlm' ? modelPerfXlm : modelPerfCamembert;

  useEffect(() => {
    let objectUrl = '';
    const fetchConfusionMatrix = async () => {
      try {
        const response = await api.get(`/api/analytics/confusion-matrix?model_type=${selectedModel}`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(response.data);
        setCmImage(objectUrl);
      } catch (err) {
        console.error("Erreur de chargement de la matrice de confusion:", err);
      }
    };
    fetchConfusionMatrix();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cmTimestamp, selectedModel]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/auth/users');
      setUsers(data);
    } catch (_) { }
    setLoading(false);
  };

  const fetchAllModelPerf = async () => {
    try {
      const resXlm = await api.get('/api/analytics/model-performance?model_type=xlm');
      setModelPerfXlm(resXlm.data);
    } catch (e) {
      console.warn("Erreur chargement perf XLM:", e);
    }
    try {
      const resCam = await api.get('/api/analytics/model-performance?model_type=camembert');
      setModelPerfCamembert(resCam.data);
    } catch (e) {
      console.warn("Erreur chargement perf CamemBERT:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAllModelPerf();
  }, []);

  const toggleActive = async (userId) => {
    setActionLoading(userId + '-toggle');
    try {
      await api.put(`/api/auth/users/${userId}/toggle-active`);
      await fetchUsers();
    } catch (_) { }
    setActionLoading(null);
  };

  const changeRole = async (userId, newRole) => {
    setActionLoading(userId + '-role');
    try {
      await api.put(`/api/auth/users/${userId}/role?new_role=${newRole}`);
      await fetchUsers();
    } catch (_) { }
    setActionLoading(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    try {
      await api.post('/api/auth/register', createForm);
      setCreateSuccess('Compte créé avec succès !');
      fetchUsers();
      setTimeout(() => { setShowCreateModal(false); setCreateSuccess(''); setCreateForm({ full_name: '', email: '', password: '', role: 'employe', department: '', phone: '' }); }, 1500);
    } catch (err) {
      setCreateError(err?.response?.data?.detail || 'Erreur lors de la création.');
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      await api.post(`/api/analytics/evaluate?model_type=${selectedModel}`);
      await fetchAllModelPerf();
      setCmTimestamp(Date.now());
    } catch (err) {
      console.error("Erreur lors de l'évaluation du modèle:", err);
      alert("Impossible de lancer l'évaluation en direct.");
    } finally {
      setEvaluating(false);
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

      {/* Injection des styles d'animation pour le chargement */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-loader {
          animation: spin 1.2s linear infinite;
        }
      `}</style>

      <main className="main-content">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1>{t('dashboard.adminTitle')}</h1>
            <p>{activeTab === 'comptes' ? t('dashboard.manageUsers') : "Analyse des performances du modèle de sentiment (PFE)"}</p>
          </div>
          {activeTab === 'comptes' && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + {t('dashboard.createAccount')}
            </button>
          )}
        </div>

        {/* Navigation par Onglets */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('comptes')}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'comptes' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'comptes' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            👥 Gestion des Comptes
          </button>
          <button
            onClick={() => setActiveTab('modele')}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: 600,
              color: activeTab === 'modele' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'modele' ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            Performance du Modèle IA chatbot Segula
          </button>
        </div>

        {activeTab === 'comptes' ? (
          <>
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
          </>
        ) : (
          /* Onglet de performance IA */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Métriques & Comparaison des Modèles IA</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Évaluation calculée sur le jeu de test indépendant (20% des données du dataset) pour comparer l'original (XLM-RoBERTa) au modèle français (CamemBERT).
                </p>
              </div>
            </div>

            {/* Tableau de Comparaison Globale */}
            <div style={{
              padding: 20,
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>
                Tableau Comparatif : XLM-RoBERTa vs CamemBERT
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700 }}>Modèle d'IA</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>Précision Globale (Accuracy)</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>Précision (Precision)</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>Rappel (Recall)</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>F1-Score moyen</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700 }}>Échantillons de test</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'left', padding: '12px', fontWeight: 700 }}>
                        XLM-RoBERTa (Multilingue)
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfXlm ? `${(modelPerfXlm.accuracy * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfXlm ? `${(modelPerfXlm.precision * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfXlm ? `${(modelPerfXlm.recall * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                        {modelPerfXlm ? `${(modelPerfXlm.f1_score * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>
                        {modelPerfXlm ? modelPerfXlm.test_samples : '-'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ textAlign: 'left', padding: '12px', fontWeight: 700 }}>
                        CamemBERT (Spécialisé Français)
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfCamembert ? `${(modelPerfCamembert.accuracy * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfCamembert ? `${(modelPerfCamembert.precision * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px' }}>
                        {modelPerfCamembert ? `${(modelPerfCamembert.recall * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', fontWeight: 700, color: 'var(--accent)' }}>
                        {modelPerfCamembert ? `${(modelPerfCamembert.f1_score * 100).toFixed(1)}%` : 'Chargement...'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)' }}>
                        {modelPerfCamembert ? modelPerfCamembert.test_samples : '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sélecteur de modèle pour le détail et bouton d'évaluation */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Afficher le détail pour :
              </span>
              <div style={{
                display: 'flex',
                background: 'var(--bg-secondary)',
                padding: 4,
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <button
                  onClick={() => setSelectedModel('xlm')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: selectedModel === 'xlm' ? 'var(--bg-card)' : 'transparent',
                    color: selectedModel === 'xlm' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: selectedModel === 'xlm' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: selectedModel === 'xlm' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  XLM-RoBERTa
                </button>
                <button
                  onClick={() => setSelectedModel('camembert')}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: selectedModel === 'camembert' ? 'var(--bg-card)' : 'transparent',
                    color: selectedModel === 'camembert' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: selectedModel === 'camembert' ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: selectedModel === 'camembert' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  CamemBERT (BERT)
                </button>
              </div>

              <button
                onClick={handleRunEvaluation}
                disabled={evaluating}
                style={{
                  marginLeft: 'auto',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: evaluating ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
                }}
              >
                <RefreshCw size={14} className={evaluating ? "spinning-loader" : ""} />
                {evaluating ? "Évaluation en cours..." : "Relancer l'évaluation en direct"}
              </button>
            </div>

            {activeModelPerf ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

                {/* Métriques globales et Tableau */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Cartes métriques */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ padding: 18, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Précision Globale</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)', margin: '6px 0' }}>
                        {(activeModelPerf.accuracy * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exactitude totale des prédictions</div>
                    </div>
                    <div style={{ padding: 18, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>F1-Score Moyen</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)', margin: '6px 0' }}>
                        {(activeModelPerf.f1_score * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Moyenne harmonique pondérée</div>
                    </div>
                  </div>

                  {/* Rapport de classification */}
                  <div style={{ padding: 20, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14 }}>Rapport détaillé de classification ({selectedModel.toUpperCase()})</h4>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Sentiment</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Précision</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Rappel</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>F1-Score</th>
                            <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>Support</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(activeModelPerf.class_metrics || {}).map(name => {
                            const val = activeModelPerf.class_metrics[name];
                            return (
                              <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ textAlign: 'left', padding: '10px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{name}</td>
                                <td style={{ textAlign: 'right', padding: '10px 10px', color: 'var(--text-secondary)' }}>{(val.precision * 100).toFixed(0)}%</td>
                                <td style={{ textAlign: 'right', padding: '10px 10px', color: 'var(--text-secondary)' }}>{(val.recall * 100).toFixed(0)}%</td>
                                <td style={{ textAlign: 'right', padding: '10px 10px', fontWeight: 700, color: 'var(--accent)' }}>{(val.f1_score * 100).toFixed(0)}%</td>
                                <td style={{ textAlign: 'right', padding: '10px 10px', color: 'var(--text-muted)' }}>{val.support}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: 16, fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Taille globale du Dataset : <strong>{activeModelPerf.total_samples}</strong> exemples</span>
                      <span>Évalués sur : <strong>{activeModelPerf.test_samples}</strong> exemples</span>
                    </div>
                  </div>
                </div>

                {/* Graphique de la matrice de confusion */}
                <div style={{ padding: 20, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, alignSelf: 'flex-start', marginBottom: 14 }}>Graphique : Matrice de Confusion ({selectedModel.toUpperCase()})</h4>

                  <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                    {cmImage ? (
                      <img
                        src={cmImage}
                        alt="Matrice de Confusion du Modèle de Sentiment"
                        style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Chargement de la matrice...
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 14, textAlign: 'center', lineHeight: '1.4' }}>
                    Les lignes représentent les vrais sentiments et les colonnes représentent les sentiments prédits par le modèle.
                    Une diagonale forte indique un modèle hautement performant.
                  </p>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spinning-loader" style={{ marginBottom: 10 }} />
                <div>Chargement des performances du modèle...</div>
              </div>
            )}
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

  if (user?.role === 'admin') return <DashboardAdmin />;
  if (user?.role === 'rh') return <DashboardRH />;
  return <DashboardEmploye />;
};

export { DashboardEmploye, DashboardRH, DashboardAdmin };
export default DashboardRouter;
