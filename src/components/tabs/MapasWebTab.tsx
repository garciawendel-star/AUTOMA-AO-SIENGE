import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportSubMapaToExcel } from '../../services/excelService';
import {
  Download,
  Printer,
  MessageCircle,
  Trash2,
  Sparkles,
  CheckCircle2,
  Plus,
  Zap,
  ArrowRight,
  Lock,
  Unlock
} from 'lucide-react';

export const MapasWebTab: React.FC = () => {
  const {
    solicitacoes,
    selectedSolicitacaoId,
    setSelectedSolicitacaoId,
    selectedSubMapaId,
    setSelectedSubMapaId,
    deleteSolicitacao,
    updateSolicitacao,
    chooseWinnerItem,
    updateItemPrice,
    updateItemObservacaoResumo,
    updateSupplierHeader,
    addSupplierColumnToSubMapa,
    removeSupplierColumnFromSubMapa,
    autoFillCorrelatedSuppliers,
    generateOrdersFromApprovedMap,
    setCurrentTab,
    showToast,
    addLog,
    currentUser
  } = useApp();

  const [filterSolId, setFilterSolId] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [resumoSortField, setResumoSortField] = useState<'item_idx' | 'descricao' | 'fornecedor' | 'total'>('item_idx');
  const [printOrientation, setPrintOrientation] = useState<'auto' | 'landscape' | 'portrait'>('auto');
  const [confirmDeleteSolId, setConfirmDeleteSolId] = useState<string | null>(null);

  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'comprador';

  // Filtragem de Solicitações
  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter(sol => {
      if (currentUser?.role === 'engenheiro') {
        const allowed = (currentUser.allowed_cost_centers || '').split(',').map(s => s.trim());
        if (!allowed.includes(sol.obra_codigo) && !allowed.includes('*')) return false;
      }
      if (filterCostCenter !== 'ALL' && sol.obra_codigo !== filterCostCenter) return false;
      if (filterSolId && !sol.solicitacao_id.toLowerCase().includes(filterSolId.toLowerCase())) return false;
      if (filterCategory !== 'ALL' && !sol.submapas.some(sm => sm.categoria === filterCategory)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSol = sol.solicitacao_id.toLowerCase().includes(term);
        const matchObra = sol.obra_nome.toLowerCase().includes(term);
        const matchInsumo = sol.submapas.some(sm =>
          sm.itens.some(it => it.descricao.toLowerCase().includes(term)) ||
          sm.fornecedores.some(f => f.nome.toLowerCase().includes(term))
        );
        if (!matchSol && !matchObra && !matchInsumo) return false;
      }
      return true;
    });
  }, [solicitacoes, filterCostCenter, filterSolId, filterCategory, searchTerm, currentUser]);

  const activeSolicitacao = useMemo(() => {
    return (
      filteredSolicitacoes.find(s => s.solicitacao_id === selectedSolicitacaoId) ||
      filteredSolicitacoes[0] ||
      null
    );
  }, [filteredSolicitacoes, selectedSolicitacaoId]);

  const activeSubMapa = useMemo(() => {
    if (!activeSolicitacao || !activeSolicitacao.submapas.length) return null;
    return (
      activeSolicitacao.submapas.find(sub => sub.id === selectedSubMapaId) ||
      activeSolicitacao.submapas[0]
    );
  }, [activeSolicitacao, selectedSubMapaId]);

  // Cálculo dos itens do Resumo de Cotação e Totais por Fornecedor
  const resumoData = useMemo(() => {
    if (!activeSubMapa) {
      return {
        sortedItems: [],
        totalGeral: 0,
        totalReferencia: 0,
        totalSaving: 0,
        fornecedoresVencedoresResumo: [] as {
          id: string;
          nome: string;
          contato: string;
          telefone: string;
          condicao: string;
          frete: string;
          total: number;
          itensCount: number;
        }[]
      };
    }

    let totalGeral = 0;
    let totalReferencia = 0;
    const supMap: Record<
      string,
      {
        id: string;
        nome: string;
        contato: string;
        telefone: string;
        condicao: string;
        frete: string;
        total: number;
        itensCount: number;
      }
    > = {};

    const enrichedItems = activeSubMapa.itens.map(it => {
      const winId = it.fornecedor_vencedor_id || it.menor_preco_fornecedor_id;
      const winSup = activeSubMapa.fornecedores.find(f => f.id === winId);
      const winCot = winId ? it.cotacoes[winId] : undefined;
      const precoUnit = winCot ? winCot.preco_unitario : 0;
      const precoTotal = Number((precoUnit * it.quantidade).toFixed(2));
      const refTotal = Number(((it.preco_referencia || precoUnit * 1.12) * it.quantidade).toFixed(2));

      totalGeral += precoTotal;
      totalReferencia += refTotal;

      if (winSup && precoTotal > 0) {
        if (!supMap[winSup.id]) {
          supMap[winSup.id] = {
            id: winSup.id,
            nome: winSup.nome,
            contato: winSup.contato || 'Comercial',
            telefone: winSup.telefone || '',
            condicao: winSup.condicao_pagamento || '28 DDL',
            frete: `${winSup.frete_tipo || 'CIF'}${winSup.frete_valor ? ` (R$ ${winSup.frete_valor})` : ''}`,
            total: 0,
            itensCount: 0
          };
        }
        supMap[winSup.id].total += precoTotal;
        supMap[winSup.id].itensCount += 1;
      }

      return {
        ...it,
        winnerSupName: winSup ? winSup.nome : 'EM COTAÇÃO',
        winnerUnit: precoUnit,
        winnerTotal: precoTotal
      };
    });

    const sortedItems = [...enrichedItems].sort((a, b) => {
      if (resumoSortField === 'descricao') return a.descricao.localeCompare(b.descricao);
      if (resumoSortField === 'fornecedor') return a.winnerSupName.localeCompare(b.winnerSupName);
      if (resumoSortField === 'total') return b.winnerTotal - a.winnerTotal;
      return a.item_idx - b.item_idx;
    });

    return {
      sortedItems,
      totalGeral,
      totalReferencia,
      totalSaving: Math.max(0, totalReferencia - totalGeral),
      fornecedoresVencedoresResumo: Object.values(supMap)
    };
  }, [activeSubMapa, resumoSortField]);

  const handlePrintMode = (mode: 'all' | 'resumo' | 'mapa') => {
    document.body.classList.remove('print-only-resumo', 'print-only-mapa', 'resumo-is-portrait', 'resumo-is-landscape');
    if (mode === 'resumo') document.body.classList.add('print-only-resumo');
    if (mode === 'mapa') document.body.classList.add('print-only-mapa');
    if (printOrientation === 'portrait') document.body.classList.add('resumo-is-portrait');
    if (printOrientation === 'landscape') document.body.classList.add('resumo-is-landscape');

    window.print();

    setTimeout(() => {
      document.body.classList.remove('print-only-resumo', 'print-only-mapa');
    }, 500);
  };

  const handleExportExcel = () => {
    if (!activeSubMapa || !activeSolicitacao) return;
    exportSubMapaToExcel(activeSubMapa, activeSolicitacao.solicitacao_id, activeSolicitacao.obra_nome);
    showToast(`Planilha Excel da Solicitação #${activeSolicitacao.solicitacao_id} exportada!`, 'success');
    addLog(`Planilha Excel exportada para Solicitação #${activeSolicitacao.solicitacao_id} (${activeSubMapa.nome}).`, 'info');
  };

  // Dispara mensagem de solicitação de cotação para um fornecedor do Mapa via WhatsApp
  const handleSendQuoteRequestWhatsApp = (fornecedorId: string) => {
    if (!activeSolicitacao || !activeSubMapa) return;
    const sup = activeSubMapa.fornecedores.find(f => f.id === fornecedorId);
    if (!sup) return;

    const itemsLines = activeSubMapa.itens
      .map(it => `• ${it.quantidade} ${it.unidade} — ${it.descricao}`)
      .join('\n');

    const msg = `Olá *${sup.contato || sup.nome}*, tudo bem?
Somos do setor de Suprimentos da *Omega Construtora*.
Solicitamos cotação de *${activeSubMapa.nome}* para a *Obra ${activeSolicitacao.obra_nome}* (Solicitação nº ${activeSolicitacao.solicitacao_id}):

${itemsLines}

Por gentileza, informar preços unitários, condição de pagamento e prazo de entrega.
Atenciosamente,
*Setor de Suprimentos — Omega Construtora*`;

    navigator.clipboard?.writeText(msg);
    showToast(`Solicitação de cotação copiada para o WhatsApp de ${sup.nome}!`, 'success');
    addLog(`[WHATSAPP COTAÇÃO] Texto de solicitação #${activeSolicitacao.solicitacao_id} gerado para ${sup.nome}.`, 'info');
  };

  // Dispara mensagem de fechamento de compra aprovado para um fornecedor vencedor
  const handleSendApprovedClosureWhatsApp = (supId: string) => {
    if (!activeSolicitacao || !activeSubMapa) return;
    const supSummary = resumoData.fornecedoresVencedoresResumo.find(s => s.id === supId);
    if (!supSummary) return;

    const wonItems = resumoData.sortedItems.filter(
      it => (it.fornecedor_vencedor_id || it.menor_preco_fornecedor_id) === supId
    );

    const itemsText = wonItems
      .map(
        it =>
          `• *${it.quantidade} ${it.unidade}* - ${it.descricao} | Unit: R$ ${it.winnerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Total: *R$ ${it.winnerTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}* (Solic. ${activeSolicitacao.solicitacao_id})`
      )
      .join('\n');

    const msg = `🏗️ *OMEGA CONSTRUTORA — RESUMO DE COMPRA APROVADO*
Fornecedor: *${supSummary.nome}*
A/C: *${supSummary.contato}*
Obra: *${activeSolicitacao.obra_nome}*
Condição: *${supSummary.condicao}*

📦 *ITENS VENCEDORES:*
${itemsText}

💰 *VALOR TOTAL DO FECHAMENTO: R$ ${supSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*

Por favor, confirme o faturamento e previsão de entrega.
Atenciosamente,
*Setor de Suprimentos — Omega Construtora*`;

    navigator.clipboard?.writeText(msg);
    showToast(`Pedido de Fechamento Aprovado copiado para o WhatsApp de ${supSummary.nome}!`, 'success');
    addLog(`[FECHAMENTO WHATSAPP] Resumo aprovado copiado para ${supSummary.nome} (R$ ${supSummary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`, 'success');
  };

  const handleConfirmDeleteSolicitacao = (solId: string) => {
    deleteSolicitacao(solId);
    setConfirmDeleteSolId(null);
  };

  return (
    <section id="tab-mapas-web" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* BARRA DE FILTROS INTEGRADOS (ORIGINAL .mapas-filter-bar) */}
      <div className="card no-print" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="module-badge" style={{ background: 'rgba(197, 139, 56, 0.2)', color: '#fbbf24', border: '1px solid rgba(197, 139, 56, 0.45)' }}>
                ETAPA 2 DO FLUXO
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0 }}>
                Montagem do Mapa de Cotação & Resumo Executivo de Compras
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Equalização comparativa de propostas, seleção de vencedores, cálculo de saving e emissão executiva.
            </p>
          </div>

          <div className="btn-group">
            <button className="btn btn-outline btn-sm" onClick={handleExportExcel}>
              <Download size={14} /> Exportar Excel (.xlsx)
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handlePrintMode('all')}>
              <Printer size={14} /> Imprimir Resumo + Mapa
            </button>
            <button className="btn btn-omega btn-sm" onClick={() => setCurrentTab('tab-agente-ia')}>
              <Sparkles size={14} /> Ir para Etapa 3: Agente de Cotação <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="mapas-filter-bar">
          <div className="form-group">
            <label>Nº Solicitação:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: 84920..."
              value={filterSolId}
              onChange={e => setFilterSolId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Centro de Custo / Obra:</label>
            <select
              className="form-control"
              value={filterCostCenter}
              onChange={e => setFilterCostCenter(e.target.value)}
            >
              <option value="ALL">Todas as Obras Autorizadas</option>
              <option value="188">188 - Residencial Jardim das Palmeiras</option>
              <option value="217">217 - Edifício Boulevard Alpha</option>
              <option value="442">442 - Condomínio Barra Prime</option>
              <option value="446">446 - Residencial Solar do Parque</option>
            </select>
          </div>

          <div className="form-group">
            <label>Categoria de Insumo:</label>
            <select
              className="form-control"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="AÇO E FERRAGEM">AÇO E FERRAGEM</option>
              <option value="CIMENTO E ALVENARIA">CIMENTO E ALVENARIA</option>
              <option value="HIDRÁULICA">HIDRÁULICA</option>
              <option value="AGREGADOS">AGREGADOS</option>
            </select>
          </div>

          <div className="form-group">
            <label>Data Inicial:</label>
            <input
              type="text"
              className="form-control"
              placeholder="dd/mm/aaaa"
              value={filterDateStart}
              onChange={e => setFilterDateStart(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Data Final:</label>
            <input
              type="text"
              className="form-control"
              placeholder="dd/mm/aaaa"
              value={filterDateEnd}
              onChange={e => setFilterDateEnd(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Buscar Insumo ou Fornecedor:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Digite aço, cimento, tubo, Gerdau..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* BARRA DE PÍLULAS DE SOLICITAÇÕES (.solic-pills-bar) COM BOTÃO DE EXCLUIR */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Solicitações Disponíveis ({filteredSolicitacoes.length}) — Clique para selecionar ou no ícone 🗑️ para excluir:
            </span>
          </div>

          <div className="solic-pills-bar">
            {filteredSolicitacoes.map(sol => {
              const isActive = activeSolicitacao?.solicitacao_id === sol.solicitacao_id;
              const qtdItens = sol.submapas.reduce((acc, sm) => acc + sm.itens.length, 0);

              return (
                <div
                  key={sol.id}
                  className={`solic-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSolicitacaoId(sol.solicitacao_id);
                    if (sol.submapas.length > 0) {
                      setSelectedSubMapaId(sol.submapas[0].id);
                    }
                  }}
                >
                  <div className="solic-pill-top">
                    <span>Solic. #{sol.solicitacao_id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {sol.urgente && <span className="badge-urgente">URGENTE</span>}
                      <span className="badge-aprovado">{sol.status}</span>
                      {canEdit && (
                        <button
                          type="button"
                          title={`Excluir Solicitação #${sol.solicitacao_id}`}
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDeleteSolId(sol.solicitacao_id);
                          }}
                          style={{
                            background: 'rgba(239, 68, 68, 0.18)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            borderRadius: 4,
                            padding: '2px 5px',
                            cursor: 'pointer',
                            fontSize: 11,
                            lineHeight: 1
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="solic-pill-sub" title={sol.obra_nome}>
                    🏗️ {sol.obra_nome}
                  </div>
                  <div className="solic-pill-sub" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>📅 {sol.data_solicitacao}</span>
                    <span>📦 {sol.submapas.length} mapa(s) / {qtdItens} itens</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE SOLICITAÇÃO */}
      {confirmDeleteSolId && (
        <div className="login-overlay" style={{ zIndex: 9500 }}>
          <div className="card modal-dialog" style={{ maxWidth: 460, padding: 22 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f87171', margin: 0 }}>
              🗑️ Excluir Solicitação #{confirmDeleteSolId}?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.5 }}>
              Tem certeza que deseja excluir a <strong>Solicitação #{confirmDeleteSolId}</strong> e todos os seus mapas/resumos de cotação?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDeleteSolId(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleConfirmDeleteSolicitacao(confirmDeleteSolId)}
              >
                <Trash2 size={14} /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {!activeSolicitacao || !activeSubMapa ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Nenhuma solicitação selecionada ou encontrada para este filtro. Vá na Etapa 1 (Extração de Solicitações) para extrair novas solicitações do SIENGE.
        </div>
      ) : (
        <>
          {/* BARRA DE MÚLTIPLOS SUBMAPAS POR SOLICITAÇÃO (.submapas-nav-card) */}
          <div className="submapas-nav-card no-print">
            <div className="submapas-nav-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="submapas-nav-badge">
                  SOLICITAÇÃO Nº {activeSolicitacao.solicitacao_id}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeSolicitacao.obra_nome}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  • {activeSolicitacao.submapas.length} Submapa(s) por Categoria de Insumo
                </span>
              </div>

              <div className="btn-group">
                {canEdit && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => autoFillCorrelatedSuppliers(activeSolicitacao.id, activeSubMapa.id, 4)}
                      title="Preencher automaticamente fornecedores participantes para esta solicitação"
                    >
                      <Zap size={14} color="#fbbf24" /> Preenchimento Automático IA
                    </button>

                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => generateOrdersFromApprovedMap(activeSolicitacao.id, activeSubMapa.id)}
                      title="Aprova o Resumo de Compras e registra os pedidos para controle na Etapa 4"
                    >
                      <CheckCircle2 size={14} /> Aprovar Resumo & Gerar Pedidos
                    </button>

                    <button
                      className="btn btn-delete-selected btn-sm"
                      onClick={() => setConfirmDeleteSolId(activeSolicitacao.solicitacao_id)}
                      title="Excluir esta solicitação do Mapa & Resumos"
                    >
                      <Trash2 size={14} /> Excluir Solicitação #{activeSolicitacao.solicitacao_id}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="submapas-tabs-bar">
              {activeSolicitacao.submapas.map((sub, idx) => {
                const isSubActive = sub.id === activeSubMapa.id;
                const subTotal = sub.itens.reduce((acc, it) => {
                  const winId = it.fornecedor_vencedor_id || it.menor_preco_fornecedor_id;
                  const unit = winId && it.cotacoes[winId] ? it.cotacoes[winId].preco_unitario : 0;
                  return acc + unit * it.quantidade;
                }, 0);

                return (
                  <div
                    key={sub.id}
                    className={`submapa-tab ${isSubActive ? 'active' : ''}`}
                    onClick={() => setSelectedSubMapaId(sub.id)}
                  >
                    <div className="submapa-tab-title">
                      <span>MAPA {idx + 1}: {sub.nome}</span>
                      <span>✓</span>
                    </div>
                    <div className="submapa-tab-meta">
                      {sub.itens.length} insumo(s) • {sub.fornecedores.length} forn. da obra
                    </div>
                    <div className="submapa-tab-val">
                      R$ {subTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              FOLHA 1: DEMONSTRATIVO EXECUTIVO — RESUMO DE COTAÇÃO (.omega-doc-sheet)
              =================================================================== */}
          <div id="sheet-resumo-cotacao" className="omega-doc-sheet">
            <div className="omega-sheet-toolbar no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#740000', textTransform: 'uppercase' }}>
                  📄 FOLHA 1: RESUMO DE COTAÇÃO (FECHAMENTO)
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>| Ordenar por:</span>
                <button
                  className={`btn-doc-sort ${resumoSortField === 'item_idx' ? 'active' : ''}`}
                  onClick={() => setResumoSortField('item_idx')}
                >
                  Item #
                </button>
                <button
                  className={`btn-doc-sort ${resumoSortField === 'descricao' ? 'active' : ''}`}
                  onClick={() => setResumoSortField('descricao')}
                >
                  Insumo (A-Z)
                </button>
                <button
                  className={`btn-doc-sort ${resumoSortField === 'fornecedor' ? 'active' : ''}`}
                  onClick={() => setResumoSortField('fornecedor')}
                >
                  Fornecedor Vencedor
                </button>
                <button
                  className={`btn-doc-sort ${resumoSortField === 'total' ? 'active' : ''}`}
                  onClick={() => setResumoSortField('total')}
                >
                  Maior Valor
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="btn-doc-sort resumo-orientation-picker"
                  value={printOrientation}
                  onChange={e => setPrintOrientation(e.target.value as any)}
                >
                  <option value="auto">Orientação: Automática</option>
                  <option value="landscape">Orientação: Paisagem</option>
                  <option value="portrait">Orientação: Retrato</option>
                </select>
                <button className="btn-doc-sort" onClick={() => handlePrintMode('resumo')}>
                  🖨️ Imprimir Apenas Resumo
                </button>
              </div>
            </div>

            {/* Cabeçalho Oficial Ômega (.omega-doc-header-table) */}
            <table className="omega-doc-header-table">
              <tbody>
                <tr>
                  <td className="omega-doc-logo-cell">
                    <img src="/img/logo_omega.png" alt="Omega Construtora" className="omega-doc-logo" onError={(e) => { (e.target as HTMLImageElement).src = '/app_icon.png'; }} />
                  </td>
                  <td className="omega-doc-title-cell">
                    RESUMO DE COTAÇÃO DE PREÇOS
                  </td>
                  <td className="omega-doc-header-right-cell">
                    <span className="omega-doc-cat-pill">{activeSubMapa.categoria}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabela de Metadados (OBRA / SOLICITAÇÃO / DATA / SOLICITANTE / OBSERVAÇÃO) */}
            <table className="omega-doc-meta-table">
              <tbody>
                <tr>
                  <td className="omega-doc-lbl" style={{ width: '12%' }}>OBRA:</td>
                  <td className="omega-doc-val" style={{ width: '38%' }}>{activeSolicitacao.obra_nome}</td>
                  <td className="omega-doc-lbl" style={{ width: '14%' }}>SOLICITAÇÃO Nº:</td>
                  <td className="omega-doc-val text-center" style={{ width: '12%', fontWeight: 800, color: '#740000' }}>
                    {activeSolicitacao.solicitacao_id}
                  </td>
                  <td className="omega-doc-lbl" style={{ width: '10%' }}>DATA:</td>
                  <td className="omega-doc-val text-center" style={{ width: '14%' }}>{activeSolicitacao.data_solicitacao}</td>
                </tr>
                <tr>
                  <td className="omega-doc-lbl">SOLICITANTE:</td>
                  <td className="omega-doc-val">{activeSolicitacao.solicitante || 'Engenharia de Obra'}</td>
                  <td className="omega-doc-lbl">COMPRADOR:</td>
                  <td className="omega-doc-val text-center">{activeSolicitacao.comprador_responsavel}</td>
                  <td className="omega-doc-lbl">STATUS:</td>
                  <td className="omega-doc-val text-center" style={{ color: '#065f46', fontWeight: 800 }}>
                    {activeSolicitacao.status.toUpperCase()}
                  </td>
                </tr>
                <tr>
                  <td className="omega-doc-lbl">OBSERVAÇÃO:</td>
                  <td className="omega-doc-val" colSpan={5}>
                    <input
                      id="resumo-doc-obs"
                      type="text"
                      className="resumo-inline-input"
                      style={{ textAlign: 'left', width: '100%' }}
                      value={activeSolicitacao.observacao_geral || ''}
                      onChange={e => updateSolicitacao(activeSolicitacao.id, { observacao_geral: e.target.value })}
                      placeholder="Observações de faturamento, entrega e equalização..."
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tabela Principal de Itens Vencedores do Resumo (#table-resumo-web) */}
            <div className="omega-doc-table-wrap">
              <table id="table-resumo-web" className="omega-doc-items-table">
                <thead>
                  <tr>
                    <th style={{ width: '34%', textAlign: 'left' }}>INSUMO / DESCRIÇÃO DO MATERIAL</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>QTD.</th>
                    <th style={{ width: '6%', textAlign: 'center' }}>UND.</th>
                    <th style={{ width: '21%', textAlign: 'center' }}>FORNECEDOR VENCEDOR (MENOR PREÇO)</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>MARCA / OBS.</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>UNITÁRIO</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>TOTAL GERAL</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoData.sortedItems.map(it => (
                    <tr key={it.id}>
                      <td style={{ fontWeight: 700 }}>
                        {it.codigo_sienge ? `[${it.codigo_sienge}] ` : ''}{it.descricao}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{it.quantidade}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{it.unidade}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#065f46', background: '#ecfdf5' }}>
                        {it.winnerSupName}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="text"
                          className="resumo-inline-input"
                          value={it.observacao_resumo || ''}
                          onChange={e =>
                            updateItemObservacaoResumo(activeSolicitacao.id, activeSubMapa.id, it.id, e.target.value)
                          }
                          placeholder="Marca / Obs"
                        />
                      </td>
                      <td>
                        <div className="acct-box">
                          <span className="acct-sym">R$</span>
                          <span className="acct-num">
                            {it.winnerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 800 }}>
                        <div className="acct-box">
                          <span className="acct-sym">R$</span>
                          <span className="acct-num">
                            {it.winnerTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Linha da Caixa de Total Geral (abaixo da coluna TOTAL GERAL R$) */}
                  <tr className="omega-doc-total-spacer-row">
                    <td colSpan={5}></td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 11, color: '#1e293b' }}>
                      TOTAL RESUMO:
                    </td>
                    <td className="omega-doc-total-box-cell">
                      <div className="acct-box">
                        <span className="acct-sym" style={{ color: '#0f172a', fontWeight: 800 }}>R$</span>
                        <span className="acct-num">
                          {resumoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Quadros Inferiores Lado a Lado: FORNECEDOR | TOTAL e PAGAMENTO | TOTAL */}
            <div className="omega-doc-bottom-summaries">
              {/* Subtabela 1: Quadro Resumo por Fornecedor Vencedor */}
              <table className="omega-doc-subtable">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>FORNECEDOR VENCEDOR</th>
                    <th>CONTATO / VENDEDOR</th>
                    <th style={{ width: 140 }}>VALOR TOTAL</th>
                    <th className="no-print" style={{ width: 95 }}>PEDIDO WA</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoData.fornecedoresVencedoresResumo.map(fs => (
                    <tr key={fs.id}>
                      <td style={{ fontWeight: 800, color: '#740000' }}>{fs.nome}</td>
                      <td style={{ textAlign: 'center', fontSize: 11 }}>{fs.contato} ({fs.telefone})</td>
                      <td style={{ fontWeight: 700 }}>
                        <div className="acct-box">
                          <span className="acct-sym">R$</span>
                          <span className="acct-num">
                            {fs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <button
                          className="btn-doc-sort"
                          style={{ background: '#059669', color: '#fff', borderColor: '#059669', padding: '3px 8px' }}
                          onClick={() => handleSendApprovedClosureWhatsApp(fs.id)}
                          title="Copiar fechamento de compra aprovado para WhatsApp"
                        >
                          📲 Fechar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'right' }}>TOTAL FECHAMENTO:</td>
                    <td>
                      <div className="acct-box">
                        <span className="acct-sym">R$</span>
                        <span className="acct-num">
                          {resumoData.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Subtabela 2: Condições de Pagamento, Frete e Saving */}
              <table className="omega-doc-subtable">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>FORNECEDOR</th>
                    <th>CONDIÇÃO PAGAMENTO</th>
                    <th>FRETE / MODALIDADE</th>
                    <th style={{ width: 130 }}>PARTICIPAÇÕES OBRA</th>
                  </tr>
                </thead>
                <tbody>
                  {resumoData.fornecedoresVencedoresResumo.map(fs => {
                    const supObj = activeSubMapa.fornecedores.find(f => f.id === fs.id);
                    return (
                      <tr key={fs.id}>
                        <td style={{ fontWeight: 700 }}>{fs.nome}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{fs.condicao}</td>
                        <td style={{ textAlign: 'center' }}>{fs.frete}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#065f46' }}>
                          {supObj?.participacoes_obra || 4} cotações na Obra {activeSolicitacao.obra_codigo}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'right', color: '#065f46' }}>ECONOMIA GERADA (SAVING):</td>
                    <td colSpan={2} style={{ color: '#065f46' }}>
                      <div className="acct-box">
                        <span className="acct-sym" style={{ color: '#065f46' }}>R$</span>
                        <span className="acct-num">
                          {resumoData.totalSaving.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {' '}
                          ({resumoData.totalReferencia > 0 ? ((resumoData.totalSaving / resumoData.totalReferencia) * 100).toFixed(1) : '0.0'}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ===================================================================
              FOLHA 2+: GRADE COMPARATIVA DO MAPA DE COTAÇÃO (.sheet-mapa.omega-doc-sheet)
              =================================================================== */}
          <div id="sheets-mapa-wrapper">
            <div className="sheet-mapa omega-doc-sheet">
              <div className="omega-sheet-toolbar no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#740000', textTransform: 'uppercase' }}>
                    📊 FOLHA 2: MAPA COMPARATIVO DE COTAÇÃO ({activeSubMapa.fornecedores.length} FORNECEDORES)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {canEdit && (
                    <>
                      <button
                        className="btn-doc-sort"
                        onClick={() => autoFillCorrelatedSuppliers(activeSolicitacao.id, activeSubMapa.id, 5)}
                        title="Atualizar sugestões automáticas de fornecedores para este mapa"
                      >
                        ⚡ Atualizar Sugestão de Fornecedores
                      </button>
                      <button
                        className="btn-doc-sort"
                        onClick={() => addSupplierColumnToSubMapa(activeSolicitacao.id, activeSubMapa.id)}
                      >
                        <Plus size={12} style={{ display: 'inline' }} /> + Coluna Fornecedor
                      </button>
                      <button
                        className="btn-ai-action"
                        onClick={() => setCurrentTab('tab-agente-ia')}
                      >
                        <Sparkles size={12} /> Preencher Resposta com Agente IA
                      </button>
                    </>
                  )}
                  <button className="btn-doc-sort" onClick={() => handlePrintMode('mapa')}>
                    🖨️ Imprimir Apenas Mapa
                  </button>
                </div>
              </div>

              {/* Cabeçalho Oficial do Mapa (.omega-doc-header-table) */}
              <table className="omega-doc-header-table">
                <tbody>
                  <tr>
                    <td className="omega-doc-logo-cell">
                      <img src="/img/logo_omega.png" alt="Omega Construtora" className="omega-doc-logo" onError={(e) => { (e.target as HTMLImageElement).src = '/app_icon.png'; }} />
                    </td>
                    <td className="omega-doc-title-cell">
                      MAPA COMPARATIVO DE COTAÇÃO DE PREÇOS
                    </td>
                    <td className="omega-doc-header-right-cell">
                      <span className="omega-doc-cat-pill">{activeSubMapa.nome}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Metadados do Mapa */}
              <table className="omega-doc-meta-table">
                <tbody>
                  <tr>
                    <td className="omega-doc-lbl" style={{ width: '10%' }}>OBRA:</td>
                    <td className="omega-doc-val" style={{ width: '40%' }}>{activeSolicitacao.obra_nome}</td>
                    <td className="omega-doc-lbl" style={{ width: '14%' }}>SOLICITAÇÃO Nº:</td>
                    <td className="omega-doc-val text-center" style={{ width: '12%', fontWeight: 800 }}>
                      {activeSolicitacao.solicitacao_id}
                    </td>
                    <td className="omega-doc-lbl" style={{ width: '10%' }}>DATA:</td>
                    <td className="omega-doc-val text-center" style={{ width: '14%' }}>
                      {activeSolicitacao.data_solicitacao}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* GRADE COMPARATIVA LADO A LADO (.mapa-grid-table) */}
              <div className="mapa-grid-wrapper">
                <table className="mapa-grid-table">
                  <thead>
                    {/* Linha 1: FORNECEDOR */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end">
                        FORNECEDOR:
                      </td>
                      {activeSubMapa.fornecedores.map(sup => (
                        <td key={sup.id} colSpan={2} className="sup-header-cell sup-group-end">
                          <div className="sup-header-wrap">
                            <input
                              type="text"
                              className="sup-header-input sup-name-input"
                              value={sup.nome}
                              disabled={!canEdit}
                              onChange={e =>
                                updateSupplierHeader(activeSolicitacao.id, activeSubMapa.id, sup.id, { nome: e.target.value })
                              }
                            />
                            <button
                              type="button"
                              className="sup-action-btn sup-wa-btn no-print"
                              style={{ left: 2, right: 'auto' }}
                              title={`Copiar solicitação de cotação para o WhatsApp de ${sup.nome}`}
                              onClick={() => handleSendQuoteRequestWhatsApp(sup.id)}
                            >
                              📲
                            </button>
                            {canEdit && activeSubMapa.fornecedores.length > 1 && (
                              <button
                                type="button"
                                className="sup-action-btn no-print"
                                title="Remover coluna deste fornecedor"
                                onClick={() => removeSupplierColumnFromSubMapa(activeSolicitacao.id, activeSubMapa.id, sup.id)}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: 9.5, color: '#065f46', fontWeight: 700 }}>
                            Histórico Obra {activeSolicitacao.obra_codigo}: {sup.participacoes_obra || 3} cotações
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Linha 2: VENDEDOR / CONTATO */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end">
                        VENDEDOR / CONTATO:
                      </td>
                      {activeSubMapa.fornecedores.map(sup => (
                        <td key={sup.id} colSpan={2} className="sup-header-cell sup-group-end">
                          <input
                            type="text"
                            className="sup-header-input"
                            value={sup.contato || ''}
                            disabled={!canEdit}
                            placeholder="Nome do vendedor"
                            onChange={e =>
                              updateSupplierHeader(activeSolicitacao.id, activeSubMapa.id, sup.id, { contato: e.target.value })
                            }
                          />
                        </td>
                      ))}
                    </tr>

                    {/* Linha 3: TELEFONE / WHATSAPP */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end">
                        TELEFONE / WHATSAPP:
                      </td>
                      {activeSubMapa.fornecedores.map(sup => (
                        <td key={sup.id} colSpan={2} className="sup-header-cell sup-group-end">
                          <input
                            type="text"
                            className="sup-header-input"
                            value={sup.telefone || ''}
                            disabled={!canEdit}
                            placeholder="(21) 90000-0000"
                            onChange={e =>
                              updateSupplierHeader(activeSolicitacao.id, activeSubMapa.id, sup.id, { telefone: e.target.value })
                            }
                          />
                        </td>
                      ))}
                    </tr>

                    {/* Linha 4: CONDIÇÃO DE PAGAMENTO & FRETE */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end">
                        CONDIÇÃO DE PAGAMENTO / FRETE:
                      </td>
                      {activeSubMapa.fornecedores.map(sup => (
                        <td key={sup.id} colSpan={2} className="sup-header-cell sup-group-end">
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="text"
                              className="sup-header-input"
                              value={sup.condicao_pagamento || '28 DDL'}
                              disabled={!canEdit}
                              onChange={e =>
                                updateSupplierHeader(activeSolicitacao.id, activeSubMapa.id, sup.id, {
                                  condicao_pagamento: e.target.value
                                })
                              }
                            />
                            <select
                              value={sup.frete_tipo || 'CIF'}
                              disabled={!canEdit}
                              onChange={e =>
                                updateSupplierHeader(activeSolicitacao.id, activeSubMapa.id, sup.id, {
                                  frete_tipo: e.target.value as 'CIF' | 'FOB'
                                })
                              }
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                border: '1px solid #cbd5e1',
                                borderRadius: 4,
                                background: '#f8fafc',
                                color: '#0f172a',
                                padding: '2px 4px'
                              }}
                            >
                              <option value="CIF">CIF</option>
                              <option value="FOB">FOB</option>
                            </select>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Linha 5: Títulos das Colunas de Itens e Preços */}
                    <tr>
                      <th className="mapa-col-hdr" style={{ width: 36 }}>ITEM</th>
                      <th className="mapa-col-hdr" style={{ width: '24%', textAlign: 'left', paddingLeft: 8 }}>
                        INSUMO / DESCRIÇÃO DO MATERIAL
                      </th>
                      <th className="mapa-col-hdr" style={{ width: 44 }}>UND</th>
                      <th className="mapa-col-hdr sup-group-end" style={{ width: 52 }}>QTD</th>
                      {activeSubMapa.fornecedores.map(sup => (
                        <React.Fragment key={sup.id}>
                          <th className="mapa-col-hdr">UNITÁRIO (R$)</th>
                          <th className="mapa-col-hdr sup-group-end">TOTAL (R$)</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {activeSubMapa.itens.map(item => {
                      const winnerId = item.fornecedor_vencedor_id || item.menor_preco_fornecedor_id;

                      return (
                        <tr key={item.id}>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.item_idx}</td>
                          <td className="insumo-col-cell">{item.descricao}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.unidade}</td>
                          <td className="sup-group-end" style={{ textAlign: 'center', fontWeight: 800 }}>
                            {item.quantidade}
                          </td>

                          {activeSubMapa.fornecedores.map(sup => {
                            const cot = item.cotacoes[sup.id];
                            const unitVal = cot ? cot.preco_unitario : 0;
                            const totalVal = Number((unitVal * item.quantidade).toFixed(2));
                            const isWinner = winnerId === sup.id && unitVal > 0;

                            return (
                              <React.Fragment key={sup.id}>
                                {/* Preço Unitário Editável Contábil */}
                                <td className={`price-cell ${isWinner ? 'is-winner' : ''}`}>
                                  <div className="acct-input-wrap">
                                    <span className="acct-sym">R$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="price-input-acct"
                                      value={unitVal > 0 ? unitVal : ''}
                                      placeholder="-"
                                      disabled={!canEdit}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        updateItemPrice(
                                          activeSolicitacao.id,
                                          activeSubMapa.id,
                                          item.id,
                                          sup.id,
                                          isNaN(val) ? 0 : val
                                        );
                                      }}
                                    />
                                    {canEdit && unitVal > 0 && (
                                      <button
                                        type="button"
                                        className={`winner-Lock-btn no-print ${isWinner && item.vencedor_travado ? 'active' : ''}`}
                                        title={
                                          isWinner
                                            ? 'Vencedor deste item (clique para travar/destravar manualmente)'
                                            : `Definir ${sup.nome} como vencedor deste insumo`
                                        }
                                        onClick={() =>
                                          chooseWinnerItem(activeSolicitacao.id, activeSubMapa.id, item.id, sup.id, true)
                                        }
                                      >
                                        {isWinner ? (item.vencedor_travado ? '🔒' : '🏆') : '○'}
                                      </button>
                                    )}
                                  </div>
                                </td>

                                {/* Preço Total Calculado Contábil */}
                                <td className={`price-cell sup-group-end ${isWinner ? 'is-winner' : ''}`}>
                                  {totalVal > 0 ? (
                                    <div className="acct-box">
                                      <span className="acct-sym">R$</span>
                                      <span className="acct-num">
                                        {totalVal.toLocaleString('pt-BR', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="acct-box acct-empty">-</div>
                                  )}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    {/* Linha 1 do Rodapé: TOTAL GERAL COTADO PELO FORNECEDOR */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end">
                        VALOR TOTAL DA PROPOSTA DO FORNECEDOR:
                      </td>
                      {activeSubMapa.fornecedores.map(sup => {
                        const totalProposta = activeSubMapa.itens.reduce((acc, it) => {
                          const c = it.cotacoes[sup.id];
                          return acc + (c ? c.preco_unitario * it.quantidade : 0);
                        }, 0);

                        return (
                          <td
                            key={sup.id}
                            colSpan={2}
                            className="sup-group-end"
                            style={{ background: '#f1f5f9', fontWeight: 800, padding: '6px 8px' }}
                          >
                            <div className="acct-box">
                              <span className="acct-sym">R$</span>
                              <span className="acct-num">
                                {totalProposta.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Linha 2 do Rodapé: SOMA APENAS DOS ITENS VENCEDORES EM CADA FORNECEDOR */}
                    <tr>
                      <td colSpan={4} className="mapa-sup-meta-lbl sup-group-end" style={{ color: '#065f46' }}>
                        TOTAL FECHADO COM O FORNECEDOR (ITENS VENCEDORES):
                      </td>
                      {activeSubMapa.fornecedores.map(sup => {
                        const totalGanho = activeSubMapa.itens.reduce((acc, it) => {
                          const winId = it.fornecedor_vencedor_id || it.menor_preco_fornecedor_id;
                          if (winId !== sup.id) return acc;
                          const c = it.cotacoes[sup.id];
                          return acc + (c ? c.preco_unitario * it.quantidade : 0);
                        }, 0);

                        return (
                          <td
                            key={sup.id}
                            colSpan={2}
                            className="sup-group-end"
                            style={{
                              background: totalGanho > 0 ? '#d1fae5' : '#ffffff',
                              color: totalGanho > 0 ? '#065f46' : '#94a3b8',
                              fontWeight: 800,
                              padding: '6px 8px'
                            }}
                          >
                            <div className="acct-box">
                              <span className="acct-sym" style={{ color: totalGanho > 0 ? '#065f46' : '#94a3b8' }}>
                                R$
                              </span>
                              <span className="acct-num">
                                {totalGanho.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
