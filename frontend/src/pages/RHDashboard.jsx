import { useState } from 'react';
import { Users, AlertTriangle, TrendingUp, TrendingDown, Bell, Eye, BarChart2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ── KPI Card ────────────────────────────────────────────── */
const KPICard = ({ label, value, sub, icon, color, trend }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>{label}</div>
        <div className="stat-value" style={{ fontSize: '2rem', marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'up' && <TrendingUp size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {sub}
        </div>
      </div>
      <div className="stat-icon" style={{ background: color }}>
        {icon}
      </div>
    </div>
  </div>
);

/* ── Alert Row ───────────────────────────────────────────── */
const AlertRow = ({ name, dept, risk, reason, score }) => {
  const riskColor = risk === 'Élevé' ? 'var(--danger)' : risk === 'Moyen' ? 'var(--warning)' : 'var(--success)';
  const riskBg   = risk === 'Élevé' ? 'rgba(239,68,68,0.1)' : risk === 'Moyen' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{dept}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{reason}</div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: riskColor }}>{score}%</div>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ background: riskBg, color: riskColor, fontSize: '0.74rem', fontWeight: 700, padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap' }}>
          {risk}
        </span>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <button style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 12px', fontSize: '0.78rem', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Eye size={13} /> Voir
        </button>
      </td>
    </tr>
  );
};

/* ══════════════════════════════════════════════════════════════
   RH DASHBOARD
══════════════════════════════════════════════════════════════ */
const RHDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alertes');

  const alerts = [
    { name: 'Ahmed Ben Ali',  dept: 'Ingénierie',  risk: 'Élevé',  reason: 'Heures supp. élevées + satisfaction faible', score: 78 },
    { name: 'Sara Mansouri',  dept: 'Marketing',   risk: 'Moyen',  reason: 'Baisse d\'interaction + absences récurrentes', score: 55 },
    { name: 'Karim Trabelsi', dept: 'RH',          risk: 'Moyen',  reason: 'Réponses négatives au chatbot', score: 51 },
    { name: 'Leila Hamdi',    dept: 'Finance',     risk: 'Faible', reason: 'Indicateurs stables', score: 88 },
  ];

  const tabs = [
    { id: 'alertes',  label: '🚨 Alertes IA' },
    { id: 'employes', label: '👥 Employés' },
    { id: 'enquetes', label: '📋 Enquêtes' },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <h1>Tableau de bord RH</h1>
          <p>Bienvenue, {user?.full_name} · Analyse en temps réel du bien-être des collaborateurs</p>
        </div>

        {/* ── KPIs ───────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <KPICard label="Total collaborateurs" value="124"  sub="+3 ce mois"        icon={<Users size={18} color="#fff" />}         color="linear-gradient(135deg,#6366f1,#8b5cf6)" trend="up" />
          <KPICard label="Taux de satisfaction"  value="76%"  sub="-2% vs mois dernier" icon={<BarChart2 size={18} color="#fff" />}    color="linear-gradient(135deg,#10b981,#059669)" trend="down" />
          <KPICard label="Risque de burnout"     value="12%"  sub="15 collaborateurs"  icon={<AlertTriangle size={18} color="#fff" />} color="linear-gradient(135deg,#f59e0b,#d97706)" trend="up" />
          <KPICard label="Alertes actives"       value="8"    sub="3 urgentes"         icon={<Bell size={18} color="#fff" />}          color="linear-gradient(135deg,#ef4444,#dc2626)" trend="up" />
        </div>

        {/* ── Score global ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>

          {/* Score global */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score global bien-être</div>
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#grad)" strokeWidth="10"
                  strokeDasharray={`${0.76 * 314} ${314}`} strokeLinecap="round" />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>76%</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Satisfaits</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              {[{ label: 'Engagés', pct: 68, c: '#6366f1' }, { label: 'Stressés', pct: 22, c: '#f59e0b' }, { label: 'À risque', pct: 12, c: '#ef4444' }].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.c, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)', flex: 1 }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Satisfaction par département */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 18 }}>Satisfaction par département</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { dept: 'Ingénierie',    score: 82, employees: 38 },
                { dept: 'Marketing',     score: 71, employees: 22 },
                { dept: 'Finance',       score: 78, employees: 18 },
                { dept: 'RH',           score: 88, employees: 12 },
                { dept: 'Commercial',   score: 65, employees: 34 },
              ].map(d => (
                <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{d.dept}</div>
                  <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-input)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${d.score}%`, borderRadius: 99, background: d.score >= 80 ? 'linear-gradient(90deg,#10b981,#059669)' : d.score >= 70 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ width: 36, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.score}%</div>
                  <div style={{ width: 52, textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{d.employees} emp.</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="glass" style={{ padding: '0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600,
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s',
              }}>{tab.label}</button>
            ))}
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'alertes' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Collaborateur', 'Signal détecté', 'Score sat.', 'Risque', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Score sat.' ? 'center' : 'left', fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => <AlertRow key={i} {...a} />)}
                </tbody>
              </table>
            )}
            {activeTab === 'employes' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div>Liste des employés — à connecter à l'API</div>
              </div>
            )}
            {activeTab === 'enquetes' && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <CheckCircle size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <div>Gestion des enquêtes — à connecter à l'API</div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default RHDashboard;
