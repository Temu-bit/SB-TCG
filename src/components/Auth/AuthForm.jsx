import { useState } from 'react';
import { registerUser, loginUser } from '../../firebase/auth';
import logo from '../../assets/logo.png';
import './Auth.css';

const AuthForm = ({ onSuccess, onRegisterStart }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        onRegisterStart?.();
        if (!form.displayName.trim()) throw new Error('Bitte gib einen Namen ein.');
        await registerUser(form.email, form.password, form.displayName);
        setSuccessMsg('Konto wurde erfolgreich erstellt! Du kannst dich jetzt einloggen.');
        setMode('login');
        setForm(f => ({ ...f, password: '' })); // Passwort-Feld leeren
      } else {
        await loginUser(form.email, form.password);
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form glass-elevated">
      {/* Header */}
      <div className="auth-form__header">
        <img src={logo} alt="Santa-Blanca Logo" className="auth-form__logo" />
        <h1 className="auth-form__title text-gradient">Santa-Blanca TCG</h1>
        <p className="auth-form__subtitle">
          {mode === 'login' ? 'Willkommen zurück, Trainer!' : 'Starte deine Sammlung!'}
        </p>
      </div>

      {/* Tab Switch */}
      <div className="auth-form__tabs">
        <button
          className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
          onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
          type="button"
        >
          Login
        </button>
        <button
          className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
          onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
          type="button"
        >
          Registrieren
        </button>
      </div>

      {/* Form */}
      <form className="auth-form__body" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="auth-form__field">
            <label>Dein Name</label>
            <input
              className="input"
              name="displayName"
              type="text"
              placeholder="z.B. ShadowTrainer99"
              value={form.displayName}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="auth-form__field">
          <label>E-Mail</label>
          <input
            className="input"
            name="email"
            type="email"
            placeholder="deine@email.de"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-form__field">
          <label>Passwort</label>
          <input
            className="input"
            name="password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        {error && <div className="auth-form__error">{error}</div>}
        {successMsg && <div className="auth-form__success" style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--rarity-uncommon)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', border: '1px solid rgba(74,222,128,0.4)', textAlign: 'center' }}>{successMsg}</div>}

        {mode === 'register' && (
          <div className="auth-form__bonus">
            🎁 Du erhältst <strong>3 gratis Booster-Packs</strong> zum Start!
          </div>
        )}

        <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
          {loading ? '⏳ Laden...' : mode === 'login' ? '🚀 Einloggen' : '✨ Konto erstellen'}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
