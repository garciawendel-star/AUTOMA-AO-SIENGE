import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User as UserIcon, ShieldCheck } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, users } = useApp();
  const [username, setUsername] = useState('wendel');
  const [password, setPassword] = useState('omega123');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const success = login(username, password);
    if (!success) {
      setErrorMsg('Credenciais inválidas. Verifique usuário e senha.');
    }
  };

  const fillQuickLogin = (uname: string) => {
    setUsername(uname);
    const targetUser = users[uname];
    if (targetUser && targetUser.password) {
      setPassword(targetUser.password);
    } else {
      if (uname === 'wendel') setPassword('omega123');
      else if (uname === 'dangelo' || uname === 'romualdo') setPassword('gestor123');
      else if (uname === 'comprador') setPassword('compras123');
      else if (uname === 'engenharia') setPassword('obra123');
    }
    setErrorMsg('');
  };

  return (
    <div className="login-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-card">
        <div className="login-header">
          <img src="/app_icon.png" alt="Omega Construtora" style={{ width: 44, height: 44, borderRadius: 8 }} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              OMEGA CONSTRUTORA
            </h2>
            <p style={{ fontSize: 12, color: '#C58B38', fontWeight: 700, letterSpacing: '0.6px', marginTop: 2 }}>
              ACESSO RESTRITO &bull; PLATAFORMA DE SUPRIMENTOS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label htmlFor="login-username" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Usuário:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="login-username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: wendel, dangelo, romualdo..."
                required
                style={{ width: '100%', paddingLeft: 36 }}
              />
              <UserIcon size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Senha:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="login-password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha pessoal"
                required
                style={{ width: '100%', paddingLeft: 36 }}
              />
              <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                color: '#f87171',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: 8,
                borderRadius: 6,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-omega"
            style={{ width: '100%', justifyContent: 'center', padding: 12, fontSize: 14, fontWeight: 700 }}
          >
            <ShieldCheck size={18} />
            Entrar na Plataforma
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8 }}>
            Selecionar Perfil Rápido:
          </div>
          <div className="login-quick-profiles" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            <span className="quick-profile-chip" onClick={() => fillQuickLogin('wendel')} style={{ cursor: 'pointer' }}>
              👑 Wendel (Admin)
            </span>
            <span className="quick-profile-chip" onClick={() => fillQuickLogin('dangelo')} style={{ cursor: 'pointer' }}>
              👔 Dangelo (Gestor)
            </span>
            <span className="quick-profile-chip" onClick={() => fillQuickLogin('romualdo')} style={{ cursor: 'pointer' }}>
              👔 Romualdo (Gestor)
            </span>
            <span className="quick-profile-chip" onClick={() => fillQuickLogin('comprador')} style={{ cursor: 'pointer' }}>
              📦 Comprador
            </span>
            <span className="quick-profile-chip" onClick={() => fillQuickLogin('engenharia')} style={{ cursor: 'pointer' }}>
              🏗️ Engenharia
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
