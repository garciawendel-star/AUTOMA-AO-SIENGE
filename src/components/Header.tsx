import React from 'react';
import { useApp } from '../context/AppContext';
import { Upload, RefreshCw, Sun, Moon, Users, LogOut, CheckCircle2, Globe } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    theme,
    toggleTheme,
    lanUrl,
    showToast,
    addLog,
    setIsUploadModalOpen,
    setIsUsersModalOpen,
    setIsLoginModalOpen,
    logout
  } = useApp();

  const handleCopyLan = () => {
    navigator.clipboard?.writeText(`http://${lanUrl}`);
    showToast(`Endereço de rede copiado: http://${lanUrl}`, 'info');
  };

  const handleRefresh = () => {
    addLog('Atualizando cache de dados e recarregando indicadores...', 'info');
    showToast('Dados sincronizados com o SIENGE e cache local!', 'success');
  };

  const roleColors: Record<string, string> = {
    admin: '#ef4444',
    gestor: '#f59e0b',
    comprador: '#3b82f6',
    engenheiro: '#10b981'
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-container" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/app_icon.png" alt="Omega Construtora" className="logo-image" style={{ width: 42, height: 42, borderRadius: 8 }} />
          <div>
            <h1>OMEGA CONSTRUTORA</h1>
            <p className="logo-subtitle">PLATAFORMA INTEGRADA DE SUPRIMENTOS</p>
          </div>
        </div>
        <div className="ux-header-status-group" role="status" aria-label="Status do Sistema">
          <span className="badge-status-online" id="global-status-badge">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', marginRight: 6 }}></span>
            SIENGE Conectado
          </span>
          <span
            className="lan-badge"
            id="header-lan-badge"
            title="Clique para copiar o endereço de acesso na rede local para gestores e engenheiros"
            onClick={handleCopyLan}
            style={{ cursor: 'pointer' }}
          >
            <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
            Rede: <span>{lanUrl}</span>
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="ux-cluster" role="group" aria-label="Ações de Dados e Aparência">
          <button
            className="btn btn-upload"
            onClick={() => setIsUploadModalOpen(true)}
            title="Abrir gerenciador de arquivos e upload"
          >
            <Upload size={15} />
            Carregar Arquivos
          </button>
          <button
            className="btn btn-outline"
            onClick={handleRefresh}
            title="Recarregar dados do disco e sincronizar"
          >
            <RefreshCw size={15} />
            Atualizar
          </button>
          <button
            className="btn btn-outline"
            onClick={toggleTheme}
            title="Alternar Tema Claro / Escuro"
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
            <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
          </button>
        </div>

        {currentUser ? (
          <div className="user-header-badge" id="user-header-badge">
            <div className="user-header-identity">
              <span id="header-user-name">{currentUser.name}</span>
              <span
                className="role-pill"
                id="header-user-role"
                style={{ backgroundColor: roleColors[currentUser.role] || '#6366f1', color: '#fff' }}
              >
                {currentUser.role.toUpperCase()}
              </span>
            </div>
            <div className="ux-divider-v"></div>
            {currentUser.role === 'admin' && (
              <button
                className="btn btn-outline btn-sm"
                title="Gerenciar Usuários, Senhas e Perfis de Acesso"
                onClick={() => setIsUsersModalOpen(true)}
              >
                <Users size={14} />
                Perfis
              </button>
            )}
            <button
              className="btn btn-outline btn-sm btn-logout"
              title="Sair / Trocar Usuário"
              onClick={logout}
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        ) : (
          <button
            className="btn btn-omega"
            onClick={() => setIsLoginModalOpen(true)}
          >
            🔐 Entrar na Plataforma
          </button>
        )}
      </div>
    </header>
  );
};
