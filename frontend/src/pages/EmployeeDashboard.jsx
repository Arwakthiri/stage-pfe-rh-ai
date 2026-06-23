import { useTranslation } from 'react-i18next';
import { MessageSquare, BookOpen, ClipboardList, Bell, TrendingUp, Heart, Star, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ── Wellbeing Score Card ──────────────────────────────────── */
const WellbeingCard = ({ label, value, color, icon }) => (
  <div className="stat-card" style={{ gap: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="stat-icon" style={{ width: 40, height: 40, background: color }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <span className="stat-value" style={{ fontSize: '1.8rem' }}>{value}</span>
    </div>
    <div style={{
      height: 6, borderRadius: 99,
      background: 'var(--bg-input)',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: value,
        background: color,
        borderRadius: 99,
        transition: 'width 1s ease',
      }} />
    </div>
  </div>
);

/* ── Formation Card ───────────────────────────────────────── */
const FormationCard = ({ title, duration, progress, color }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px 16px',
    background: 'var(--bg-input)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    transition: 'all 0.2s',
    cursor: 'pointer',
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
  >
    <div style={{
      width: 42, height: 42, borderRadius: 10,
      background: color, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <BookOpen size={18} color="#fff" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{duration}</div>
      <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', marginTop: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: 99 }} />
      </div>
    </div>
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>{progress}%</span>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   EMPLOYEE DASHBOARD
══════════════════════════════════════════════════════════════ */
const EmployeeDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const firstName = user?.full_name?.split(' ')[0] || 'Collaborateur';

  const notifications = [
    { id: 1, text: 'Enquête de satisfaction disponible', type: 'info', time: 'Il y a 2h' },
    { id: 2, text: 'Nouvelle formation recommandée par l\'IA', type: 'success', time: 'Il y a 5h' },
    { id: 3, text: 'Rappel : entretien annuel cette semaine', type: 'warning', time: 'Hier' },
  ];

  const formations = [
    { title: 'Gestion du stress au travail', duration: '45 min · 6 modules', progress: 60, color: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { title: 'Communication efficace en équipe', duration: '30 min · 4 modules', progress: 25, color: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
    { title: 'Résolution de conflits', duration: '1h · 8 modules', progress: 0, color: 'linear-gradient(135deg,#10b981,#059669)' },
  ];

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="page-header" style={{ marginBottom: 28 }}>
          <h1>Bonjour, {firstName} 👋</h1>
          <p>Voici votre tableau de bord personnel — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>

        {/* ── Wellbeing Score ──────────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Mon score de bien-être
          </span>
        </div>
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <WellbeingCard
            label="Satisfaction"
            value="82%"
            color="linear-gradient(135deg,#10b981,#059669)"
            icon={<Heart size={18} color="#fff" />}
          />
          <WellbeingCard
            label="Niveau de stress"
            value="30%"
            color="linear-gradient(135deg,#f59e0b,#d97706)"
            icon={<TrendingUp size={18} color="#fff" />}
          />
          <WellbeingCard
            label="Engagement"
            value="75%"
            color="linear-gradient(135deg,#6366f1,#8b5cf6)"
            icon={<Star size={18} color="#fff" />}
          />
        </div>

        {/* ── Main Grid ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Chatbot CTA */}
          <div style={{
            background: 'var(--accent-grad)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: 'var(--accent-glow)',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <MessageSquare size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                Assistant RH IA
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
                Posez vos questions RH, obtenez une aide personnalisée
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 14px', borderRadius: 99,
                fontSize: '0.82rem', fontWeight: 700, color: '#fff',
              }}>
                Démarrer une conversation <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
              <span style={{
                marginLeft: 'auto', background: 'var(--accent-grad)',
                color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                padding: '2px 8px', borderRadius: 99,
              }}>{notifications.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 'var(--radius-md)',
                  background: n.type === 'info' ? 'rgba(6,182,212,0.08)' :
                    n.type === 'success' ? 'rgba(16,185,129,0.08)' :
                      'rgba(245,158,11,0.08)',
                  border: `1px solid ${n.type === 'info' ? 'rgba(6,182,212,0.2)' :
                    n.type === 'success' ? 'rgba(16,185,129,0.2)' :
                      'rgba(245,158,11,0.2)'}`,
                }}>
                  <span style={{ fontSize: '1rem' }}>
                    {n.type === 'info' ? 'ℹ️' : n.type === 'success' ? '✅' : '⚠️'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 500 }}>{n.text}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Formations */}
          <div className="glass" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BookOpen size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mes formations</span>
              <span style={{
                marginLeft: 'auto', fontSize: '0.78rem',
                color: 'var(--accent)', fontWeight: 600, cursor: 'pointer',
              }}>Voir tout →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {formations.map((f, i) => (
                <FormationCard key={i} {...f} />
              ))}
            </div>
          </div>

          {/* Enquêtes */}
          <div className="glass" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ClipboardList size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Mes enquêtes</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { title: 'Enquête satisfaction mensuelle', status: 'En attente', deadline: 'Avant le 30 juin', urgent: true },
                { title: 'Qualité de vie au travail', status: 'Complétée', deadline: 'Terminée', urgent: false },
                { title: 'Retour formation Q2', status: 'En attente', deadline: 'Avant le 5 juillet', urgent: false },
              ].map((e, i) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${e.urgent ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: e.status === 'Complétée' ? 'var(--success)' :
                      e.urgent ? 'var(--danger)' : 'var(--warning)',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.title}</div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>{e.deadline}</div>
                  </div>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600, padding: '3px 9px', borderRadius: 99,
                    background: e.status === 'Complétée' ? 'rgba(16,185,129,0.12)' :
                      e.urgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                    color: e.status === 'Complétée' ? 'var(--success)' :
                      e.urgent ? 'var(--danger)' : 'var(--warning)',
                  }}>{e.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default EmployeeDashboard;
