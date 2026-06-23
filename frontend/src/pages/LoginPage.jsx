import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import segulaLogo from '../assets/segula-logo.png';
import './LoginPage.css';

/* ── Google SVG ──────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── Microsoft Icon ──────────────────────────────────────────── */
const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="0"  y="0"  width="10" height="10" fill="#F25022"/>
    <rect x="11" y="0"  width="10" height="10" fill="#7FBA00"/>
    <rect x="0"  y="11" width="10" height="10" fill="#00A4EF"/>
    <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
  </svg>
);

/* ── Language Switcher ───────────────────────────────────────── */
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <div className="lang-switcher">
      {[{ code: 'fr', label: 'FR' }, { code: 'en', label: 'EN' }, { code: 'ar', label: 'AR' }].map(({ code, label }) => (
        <button key={code} className={`lang-btn ${i18n.language === code ? 'active' : ''}`}
          onClick={() => i18n.changeLanguage(code)}>
          {label}
        </button>
      ))}
    </div>
  );
};

/* ── Theme Toggle ────────────────────────────────────────────── */
const ThemeToggleBtn = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button className="theme-toggle-btn" onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

/* ── Request Access Modal ────────────────────────────────────── */
const RequestAccessModal = ({ onClose }) => {
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent]   = useState(false);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
          Demander un accès
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginBottom: 22 }}>
          Votre demande sera transmise à l'administrateur RH.
        </p>

        {sent ? (
          <div style={{ padding: '13px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 8, color: '#16a34a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ Demande envoyée avec succès !
          </div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); setSent(true); setTimeout(onClose, 2000); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Nom complet', val: name, set: setName, type: 'text', ph: 'Votre nom complet' },
              { label: 'Email professionnel', val: email, set: setEmail, type: 'email', ph: 'votre@email.com' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{f.label}</label>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)}
                  placeholder={f.ph} required
                  style={{ padding: '10px 12px', borderRadius: 7, border: '1.5px solid #d1d5db',
                    fontSize: '0.86rem', outline: 'none', fontFamily: 'inherit', color: '#111827' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '10px', borderRadius: 7, border: '1.5px solid #d1d5db',
                  background: '#f9fafb', color: '#374151', fontSize: '0.85rem', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button type="submit"
                style={{ flex: 1, padding: '10px', borderRadius: 7, border: 'none',
                  background: '#e8192c', color: '#fff',
                  fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Envoyer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   LOGIN PAGE  —  SEGULA layout, adapted for RH Platform IA
══════════════════════════════════════════════════════════════ */
const LoginPage = () => {
  const { t }      = useTranslation();
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const s = err?.response?.status;
      const d = err?.response?.data?.detail;
      if (s === 429) setError(t('login.tooManyAttempts'));
      else if (s === 403) setError(t('login.accountDisabled'));
      else setError(d || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ════════════════════════════════════
          LEFT — Dark photo background
      ════════════════════════════════════ */}
      <div className="login-left">
        <div className="login-left-photo" />
        <div className="login-left-overlay" />
        <div className="login-left-bottom-grad" />

        {/* Logo — top left */}
        <div className="login-logo">
          <img src={segulaLogo} alt="Segula Technologies" className="login-segula-logo" />
        </div>

        {/* Tagline — bottom left, like "Concevoir l'avenir ensemble" */}
        <div className="login-tagline">
          <h2>
            {t('login.tagline1')}<br />
            <span className="highlight">{t('login.tagline2')}</span>
          </h2>
          <p>{t('login.taglineDesc')}</p>
          <div className="login-footer-left">
            © {new Date().getFullYear()} SEGULA Technologies. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          RIGHT — ALWAYS WHITE FORM PANEL
      ════════════════════════════════════ */}
      <div className="login-right">

        {/* Lang + theme controls */}
        <div className="login-controls">
          <LanguageSwitcher />
          <ThemeToggleBtn />
        </div>

        {/* Header — exactly like SEGULA */}
        <div className="login-form-header">
          <span className="pre-title">Bienvenue chez</span>
          <h1>
            <span className="brand-name">SEGULA </span>
            <span className="brand-accent">Technologies</span>
          </h1>
          {/* Red underline — like SEGULA signature */}
          <span className="login-title-underline" />
          <p className="subtitle">{t('login.subtitle')}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Email — icon on RIGHT like SEGULA */}
          <div className="lf-group">
            <label className="lf-label">{t('login.email')}</label>
            <div className="lf-input-wrap">
              <input
                id="login-email"
                className="lf-input"
                type="email"
                name="email"
                autoComplete="email"
                placeholder={t('login.emailPlaceholder')}
                value={form.email}
                onChange={handleChange}
                required
              />
              <span className="lf-icon-right">
                <Mail size={15} />
              </span>
            </div>
          </div>

          {/* Password — icon on RIGHT like SEGULA */}
          <div className="lf-group">
            <label className="lf-label">{t('login.password')}</label>
            <div className="lf-input-wrap">
              <input
                id="login-password"
                className="lf-input"
                type={showPass ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder={t('login.passwordPlaceholder')}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="lf-icon-right"
                onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot — like SEGULA */}
          <div className="login-remember-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={remember}
                onChange={e => setRemember(e.target.checked)} />
              {t('login.rememberMe')}
            </label>
            <a href="#" className="forgot-link">{t('login.forgotPassword')}</a>
          </div>

          {/* Submit button — colored, full width, arrow → */}
          <button
            id="login-submit-btn"
            type="submit"
            className="login-btn-submit"
            disabled={loading || !form.email || !form.password}
          >
            {loading ? (
              <>
                <span style={{ display:'inline-block', width:15, height:15,
                  border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff',
                  borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                {t('login.connecting')}
              </>
            ) : (
              <>{t('login.loginButton')} &nbsp;→</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="login-divider" style={{ margin: '18px 0' }}>
          {t('login.orContinueWith')}
        </div>

        {/* Social buttons — side by side like SEGULA */}
        <div className="social-btns">
          <button className="social-btn" type="button"
            onClick={() => alert('Microsoft OAuth : à configurer.')}>
            <MicrosoftIcon />
            Microsoft 365
          </button>
          <button id="google-login-btn" className="social-btn" type="button"
            onClick={() => alert('Google OAuth : ajoutez VITE_GOOGLE_CLIENT_ID dans .env')}>
            <GoogleIcon />
            Google
          </button>
        </div>

        {/* Request access */}
        <div className="request-access" style={{ marginTop: 20 }}>
          {t('login.requestAccess')}
          <a href="#" onClick={e => { e.preventDefault(); setShowModal(true); }}>
            {t('login.requestAccessLink')}
          </a>
        </div>
      </div>

      {showModal && <RequestAccessModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default LoginPage;
