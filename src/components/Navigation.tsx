import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Inbox,
  Table,
  Sparkles,
  Ban,
  Settings
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { currentTab, setCurrentTab, currentUser, hasPermission } = useApp();

  const tabs = [
    {
      id: 'tab-hub',
      label: 'Visão Geral / Hub',
      icon: <LayoutDashboard size={18} />,
      permission: 'view_hub'
    },
    {
      id: 'tab-solicitacoes',
      label: '1. Extração de Solicitações',
      icon: <Inbox size={18} />,
      permission: 'view_solicitacoes'
    },
    {
      id: 'tab-mapas-web',
      label: '2. Mapa & Resumo de Compras',
      icon: <Table size={18} />,
      permission: 'view_resumos'
    },
    {
      id: 'tab-agente-ia',
      label: '3. Agente de Cotação',
      icon: <Sparkles size={18} />,
      permission: 'view_mapas'
    },
    {
      id: 'tab-cancelamento',
      label: '4. Cancelamento de Pedidos',
      icon: <Ban size={18} />,
      permission: 'view_cancelamento'
    },
    {
      id: 'tab-configuracoes',
      label: 'Configurações & Usuários',
      icon: <Settings size={18} />,
      permission: 'view_config'
    }
  ];

  return (
    <nav className="nav-section">
      {tabs.map(tab => {
        const canView = hasPermission(tab.permission);
        if (!canView && currentUser?.role === 'engenheiro' && tab.id !== 'tab-mapas-web') {
          return null;
        }

        return (
          <button
            key={tab.id}
            className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.id)}
            data-tab={tab.id}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};
