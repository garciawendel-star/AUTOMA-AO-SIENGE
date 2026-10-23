import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  DollarSign,
  Users,
  ShieldCheck,
  Sparkles,
  Table,
  Inbox,
  Ban,
  ArrowRight,
  Settings
} from 'lucide-react';

export const HubTab: React.FC = () => {
  const { pedidos, solicitacoes, correlacoesFornecedores, setCurrentTab } = useApp();

  const pendingPedidos = pedidos.filter(p => p.status === 'Pendente');
  const totalSaldoCancelar = pendingPedidos.reduce((acc, p) => acc + p.saldo_total, 0);
  const totalCancelledAntiDuplicate = pedidos.filter(
    p => p.status === 'Cancelado' || p.status === 'Simulado (OK)'
  ).length;

  return (
    <section id="tab-hub" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Welcome Card & Fluxo de Trabalho */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              Painel Central de Automação SIENGE — Fluxo Operacional de Suprimentos
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
              Fluxo integrado: Extração das Solicitações ➔ Montagem do Mapa & Resumos ➔ Agente de Cotação ➔ Cancelamento dos Pedidos.
            </p>
          </div>
          <div className="btn-group" style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={() => setCurrentTab('tab-configuracoes')}>
              <Settings size={15} /> Configurações & Diagnóstico
            </button>
            <button className="btn btn-omega" onClick={() => setCurrentTab('tab-solicitacoes')}>
              Iniciar Etapa 1: Extração →
            </button>
          </div>
        </div>

        {/* Barra Visual da Ordem do Fluxo de Trabalho */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--border-color)'
          }}
        >
          <div
            onClick={() => setCurrentTab('tab-solicitacoes')}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase' }}>ETAPA 1</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Extração das Solicitações</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{solicitacoes.length} solicitações ativas</div>
            </div>
            <ArrowRight size={16} color="#60a5fa" />
          </div>

          <div
            onClick={() => setCurrentTab('tab-mapas-web')}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(197, 139, 56, 0.12)',
              border: '1px solid rgba(197, 139, 56, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>ETAPA 2</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Montagem do Mapa & Resumos</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Equalização e aprovação executiva</div>
            </div>
            <ArrowRight size={16} color="#fbbf24" />
          </div>

          <div
            onClick={() => setCurrentTab('tab-agente-ia')}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>ETAPA 3</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Agente de Cotação</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Preenchimento automático do mapa</div>
            </div>
            <ArrowRight size={16} color="#c084fc" />
          </div>

          <div
            onClick={() => setCurrentTab('tab-cancelamento')}
            style={{
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#f87171', textTransform: 'uppercase' }}>ETAPA 4</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Cancelamento dos Pedidos</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{pendingPedidos.length} pendentes no SIENGE</div>
            </div>
            <ArrowRight size={16} color="#f87171" />
          </div>
        </div>
      </div>

      {/* 4 Top KPI Cards */}
      <div className="kpi-section">
        <div className="kpi-card glass">
          <div className="kpi-header">
            <span className="kpi-title">Solicitações & Mapas Ativos</span>
            <div className="kpi-icon-wrapper color-primary">
              <Package size={18} />
            </div>
          </div>
          <div className="kpi-value">{solicitacoes.length}</div>
          <div className="kpi-footer">
            <span className="trend">Extraídas do SIENGE</span>
          </div>
        </div>

        <div className="kpi-card glass border-delivered">
          <div className="kpi-header">
            <span className="kpi-title">Fornecedores Homologados</span>
            <div className="kpi-icon-wrapper color-delivered">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-value value-delivered">{correlacoesFornecedores.length} / {correlacoesFornecedores.length}</div>
          <div className="kpi-footer">
            <span className="trend trend-delivered">Base ativa de suprimentos</span>
          </div>
        </div>

        <div className="kpi-card glass border-pending">
          <div className="kpi-header">
            <span className="kpi-title">Saldo Total a Cancelar</span>
            <div className="kpi-icon-wrapper color-pending">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="kpi-value value-pending">
            R$ {totalSaldoCancelar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span className="trend trend-pending">{pendingPedidos.length} pedidos em aberto no SIENGE</span>
          </div>
        </div>

        <div className="kpi-card glass border-cancelled">
          <div className="kpi-header">
            <span className="kpi-title">Histórico Anti-Duplicidade</span>
            <div className="kpi-icon-wrapper color-cancelled">
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="kpi-value value-cancelled">{totalCancelledAntiDuplicate}</div>
          <div className="kpi-footer">
            <span className="trend trend-cancelled">Cancelados protegidos no banco</span>
          </div>
        </div>
      </div>

      {/* 4 Grandes Cards de Acesso aos Módulos na Ordem Exata do Fluxo de Trabalho */}
      <div className="module-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* ETAPA 1: Extração de Solicitações */}
        <div className="card module-card" id="hub-card-solicitacoes">
          <div>
            <span className="module-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              1º PASSO • EXTRAÇÃO SIENGE
            </span>
            <h2 style={{ marginTop: 10 }}>1. Extração das Solicitações & Alertas</h2>
            <p style={{ marginTop: 8 }}>
              Conecta ao SIENGE, extrai solicitações pendentes por centro de custo, alimenta a planilha Macro (.xlsm), monta os mapas de cotação e dispara alertas por WhatsApp e E-mail.
            </p>
          </div>
          <div className="btn-group" style={{ marginTop: 10 }}>
            <button className="btn btn-primary" onClick={() => setCurrentTab('tab-solicitacoes')} style={{ width: '100%', justifyContent: 'center' }}>
              <Inbox size={16} /> Acessar 1. Extração de Solicitações <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ETAPA 2: Montagem do Mapa & Resumos */}
        <div className="card module-card" id="hub-card-mapas" style={{ borderColor: 'rgba(197, 139, 56, 0.45)' }}>
          <div>
            <span className="module-badge" style={{ background: 'rgba(197, 139, 56, 0.18)', color: '#fbbf24', border: '1px solid rgba(197, 139, 56, 0.4)' }}>
              2º PASSO • MAPA & RESUMO EXECUTIVO
            </span>
            <h2 style={{ marginTop: 10 }}>2. Montagem do Mapa & Resumos de Compras</h2>
            <p style={{ marginTop: 8 }}>
              Folhas executivas de Resumo de Cotação e Mapa Comparativo de Preços com equalização automática de propostas, cálculo de saving, impressão executiva e gestão de solicitações.
            </p>
          </div>
          <div className="btn-group" style={{ marginTop: 10 }}>
            <button className="btn btn-omega" onClick={() => setCurrentTab('tab-mapas-web')} style={{ width: '100%', justifyContent: 'center' }}>
              <Table size={16} /> Abrir 2. Mapa & Resumo de Compras <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ETAPA 3: Agente de Cotação */}
        <div className="card module-card ai-glow-card" id="hub-card-agente-ia">
          <div>
            <span className="badge-agente-ai">
              <Sparkles size={14} /> 3º PASSO • AGENTE DE COTAÇÃO IA
            </span>
            <h2 style={{ marginTop: 10 }}>3. Agente de Cotação (Preenchimento de Mapas)</h2>
            <p style={{ marginTop: 8 }}>
              Recebe as respostas das cotações enviadas aos fornecedores e preenche automaticamente os preços, prazos, condições de pagamento e frete nos insumos já existentes no Mapa de Cotação.
            </p>
          </div>
          <div className="btn-group" style={{ marginTop: 10 }}>
            <button className="btn btn-omega" onClick={() => setCurrentTab('tab-agente-ia')} style={{ width: '100%', justifyContent: 'center' }}>
              <Sparkles size={16} /> Abrir 3. Agente de Cotação <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ETAPA 4: Cancelamento de Pedidos */}
        <div className="card module-card" id="hub-card-cancelamento">
          <div>
            <span className="module-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              4º PASSO • CANCELAMENTO SIENGE
            </span>
            <h2 style={{ marginTop: 10 }}>4. Cancelamento dos Pedidos Gerados</h2>
            <p style={{ marginTop: 8 }}>
              Processa pedidos gerados e relatórios PDF de saldos pendentes, executa a automação de cancelamento no SIENGE, gera notificações no Outlook para fornecedores e exporta relatórios consolidados em Excel.
            </p>
          </div>
          <div className="btn-group" style={{ marginTop: 10 }}>
            <button className="btn btn-outline" onClick={() => setCurrentTab('tab-cancelamento')} style={{ width: '100%', justifyContent: 'center' }}>
              <Ban size={16} /> Acessar 4. Cancelamento de Pedidos <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
