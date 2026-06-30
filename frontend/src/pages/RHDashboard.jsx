import { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingUp, TrendingDown, Bell, Eye, BarChart2, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api/axios';

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
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [summaryRes, alertsRes, employeesRes] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/alerts'),
          api.get('/api/analytics/employees')
        ]);
        setSummary(summaryRes.data);
        setAlerts(alertsRes.data);
        setEmployees(employeesRes.data);
        setError(null);
      } catch (err) {
        console.error("Erreur de chargement du tableau de bord RH:", err);
        setError("Impossible de récupérer les données analytiques en temps réel.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Transformation des statistiques de sentiments par département
  const getProcessedDeptStats = () => {
    if (!summary || !summary.department_stats || summary.department_stats.length === 0) {
      return [
        { dept: 'Ingénierie', score: 82, employees: 38 },
        { dept: 'Marketing', score: 71, employees: 22 },
        { dept: 'Finance', score: 78, employees: 18 },
        { dept: 'RH', score: 88, employees: 12 },
        { dept: 'Commercial', score: 65, employees: 34 },
      ];
    }

    const weights = {
      'Positif': 100,
      'Neutre': 70,
      'Stressé': 30,
      'Frustré': 20,
      'Colère': 0
    };

    const deptsMap = {};
    summary.department_stats.forEach(stat => {
      const { department, sentiment, count } = stat;
      const deptName = department || 'Général';
      if (!deptsMap[deptName]) {
        deptsMap[deptName] = { totalWeight: 0, totalCount: 0 };
      }
      const weight = weights[sentiment] ?? 70;
      deptsMap[deptName].totalWeight += weight * count;
      deptsMap[deptName].totalCount += count;
    });

    return Object.keys(deptsMap).map(dept => {
      const { totalWeight, totalCount } = deptsMap[dept];
      const score = totalCount > 0 ? Math.round(totalWeight / totalCount) : 75;
      return {
        dept,
        score,
        employees: totalCount
      };
    });
  };

  // Calcul de la répartition globale des sentiments
  const getGlobalSentimentBreakdown = () => {
    if (!summary || !summary.department_stats || summary.department_stats.length === 0) {
      return [
        { label: 'Engagés', pct: 68, c: '#6366f1' },
        { label: 'Stressés', pct: 22, c: '#f59e0b' },
        { label: 'À risque', pct: 12, c: '#ef4444' }
      ];
    }

    let positive = 0, stressed = 0, risk = 0, total = 0;
    summary.department_stats.forEach(stat => {
      const { sentiment, count } = stat;
      total += count;
      if (sentiment === 'Positif') positive += count;
      else if (sentiment === 'Stressé' || sentiment === 'Frustré') stressed += count;
      else if (sentiment === 'Colère') risk += count;
    });

    if (total === 0) {
      return [
        { label: 'Engagés', pct: 70, c: '#6366f1' },
        { label: 'Stressés', pct: 20, c: '#f59e0b' },
        { label: 'À risque', pct: 10, c: '#ef4444' }
      ];
    }

    return [
      { label: 'Engagés', pct: Math.round((positive / total) * 100), c: '#6366f1' },
      { label: 'Stressés', pct: Math.round((stressed / total) * 100), c: '#f59e0b' },
      { label: 'À risque', pct: Math.round((risk / total) * 100), c: '#ef4444' }
    ];
  };

  const tabs = [
    { id: 'alertes', label: '🚨 Alertes IA' },
    { id: 'employes', label: '👥 Employés' },
    { id: 'enquetes', label: '📋 Enquêtes' },
  ];

  if (loading) {
    return (
      <div className="app-layout">
        <Navbar />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spinning-loader {
            animation: spin 1.2s linear infinite;
          }
        `}</style>
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <RefreshCw className="spinning-loader" size={36} color="var(--accent)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Analyse et calcul des indicateurs de bien-être en cours...
            </span>
          </div>
        </main>
      </div>
    );
  }

  const finalSummary = summary || {
    global_wellbeing_score: 76,
    active_alerts_count: 8,
    burnout_risk_percentage: 12,
    total_employees: 124
  };

  const processedDeptStats = getProcessedDeptStats();
  const globalSentimentBreakdown = getGlobalSentimentBreakdown();

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        
        {/* ── Header ─────────────────────────────────────── */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <h1>Tableau de bord RH</h1>
          <p>Bienvenue, {user?.full_name} · Analyse en temps réel du bien-être des collaborateurs</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--danger)',
            border: '1px solid rgba(239,68,68,0.2)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 24,
            fontSize: '0.86rem'
          }}>
            ⚠️ {error} (Utilisation des données locales de démonstration)
          </div>
        )}

        {/* ── KPIs ───────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <KPICard 
            label="Total collaborateurs" 
            value={finalSummary.total_employees}  
            sub="Actifs sur la plateforme"        
            icon={<Users size={18} color="#fff" />}         
            color="linear-gradient(135deg,#6366f1,#8b5cf6)" 
            trend="up" 
          />
          <KPICard 
            label="Score de bien-être"  
            value={`${finalSummary.global_wellbeing_score}%`}  
            sub="Moyenne générale" 
            icon={<BarChart2 size={18} color="#fff" />}    
            color="linear-gradient(135deg,#10b981,#059669)" 
            trend={finalSummary.global_wellbeing_score >= 70 ? "up" : "down"} 
          />
          <KPICard 
            label="Risque de burnout"     
            value={`${finalSummary.burnout_risk_percentage}%`}  
            sub="Signalements de stress"  
            icon={<AlertTriangle size={18} color="#fff" />} 
            color="linear-gradient(135deg,#f59e0b,#d97706)" 
            trend={finalSummary.burnout_risk_percentage > 15 ? "up" : "down"} 
          />
          <KPICard 
            label="Alertes actives"       
            value={finalSummary.active_alerts_count}    
            sub="Cas à analyser"         
            icon={<Bell size={18} color="#fff" />}          
            color="linear-gradient(135deg,#ef4444,#dc2626)" 
            trend="up" 
          />
        </div>

        {/* ── Score global ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>

          {/* Score global */}
          <div className="glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score global bien-être</div>
            <div style={{ position: 'relative', width: 130, height: 130 }}>
              <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  fill="none" 
                  stroke="url(#grad)" 
                  strokeWidth="10"
                  strokeDasharray={`${(finalSummary.global_wellbeing_score / 100) * 314} 314`} 
                  strokeLinecap="round" 
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>{finalSummary.global_wellbeing_score}%</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Satisfaits</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              {globalSentimentBreakdown.map(r => (
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
              {processedDeptStats.map(d => (
                <div key={d.dept} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 100, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{d.dept}</div>
                  <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'var(--bg-input)', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${d.score}%`, 
                      borderRadius: 99, 
                      background: d.score >= 80 ? 'linear-gradient(90deg,#10b981,#059669)' : d.score >= 70 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)', 
                      transition: 'width 1s ease' 
                    }} />
                  </div>
                  <div style={{ width: 36, textAlign: 'right', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{d.score}%</div>
                  <div style={{ width: 52, textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{d.employees} msg.</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="glass" style={{ padding: '0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                style={{
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '0.88rem', fontWeight: 600,
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px' }}>
            {activeTab === 'alertes' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Collaborateur', 'Signal détecté', 'Score sat.', 'Risque', 'Action'].map(h => (
                      <th 
                        key={h} 
                        style={{ 
                          padding: '10px 14px', 
                          textAlign: h === 'Score sat.' ? 'center' : 'left', 
                          fontSize: '0.76rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.08em', 
                          color: 'var(--text-muted)', 
                          borderBottom: '1px solid var(--border)' 
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Aucun signal d'alerte détecté actuellement.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((a, i) => <AlertRow key={i} {...a} />)
                  )}
                </tbody>
              </table>
            )}
            
            {activeTab === 'employes' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Nom', 'Email', 'Département', 'Statut'].map(h => (
                      <th 
                        key={h} 
                        style={{ 
                          padding: '10px 14px', 
                          textAlign: 'left', 
                          fontSize: '0.76rem', 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.08em', 
                          color: 'var(--text-muted)', 
                          borderBottom: '1px solid var(--border)' 
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Aucun collaborateur enregistré en base de données.
                      </td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {emp.full_name.charAt(0)}
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.full_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{emp.email}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{emp.department || "Général"}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: emp.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: emp.is_active ? 'var(--success)' : 'var(--danger)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 99
                          }}>
                            {emp.is_active ? "Actif" : "Inactif"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'enquetes' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '10px 0' }}>
                {[
                  { title: 'Enquête Q2 - Qualité de vie au travail (QVT)', status: 'Complétée', responseRate: '84%', date: 'Fermée le 15 Juin 2026' },
                  { title: 'Évaluation des outils collaboratifs', status: 'En cours', responseRate: '56%', date: 'Clôture le 30 Juin 2026' },
                  { title: 'Enquête stress et surcharge d\'activité', status: 'En cours', responseRate: '42%', date: 'Clôture le 5 Juillet 2026' },
                  { title: 'Besoins en formation 2026', status: 'Planifiée', responseRate: '0%', date: 'Lancement le 1 Septembre 2026' },
                ].map((survey, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        background: survey.status === 'Complétée' ? 'rgba(16,185,129,0.12)' : survey.status === 'En cours' ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.12)',
                        color: survey.status === 'Complétée' ? 'var(--success)' : survey.status === 'En cours' ? 'var(--warning)' : 'var(--text-muted)',
                        fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99
                      }}>{survey.status}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Taux de réponse : <strong>{survey.responseRate}</strong></span>
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0' }}>{survey.title}</h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{survey.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default RHDashboard;
