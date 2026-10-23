import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HubTab } from './components/tabs/HubTab';
import { MapasWebTab } from './components/tabs/MapasWebTab';
import { AgenteIaTab } from './components/tabs/AgenteIaTab';
import { SolicitacoesTab } from './components/tabs/SolicitacoesTab';
import { CancelamentoTab } from './components/tabs/CancelamentoTab';
import { ConfiguracoesTab } from './components/tabs/ConfiguracoesTab';
import { ConsoleStream } from './components/ConsoleStream';
import { LoginModal } from './components/modals/LoginModal';
import { UsersModal } from './components/modals/UsersModal';
import { UploadModal } from './components/modals/UploadModal';
import { ToastContainer } from './components/Toast';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMsg: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error?.message || 'Erro inesperado de renderização' };
  }

  handleResetCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, maxWidth: 600, margin: '60px auto', textAlign: 'center', background: '#1e293b', color: '#f8fafc', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Atualização de Estrutura de Dados Detectada</h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
            O cache local do navegador continha dados de uma versão anterior ({this.state.errorMsg}). Clique abaixo para sincronizar os dados atualizados.
          </p>
          <button
            onClick={this.handleResetCache}
            style={{ background: '#C58B38', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            Sincronizar e Recarregar Plataforma
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppContent: React.FC = () => {
  const { currentTab } = useApp();

  return (
    <AppErrorBoundary>
      <div className="app-container">
        {/* Header */}
        <Header />

        {/* Navigation tabs */}
        <Navigation />

        {/* Main Tab Area */}
        <main style={{ minHeight: '65vh' }}>
          {currentTab === 'tab-hub' && <HubTab />}
          {currentTab === 'tab-solicitacoes' && <SolicitacoesTab />}
          {currentTab === 'tab-mapas-web' && <MapasWebTab />}
          {currentTab === 'tab-agente-ia' && <AgenteIaTab />}
          {currentTab === 'tab-cancelamento' && <CancelamentoTab />}
          {(currentTab === 'tab-configuracoes' || currentTab === 'tab-diagnostico') && <ConfiguracoesTab />}
        </main>

        {/* Real-time automation log console */}
        <ConsoleStream />

        {/* Modals & Overlays */}
        <LoginModal />
        <UsersModal />
        <UploadModal />
        <ToastContainer />
      </div>
    </AppErrorBoundary>
  );
};
