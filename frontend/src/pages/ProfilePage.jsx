import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';

const ROLE_LABELS = { admin: 'Administrateur', rh: 'Responsable RH', employe: 'Employé' };

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  /* Profile form */
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    department: user?.department || '',
    phone: user?.phone || '',
  });
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoad, setProfileLoad] = useState(false);

  /* Password form */
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
  });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [passLoad, setPassLoad] = useState(false);
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);

  /* ── Update profile ──────────────────────────────────────── */
  const handleProfile = async (e) => {
    e.preventDefault();
    setProfileLoad(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const { data } = await api.put('/api/auth/me', profileForm);
      updateUser(data);
      setProfileMsg({ type: 'success', text: t('profile.updateSuccess') });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.detail || t('common.error') });
    }
    setProfileLoad(false);
  };

  /* ── Change password ─────────────────────────────────────── */
  const handlePassword = async (e) => {
    e.preventDefault();
    setPassLoad(true);
    setPassMsg({ type: '', text: '' });
    try {
      await api.post('/api/auth/change-password', passForm);
      setPassMsg({ type: 'success', text: t('profile.passwordSuccess') });
      setPassForm({ current_password: '', new_password: '' });
    } catch (err) {
      setPassMsg({ type: 'error', text: err?.response?.data?.detail || t('common.error') });
    }
    setPassLoad(false);
  };

  const card = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 28,
    backdropFilter: 'blur(10px)',
    marginBottom: 24,
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <h1>{t('profile.title')}</h1>
          <p>{user?.email}</p>
        </div>

        {/* Identity card (read-only) */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 800, color: '#fff',
              boxShadow: 'var(--accent-glow)',
            }}>
              {user?.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {ROLE_LABELS[user?.role]} • {user?.department || 'Aucun département'}
              </div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${user?.is_active ? 'badge-active' : 'badge-inactive'}`}>
                  {user?.is_active ? 'Compte actif' : 'Compte inactif'}
                </span>
              </div>
            </div>
          </div>

          {/* Read-only info */}
          {[
            { label: t('profile.email'), value: user?.email },
            { label: t('profile.role'), value: ROLE_LABELS[user?.role] },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Edit profile */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <User size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Modifier mon profil</h2>
          </div>

          {profileMsg.text && (
            <div className={`alert alert-${profileMsg.type}`} style={{ marginBottom: 16 }}>
              {profileMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'full_name', label: t('profile.fullName'), type: 'text' },
              { name: 'department', label: t('profile.department'), type: 'text' },
              { name: 'phone', label: t('profile.phone'), type: 'text' },
            ].map(f => (
              <div className="form-group" key={f.name}>
                <label className="form-label">{f.label}</label>
                <input
                  className="form-input"
                  style={{ paddingLeft: 16 }}
                  type={f.type}
                  value={profileForm[f.name]}
                  onChange={e => setProfileForm(p => ({ ...p, [f.name]: e.target.value }))}
                />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" disabled={profileLoad}
              style={{ alignSelf: 'flex-start', padding: '11px 28px' }}>
              {profileLoad ? t('common.loading') : t('profile.save')}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Lock size={18} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{t('profile.changePassword')}</h2>
          </div>

          {passMsg.text && (
            <div className={`alert alert-${passMsg.type}`} style={{ marginBottom: 16 }}>
              {passMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Current */}
            <div className="form-group">
              <label className="form-label">{t('profile.currentPassword')}</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  className="form-input has-right-icon"
                  type={showCurr ? 'text' : 'password'}
                  value={passForm.current_password}
                  onChange={e => setPassForm(p => ({ ...p, current_password: e.target.value }))}
                  required
                />
                <button type="button" className="input-icon-right" onClick={() => setShowCurr(p => !p)}>
                  {showCurr ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {/* New */}
            <div className="form-group">
              <label className="form-label">{t('profile.newPassword')}</label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  className="form-input has-right-icon"
                  type={showNew ? 'text' : 'password'}
                  value={passForm.new_password}
                  onChange={e => setPassForm(p => ({ ...p, new_password: e.target.value }))}
                  required
                  minLength={8}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowNew(p => !p)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={passLoad}
              style={{ alignSelf: 'flex-start', padding: '11px 28px' }}>
              {passLoad ? t('common.loading') : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
