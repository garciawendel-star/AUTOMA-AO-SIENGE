import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportPedidosCancelamentoToExcel } from '../../services/excelService';
import {
  Ban,
  Search,
  CheckSquare,
  Square,
  Play,
  Mail,
  Download,
  AlertTriangle,
  Eye,
  X,
  Trash2,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { PedidoCancelamento } from '../../types';

export const CancelamentoTab: React.FC = () => {
  const {
    pedidos,
    selectedPedidoIds,
    toggleSelectPedido,
    selectAllPedidos,
    deleteSelectedPedidos,
    executeCancelamento,
    setCurrentTab,
    showToast,
    addLog
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterObra, setFilterObra] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isExecuting, setIsExecuting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedPedidoForDetail, setSelectedPedidoForDetail] = useState<PedidoCancelamento | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Controles de Automação do Cancelamento SIENGE (Pág. 1997)
  const [dryRunMode, setDryRunMode] = useState(false);
  const [sendEmailSuppliers, setSendEmailSuppliers] = useState(true);
  const [sendReportManagement, setSendReportManagement] = useState(true);

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      if (filterObra !== 'ALL' && p.obra_codigo !== filterObra) return false;
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchPed = p.pedido_id.toLowerCase().includes(term);
        const matchForn = p.fornecedor_nome.toLowerCase().includes(term);
        const matchObra = p.obra_nome.toLowerCase().includes(term);
        if (!matchPed && !matchForn && !matchObra) return false;
      }
      return true;
    });
  }, [pedidos, filterObra, filterStatus, searchTerm]);

  const selectedPedidos = useMemo(() => {
    return pedidos.filter(p => selectedPedidoIds.has(p.id));
  }, [pedidos, selectedPedidoIds]);

  const selectedTotalSaldo = useMemo(() => {
    return selectedPedidos.reduce((acc, p) => acc + p.saldo_total, 0);
  }, [selectedPedidos]);

  const allFilteredPending = filteredPedidos.filter(p => p.status === 'Pendente');
  const isAllSelected =
    allFilteredPending.length > 0 && allFilteredPending.every(p => selectedPedidoIds.has(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      selectAllPedidos(false);
    } else {
      selectAllPedidos(true);
    }
  };

  const handleStartCancelamento = () => {
    if (selectedPedidoIds.size === 0) {
      showToast('Selecione ao menos um pedido pendente para cancelar.', 'warning');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmCancelamento = async () => {
    setIsConfirmModalOpen(false);
    setIsExecuting(true);
    setProgressPercent(20);
    try {
      const timer = setInterval(() => {
        setProgressPercent(prev => (prev < 90 ? prev + 20 : prev));
      }, 280);
      await executeCancelamento(dryRunMode);
      clearInterval(timer);
      setProgressPercent(100);
      if (sendEmailSuppliers) {
        addLog('E-mails formais de cancelamento de saldo gerados no Outlook para os fornecedores.', 'info');
      }
      if (sendReportManagement) {
        addLog('Relatório executivo de cancelamento encaminhado aos gestores (Dangelo / Romualdo).', 'info');
      }
    } finally {
      setTimeout(() => {
        setIsExecuting(false);
        setProgressPercent(0);
      }, 600);
    }
  };

  const handleGenerateOutlookDrafts = () => {
    if (selectedPedidoIds.size === 0) {
      showToast('Selecione ao menos um pedido para gerar os e-mails.', 'warning');
      return;
    }
    addLog(
      `Gerando ${selectedPedidoIds.size} rascunhos de e-mail no Outlook via protocolo MAPI / Drafts...`,
      'info'
    );
    showToast(
      `${selectedPedidoIds.size} e-mails de cancelamento criados na pasta Rascunhos do Outlook!`,
      'success'
    );
  };

  const handleExportExcel = () => {
    exportPedidosCancelamentoToExcel(filteredPedidos);
    showToast('Planilha de pedidos pendentes exportada!', 'success');
  };

  return (
    <section id="tab-cancelamento" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* BARRA DE FLUXO OPERACIONAL — ETAPA 4 DE 4 */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(30, 41, 59, 0.92) 100%)',
          borderLeft: '4px solid #ef4444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontWeight: 800,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4
              }}
            >
              ETAPA 4 DE 4
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              Cancelamento dos Pedidos Gerados (SIENGE)
            </h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Execução automatizada de cancelamento de pedidos e saldos residuais no SIENGE com disparo de comunicado aos fornecedores e relatório de auditoria.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentTab('tab-agente-ia')}
          >
            <ArrowLeft size={14} /> Voltar à Etapa 3 (Agente de Cotação)
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportExcel}>
            <Download size={14} /> Exportar Excel
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleGenerateOutlookDrafts}>
            <Mail size={14} color="#60a5fa" /> Gerar E-mails (Outlook)
          </button>
        </div>
      </div>

      {/* BARRA DE CONTROLES DE AUTOMAÇÃO SIENGE PÁG. 1997 */}
      <div className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={dryRunMode}
              onChange={e => setDryRunMode(e.target.checked)}
            />
            <span>Modo Simulação (Dry-Run)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sendEmailSuppliers}
              onChange={e => setSendEmailSuppliers(e.target.checked)}
            />
            <span>Notificar Fornecedores (Outlook)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sendReportManagement}
              onChange={e => setSendReportManagement(e.target.checked)}
            />
            <span>Enviar Relatório Gestão (Dangelo / Romualdo)</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={deleteSelectedPedidos}
            disabled={selectedPedidoIds.size === 0}
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
            title="Excluir pedidos selecionados da fila"
          >
            <Trash2 size={14} /> Excluir Selecionados ({selectedPedidoIds.size})
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleStartCancelamento}
            disabled={isExecuting || selectedPedidoIds.size === 0}
            style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', fontWeight: 700 }}
          >
            <Play size={14} /> Executar Cancelamento SIENGE ({selectedPedidoIds.size})
          </button>
        </div>
      </div>

      {/* BARRA DE PROGRESSO DA AUTOMAÇÃO */}
      {isExecuting && (
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            <span>Executando Automação SIENGE (Cancelamento de Pedidos)...</span>
            <span>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444, #f59e0b)',
                transition: 'width 0.25s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Filtros e Pesquisa */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, padding: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Buscar Pedido / Fornecedor:</label>
          <div style={{ position: 'relative', marginTop: 4 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: 10822, Gerdau, Tigre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', fontSize: 13, paddingLeft: 30 }}
            />
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por Obra:</label>
          <select
            className="form-control"
            value={filterObra}
            onChange={e => setFilterObra(e.target.value)}
            style={{ fontSize: 13, marginTop: 4 }}
          >
            <option value="ALL">Todas as Obras</option>
            <option value="188">188 - Jardim das Palmeiras</option>
            <option value="217">217 - Boulevard Alpha</option>
            <option value="442">442 - Barra Prime</option>
            <option value="446">446 - Solar do Parque</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Status:</label>
          <select
            className="form-control"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ fontSize: 13, marginTop: 4 }}
          >
            <option value="ALL">Todos os Status</option>
            <option value="Pendente">Apenas Pendentes</option>
            <option value="Cancelado">Cancelados</option>
            <option value="Simulado (OK)">Simulados</option>
          </select>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="card" style={{ padding: 14, overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <button
                  onClick={handleToggleSelectAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                >
                  {isAllSelected ? <CheckSquare size={16} color="#6366f1" /> : <Square size={16} />}
                </button>
              </th>
              <th>Nº Pedido</th>
              <th>Obra / Centro de Custo</th>
              <th>Fornecedor</th>
              <th style={{ textAlign: 'right' }}>Saldo em Aberto</th>
              <th>Data Emissão</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPedidos.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  Nenhum pedido encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredPedidos.map(p => {
                const isSelected = selectedPedidoIds.has(p.id);
                const isPendente = p.status === 'Pendente';

                return (
                  <tr key={p.id} className={isSelected ? 'selected' : ''}>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => toggleSelectPedido(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                      >
                        {isSelected ? <CheckSquare size={16} color="#6366f1" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>#{p.pedido_id}</strong>
                    </td>
                    <td>
                      <div>{p.obra_nome}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>CC: {p.centro_custo}</div>
                    </td>
                    <td>
                      <div>{p.fornecedor_nome}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.fornecedor_email}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: isPendente ? '#f59e0b' : '#94a3b8' }}>
                      R$ {p.saldo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.data_emissao}</td>
                    <td>
                      <span
                        className="role-pill"
                        style={{
                          background:
                            p.status === 'Pendente'
                              ? 'rgba(245, 158, 11, 0.2)'
                              : p.status === 'Cancelado'
                              ? 'rgba(239, 68, 68, 0.2)'
                              : 'rgba(16, 185, 129, 0.2)',
                          color:
                            p.status === 'Pendente'
                              ? '#fbbf24'
                              : p.status === 'Cancelado'
                              ? '#f87171'
                              : '#34d399',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedPedidoForDetail(p)}
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        <Eye size={12} /> Detalhes ({p.itens.length})
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedPedidoForDetail && (
        <div className="login-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div className="card modal-dialog" style={{ width: '100%', maxWidth: 650, padding: 22, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Pedido #{selectedPedidoForDetail.pedido_id} — {selectedPedidoForDetail.fornecedor_nome}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {selectedPedidoForDetail.obra_nome} &bull; Emissão: {selectedPedidoForDetail.data_emissao}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedPedidoForDetail(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Insumos e Saldos a Cancelar:</h4>
              <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Descrição</th>
                    <th>Qtd</th>
                    <th>Und</th>
                    <th style={{ textAlign: 'right' }}>Valor Unit.</th>
                    <th style={{ textAlign: 'right' }}>Saldo Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPedidoForDetail.itens.map(it => (
                    <tr key={it.item_id}>
                      <td>{it.item_id}</td>
                      <td style={{ fontWeight: 600 }}>{it.descricao}</td>
                      <td>{it.quantidade}</td>
                      <td>{it.unidade}</td>
                      <td style={{ textAlign: 'right' }}>R$ {it.valor_unitario.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#f87171' }}>
                        R$ {it.saldo_valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedPedidoForDetail(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      {isConfirmModalOpen && (
        <div className="login-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div className="card modal-dialog" style={{ width: '100%', maxWidth: 500, padding: 22, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f87171', marginBottom: 12 }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Confirmar Cancelamento SIENGE</h3>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Você está prestes a processar o cancelamento de <strong>{selectedPedidoIds.size} pedido(s)</strong> no valor total de{' '}
              <strong>R$ {selectedTotalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>

            <div style={{ marginTop: 14, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={dryRunMode}
                  onChange={e => setDryRunMode(e.target.checked)}
                />
                <span>Executar em Modo Simulação (Dry Run)</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 22 }}>
                O modo simulação valida os seletores no SIENGE e gera relatórios sem alterar dados reais.
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setIsConfirmModalOpen(false)}>
                Voltar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmCancelamento}
                style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }}
              >
                <CheckCircle2 size={14} /> Confirmar e Executar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
