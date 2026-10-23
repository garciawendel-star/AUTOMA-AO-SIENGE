import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  matchAndFillMapFromSupplierResponse,
  ExtractedQuoteForMapOutput
} from '../../services/geminiService';
import { getCorrelatedSuppliersForSubMapa } from '../../data/initialData';
import {
  Sparkles,
  Send,
  FileSpreadsheet,
  MessageSquare,
  Copy,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Upload,
  ArrowRight,
  Users,
  Layers,
  Check,
  RefreshCw,
  Ban
} from 'lucide-react';

type AgenteSubTab = 'preencher-mapa' | 'fornecedores' | 'pipeline-cotacoes' | 'negociacao';

export const AgenteIaTab: React.FC = () => {
  const {
    solicitacoes,
    selectedSolicitacaoId,
    setSelectedSolicitacaoId,
    selectedSubMapaId,
    setSelectedSubMapaId,
    correlacoesFornecedores,
    applyExtractedQuotesToMap,
    autoFillCorrelatedSuppliers,
    generateOrdersFromApprovedMap,
    setCurrentTab,
    showToast,
    addLog,
    config
  } = useApp();

  const [subTab, setSubTab] = useState<AgenteSubTab>('preencher-mapa');

  const currentSol = useMemo(() => {
    return (
      solicitacoes.find(
        s => s.solicitacao_id === selectedSolicitacaoId || s.id === selectedSolicitacaoId
      ) ||
      solicitacoes[0] ||
      null
    );
  }, [solicitacoes, selectedSolicitacaoId]);

  const submapas = useMemo(() => {
    return currentSol?.submapas || [];
  }, [currentSol]);

  const currentSubMapa = useMemo(() => {
    if (!submapas.length) return null;
    return submapas.find(sm => sm.id === selectedSubMapaId) || submapas[0];
  }, [submapas, selectedSubMapaId]);

  const suggestedSuppliersForCurrent = useMemo(() => {
    if (!currentSol || !currentSubMapa) return [];
    return getCorrelatedSuppliersForSubMapa(
      currentSol.obra_codigo,
      currentSubMapa.categoria || currentSubMapa.nome,
      currentSubMapa.itens.map(i => i.descricao),
      5
    );
  }, [currentSol, currentSubMapa]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  useEffect(() => {
    if (currentSubMapa && currentSubMapa.fornecedores.length > 0) {
      setSelectedSupplierId(currentSubMapa.fornecedores[0].id);
    } else if (suggestedSuppliersForCurrent.length > 0) {
      setSelectedSupplierId(suggestedSuppliersForCurrent[0].id);
    }
  }, [currentSubMapa, suggestedSuppliersForCurrent]);

  const selectedSupplierObj = useMemo(() => {
    return (
      currentSubMapa?.fornecedores.find(f => f.id === selectedSupplierId) ||
      suggestedSuppliersForCurrent.find(f => f.id === selectedSupplierId) ||
      currentSubMapa?.fornecedores[0] ||
      null
    );
  }, [currentSubMapa, suggestedSuppliersForCurrent, selectedSupplierId]);

  // Estado do Leitor de Retorno de Cotação
  const [supplierReplyText, setSupplierReplyText] = useState<string>(
    `Prezado Wendel (Omega Construtora),\nSegue retorno de cotação referente à Solicitação da Obra:\n- Barra Aço CA-50 8.0mm: R$ 42,80\n- Barra Aço CA-50 10.0mm: R$ 61,90\n- Barra Aço CA-50 12.5mm: R$ 94,50\n- Arame Recozido Torcido 1.25mm: R$ 14,60\nFrete: CIF Incluso na obra | Prazo de Entrega: 3 dias úteis | Condição: 28 DDL Boleto.`
  );
  const [isMatchingQuote, setIsMatchingQuote] = useState(false);
  const [matchedResult, setMatchedResult] = useState<ExtractedQuoteForMapOutput | null>(null);

  // Estado para Filtro da Base de Fornecedores
  const [filterObraFornecedor, setFilterObraFornecedor] = useState<string>('ALL');
  const [filterInsumoFornecedor, setFilterInsumoFornecedor] = useState<string>('');

  // Estado para Gerador de Mensagem de Solicitação de Cotação (Pipeline)
  const [pipelineSupplierId, setPipelineSupplierId] = useState<string>('');
  const [generatedRequestMsg, setGeneratedRequestMsg] = useState<string>('');

  // Estado para Negociação / Contraproposta
  const [negSupplier, setNegSupplier] = useState('Gerdau Aços Longos S.A.');
  const [negItemDesc, setNegItemDesc] = useState('Barra Aço CA-50 10.0mm Barra 12m');
  const [negCurrentPrice, setNegCurrentPrice] = useState(64.5);
  const [negTargetPrice, setNegTargetPrice] = useState(60.8);
  const [negMessage, setNegMessage] = useState('');

  // Carrega exemplo realista baseado nos itens existentes do submapa selecionado
  const handleLoadSampleSupplierReturn = () => {
    if (!currentSol || !currentSubMapa) return;
    const supName = selectedSupplierObj?.nome || 'Fornecedor Homologado';
    const sampleLines = currentSubMapa.itens.map((it, idx) => {
      const baseRef = it.menor_preco_unitario || it.preco_referencia || 42.0;
      const simulatedPrice = (baseRef * (0.95 + (idx % 3) * 0.02)).toFixed(2).replace('.', ',');
      return `- [${it.codigo_sienge || it.item_idx}] ${it.descricao} (${it.quantidade} ${it.unidade}) = R$ ${simulatedPrice} / ${it.unidade}`;
    });

    const sampleText = [
      `Cotação Comercial — ${supName}`,
      `Ref.: Solicitação SC #${currentSol.solicitacao_id} | Obra: ${currentSol.obra_nome}`,
      `Prezado setor de Suprimentos Ômega Construtora, seguem nossos preços unitários cotados:`,
      ...sampleLines,
      `Frete: CIF (Entrega na obra inclusa)`,
      `Prazo de Entrega: 03 dias úteis após pedido`,
      `Condição de Pagamento: 28/42 DDL Faturado`
    ].join('\n');

    setSupplierReplyText(sampleText);
    setMatchedResult(null);
    showToast('Retorno de cotação carregado com base nos insumos do Mapa!', 'info');
  };

  // Upload de arquivo TXT/CSV/E-mail de retorno
  const handleFileUploadReturn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const content = String(ev.target?.result || '');
      setSupplierReplyText(content);
      setMatchedResult(null);
      showToast(`Arquivo "${file.name}" carregado para leitura e preenchimento do mapa!`, 'success');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Processar retorno da cotação exclusivamente nos itens existentes do Mapa
  const handleAnalyzeSupplierReturn = async () => {
    if (!currentSol || !currentSubMapa) {
      showToast('Selecione uma Solicitação e Submapa primeiro.', 'warning');
      return;
    }
    if (!selectedSupplierObj) {
      showToast('Selecione o fornecedor que enviou esta cotação.', 'warning');
      return;
    }
    if (!supplierReplyText.trim()) {
      showToast('Cole o texto do retorno da cotação enviada pelo fornecedor.', 'warning');
      return;
    }

    setIsMatchingQuote(true);
    try {
      const result = await matchAndFillMapFromSupplierResponse(
        supplierReplyText,
        currentSubMapa.itens,
        selectedSupplierObj.nome,
        config.gemini_api_key,
        config.gemini_model
      );
      setMatchedResult(result);
      addLog(
        `Retorno de cotação de "${selectedSupplierObj.nome}" processado para os ${currentSubMapa.itens.length} insumos da SC #${currentSol.solicitacao_id}.`,
        'success'
      );
      showToast(
        `${result.itens_preenchidos.length} insumo(s) do Mapa identificados com preços do fornecedor!`,
        'success'
      );
    } finally {
      setIsMatchingQuote(false);
    }
  };

  // Aplica os preços extraídos diretamente no Mapa & Resumo de Compras
  const handleApplyToMap = (goToMapAfter: boolean) => {
    if (!currentSol || !currentSubMapa || !matchedResult || !selectedSupplierObj) return;

    applyExtractedQuotesToMap(
      currentSol.solicitacao_id,
      currentSubMapa.id,
      selectedSupplierObj.id,
      matchedResult
    );

    if (goToMapAfter) {
      setCurrentTab('tab-mapas-web');
    }
  };

  // Gerar mensagem para disparo de cotação dos itens existentes da SC
  const handleGeneratePipelineRequest = () => {
    if (!currentSol || !currentSubMapa) return;
    const sup =
      suggestedSuppliersForCurrent.find(f => f.id === pipelineSupplierId) ||
      suggestedSuppliersForCurrent[0] ||
      currentSubMapa.fornecedores[0];
    const supName = sup?.nome || 'Fornecedor Parceiro';

    const itemsLines = currentSubMapa.itens
      .map(
        (it, idx) =>
          `  ${idx + 1}. [${it.codigo_sienge || it.item_idx}] ${it.descricao} — Qtd: ${it.quantidade} ${it.unidade}`
      )
      .join('\n');

    const msg = [
      `Olá *${supName}*, tudo bem?`,
      `Aqui é do setor de Suprimentos da *Ômega Construtora*.`,
      ``,
      `Solicitamos cotação comercial para a Solicitação *SC #${currentSol.solicitacao_id}* referente à obra *${currentSol.obra_nome}*:`,
      itemsLines,
      ``,
      `Por gentileza, informar na resposta:`,
      `• Preço unitário por item`,
      `• Condição de pagamento (DDL)`,
      `• Tipo de frete (CIF/FOB) e prazo de entrega na obra.`,
      ``,
      `Aguardamos seu retorno.`
    ].join('\n');

    setGeneratedRequestMsg(msg);
    showToast(`Pedido de cotação gerado para ${supName}!`, 'success');
  };

  const handleGenerateNegotiation = () => {
    const discountPct =
      negCurrentPrice > 0
        ? (((negCurrentPrice - negTargetPrice) / negCurrentPrice) * 100).toFixed(1)
        : '5.0';
    const msg = `Prezado comercial da *${negSupplier}*,\n\nEstamos finalizando a equalização do Mapa de Compras na *Ômega Construtora* para o insumo *${negItemDesc}*.\nSua proposta atual está em *R$ ${negCurrentPrice.toFixed(2)}*, porém temos meta de fechamento imediato em *R$ ${negTargetPrice.toFixed(2)}* (-${discountPct}%).\n\nConseguimos chegar nesse valor mantendo condição faturada para emitirmos a Autorização de Fornecimento hoje?`;
    setNegMessage(msg);
    showToast('Mensagem de contraproposta comercial gerada!', 'success');
  };

  const filteredFornecedores = useMemo(() => {
    return correlacoesFornecedores.filter(f => {
      if (filterObraFornecedor !== 'ALL' && !f.obras_atendidas.includes(filterObraFornecedor)) {
        return false;
      }
      if (filterInsumoFornecedor.trim()) {
        const q = filterInsumoFornecedor.toLowerCase();
        const matchCat = f.categorias_insumos.some(c => c.toLowerCase().includes(q));
        const matchKey = f.insumos_frequentes.some(k => k.toLowerCase().includes(q));
        const matchNome = f.fornecedor_nome.toLowerCase().includes(q);
        if (!matchCat && !matchKey && !matchNome) return false;
      }
      return true;
    });
  }, [correlacoesFornecedores, filterObraFornecedor, filterInsumoFornecedor]);

  return (
    <section id="tab-agente-ia" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* BARRA DE FLUXO OPERACIONAL — ETAPA 3 DE 4 */}
      <div
        className="card"
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(30, 41, 59, 0.92) 100%)',
          borderLeft: '4px solid #10b981',
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
                background: '#10b981',
                color: '#052e16',
                fontWeight: 800,
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4
              }}
            >
              ETAPA 3 DE 4
            </span>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
              Agente de Cotação — Preenchimento Inteligente dos Mapas de Compras
            </h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Lê o retorno das cotações enviadas aos fornecedores e preenche automaticamente os preços, prazos e condições nos itens do Mapa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setCurrentTab('tab-mapas-web')}
          >
            ⬅️ Voltar ao Mapa & Resumo
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (currentSol && currentSubMapa) {
                generateOrdersFromApprovedMap(currentSol.solicitacao_id, currentSubMapa.id);
              }
              setCurrentTab('tab-cancelamento');
            }}
            style={{ background: '#ef4444', borderColor: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Ban size={14} /> Avançar p/ Etapa 4: Cancelamento de Pedidos <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO DO AGENTE DE COTAÇÃO */}
      <div className="agente-subnav" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`btn ${subTab === 'preencher-mapa' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setSubTab('preencher-mapa')}
        >
          <FileSpreadsheet size={14} />
          1. Preencher Mapa com Retorno de Cotação
        </button>
        <button
          className={`btn ${subTab === 'fornecedores' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setSubTab('fornecedores')}
        >
          <Users size={14} />
          2. Base de Fornecedores & Histórico
        </button>
        <button
          className={`btn ${subTab === 'pipeline-cotacoes' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setSubTab('pipeline-cotacoes')}
        >
          <Send size={14} />
          3. Disparo & Pipeline de Cotações
        </button>
        <button
          className={`btn ${subTab === 'negociacao' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setSubTab('negociacao')}
        >
          <TrendingDown size={14} />
          4. Negociação & Contraproposta
        </button>
      </div>

      {/* ====================================================================
          SUB-ABA 1: PREENCHER MAPA COM RETORNO DE COTAÇÃO
          ==================================================================== */}
      {subTab === 'preencher-mapa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* SELETOR DE SOLICITAÇÃO, SUBMAPA E FORNECEDOR */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={17} color="#C58B38" />
                  Selecionar Solicitação, Mapa e Fornecedor
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Selecione o mapa e o fornecedor para preencher automaticamente os preços unitários, frete, prazo e condição retornados.
                </p>
              </div>

              {currentSol && currentSubMapa && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => autoFillCorrelatedSuppliers(currentSol.solicitacao_id, currentSubMapa.id, 4)}
                  style={{ borderColor: '#10b981', color: '#34d399', fontWeight: 700 }}
                >
                  <RefreshCw size={13} /> Atualizar Fornecedores do Mapa
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  1. Solicitação de Compra (Obra):
                </label>
                <select
                  className="form-control"
                  value={currentSol?.solicitacao_id || ''}
                  onChange={e => {
                    const nextSol = solicitacoes.find(s => s.solicitacao_id === e.target.value);
                    setSelectedSolicitacaoId(e.target.value);
                    if (nextSol && nextSol.submapas[0]) {
                      setSelectedSubMapaId(nextSol.submapas[0].id);
                    }
                    setMatchedResult(null);
                  }}
                  style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}
                >
                  {solicitacoes.map(s => {
                    const totalItens = s.submapas.reduce((acc, sm) => acc + sm.itens.length, 0);
                    return (
                      <option key={s.id} value={s.solicitacao_id}>
                        SC #{s.solicitacao_id} — {s.obra_nome} ({totalItens} insumos)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  2. Submapa (Classe de Insumo):
                </label>
                <select
                  className="form-control"
                  value={currentSubMapa?.id || ''}
                  onChange={e => {
                    setSelectedSubMapaId(e.target.value);
                    setMatchedResult(null);
                  }}
                  style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}
                >
                  {submapas.map((sm, idx) => (
                    <option key={sm.id} value={sm.id}>
                      Submapa {idx + 1}: {sm.nome} ({sm.itens.length} insumos)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                  3. Fornecedor Participante:
                </label>
                <select
                  className="form-control"
                  value={selectedSupplierId}
                  onChange={e => {
                    setSelectedSupplierId(e.target.value);
                    setMatchedResult(null);
                  }}
                  style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#38bdf8' }}
                >
                  {currentSubMapa?.fornecedores.map((f, idx) => (
                    <option key={`map-f-${f.id}`} value={f.id}>
                      [Coluna {idx + 1} do Mapa] {f.nome}
                    </option>
                  ))}
                  {suggestedSuppliersForCurrent
                    .filter(cf => !currentSubMapa?.fornecedores.some(f => f.id === cf.id))
                    .map(cf => (
                      <option key={`corr-f-${cf.id}`} value={cf.id}>
                        {cf.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* PÍLULAS RÁPIDAS DE FORNECEDORES */}
            {currentSol && currentSubMapa && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Fornecedores participantes neste Mapa (Clique para selecionar):
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {suggestedSuppliersForCurrent.map((cf, i) => {
                    const isSelected = selectedSupplierId === cf.id;
                    return (
                      <button
                        key={cf.id}
                        type="button"
                        onClick={() => {
                          setSelectedSupplierId(cf.id);
                          setMatchedResult(null);
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                          background: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.6)',
                          color: isSelected ? '#38bdf8' : '#cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span style={{ fontWeight: 800, color: '#C58B38' }}>#{i + 1}</span>
                        <span>{cf.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* PAINEL DUPLO: ENTRADA DO RETORNO DO FORNECEDOR + TABELA DE INSUMOS DO MAPA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 14 }}>
            {/* Coluna Esquerda: Retorno recebido do Fornecedor */}
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                  📩 Retorno Recebido do Fornecedor ({selectedSupplierObj?.nome || 'Selecione'})
                </h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleLoadSampleSupplierReturn}
                    style={{ fontSize: 11, padding: '3px 8px' }}
                  >
                    Gerar Exemplo Desta SC
                  </button>
                  <label
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 11, padding: '3px 8px', cursor: 'pointer', margin: 0 }}
                  >
                    <Upload size={12} /> Anexar Retorno (.txt/.csv)
                    <input
                      type="file"
                      accept=".txt,.csv,.eml,.md"
                      onChange={handleFileUploadReturn}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <textarea
                className="form-control"
                rows={9}
                value={supplierReplyText}
                onChange={e => setSupplierReplyText(e.target.value)}
                placeholder="Cole aqui a resposta enviada pelo fornecedor no WhatsApp, corpo do e-mail ou texto da proposta..."
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />

              <button
                className="btn btn-primary"
                onClick={handleAnalyzeSupplierReturn}
                disabled={isMatchingQuote}
                style={{ justifyContent: 'center', fontWeight: 700 }}
              >
                <Sparkles size={15} />
                {isMatchingQuote
                  ? 'Processando preços para os insumos do Mapa...'
                  : `Ler Retorno e Identificar Preços da SC #${currentSol?.solicitacao_id || ''}`}
              </button>
            </div>

            {/* Coluna Direita: Insumos do Mapa & Preços Identificados */}
            <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                    📋 Insumos do Mapa (SC #{currentSol?.solicitacao_id})
                  </h4>
                  <span style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                    ✓ Preenche diretamente os itens da Solicitação
                  </span>
                </div>

                {matchedResult && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleApplyToMap(false)}
                      style={{ borderColor: '#10b981', color: '#34d399', fontWeight: 700 }}
                    >
                      <Check size={13} /> Gravar no Mapa
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApplyToMap(true)}
                      style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 700 }}
                    >
                      <CheckCircle2 size={13} /> Preencher e Abrir Mapa & Resumo
                    </button>
                  </div>
                )}
              </div>

              {matchedResult && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontSize: 11
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Frete Identificado:</span>{' '}
                    <strong>{matchedResult.frete_tipo}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Prazo Entrega:</span>{' '}
                    <strong>{matchedResult.prazo_entrega_dias} dias úteis</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Condição Pagto:</span>{' '}
                    <strong>{matchedResult.condicao_pagamento}</strong>
                  </div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Cód.</th>
                      <th>Insumo da Solicitação</th>
                      <th>Qtd</th>
                      <th>Und</th>
                      <th style={{ textAlign: 'right' }}>Preço Atual ({selectedSupplierObj?.nome})</th>
                      <th style={{ textAlign: 'right', color: '#34d399' }}>Novo Preço Extraído</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentSubMapa?.itens || []).map(item => {
                      const currentPrice = selectedSupplierObj
                        ? item.cotacoes[selectedSupplierObj.id]?.preco_unitario || 0
                        : 0;
                      const matched = matchedResult?.itens_preenchidos.find(m => m.item_id === item.id);
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.codigo_sienge || item.item_idx}</strong></td>
                          <td>{item.descricao}</td>
                          <td>{item.quantidade}</td>
                          <td>{item.unidade}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                            {currentPrice > 0 ? `R$ ${currentPrice.toFixed(2)}` : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: matched ? '#34d399' : '#94a3b8' }}>
                            {matched ? `R$ ${matched.preco_unitario.toFixed(2)}` : 'Aguardando leitura'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-ABA 2: BASE DE FORNECEDORES & HISTÓRICO DE COTAÇÕES
          ==================================================================== */}
      {subTab === 'fornecedores' && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                🏢 Base de Fornecedores Homologados & Histórico de Participações
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Consulte os fornecedores cadastrados, obras atendidas e condições comerciais padrão.
              </p>
            </div>

            {currentSol && currentSubMapa && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  autoFillCorrelatedSuppliers(currentSol.solicitacao_id, currentSubMapa.id, 4);
                  setCurrentTab('tab-mapas-web');
                }}
              >
                <CheckCircle2 size={14} /> Aplicar Fornecedores na SC #{currentSol.solicitacao_id}
              </button>
            )}
          </div>

          {/* Filtros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por Obra (Centro de Custo):</label>
              <select
                className="form-control"
                value={filterObraFornecedor}
                onChange={e => setFilterObraFornecedor(e.target.value)}
                style={{ marginTop: 4, fontSize: 12 }}
              >
                <option value="ALL">Todas as Obras (188, 217, 442, 446, 455)</option>
                <option value="188">Obra 188 — Residencial Jardim das Palmeiras</option>
                <option value="217">Obra 217 — Condomínio Boulevard Alpha</option>
                <option value="442">Obra 442 — Edifício Empresarial Barra Prime</option>
                <option value="446">Obra 446 — Residencial Solar do Parque</option>
                <option value="455">Obra 455 — Parque Logístico Camaçari</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Filtrar por Insumo ou Fornecedor:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Cimento, Aço, Tubo PVC, Brita, Gerdau..."
                value={filterInsumoFornecedor}
                onChange={e => setFilterInsumoFornecedor(e.target.value)}
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Fornecedor Homologado</th>
                  <th>Obras Atendidas</th>
                  <th>Categorias de Insumo</th>
                  <th>Principais Insumos</th>
                  <th>Condições Padrão</th>
                  <th>Última Cotação</th>
                  <th style={{ textAlign: 'center' }}>Participações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFornecedores.map(f => {
                  const lastPart = f.ultimas_participacoes[0];
                  return (
                    <tr key={f.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{f.fornecedor_nome}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {f.contato} • {f.telefone}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {f.obras_atendidas.map(ob => (
                            <span
                              key={ob}
                              style={{
                                background: 'rgba(99, 102, 241, 0.16)',
                                color: '#818cf8',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700
                              }}
                            >
                              Obra {ob}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {f.categorias_insumos.map(cat => (
                            <span
                              key={cat}
                              style={{
                                background: 'rgba(197, 139, 56, 0.18)',
                                color: '#fbbf24',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 600
                              }}
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {f.insumos_frequentes.join(', ')}
                      </td>
                      <td style={{ fontSize: 11 }}>
                        <div>Frete {f.frete_padrao}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{f.condicao_padrao}</div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#34d399' }}>
                        {lastPart ? `${lastPart.data} (SC #${lastPart.solicitacao_id})` : 'Recente'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>
                        {f.ultimas_participacoes.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-ABA 3: PIPELINE DE COTAÇÕES & DISPARO WHATSAPP / E-MAIL
          ==================================================================== */}
      {subTab === 'pipeline-cotacoes' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={17} color="#38bdf8" />
              Gerar Convite de Cotação para Fornecedor
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Solicitação / Obra:</label>
                <select
                  className="form-control"
                  value={currentSol?.solicitacao_id || ''}
                  onChange={e => setSelectedSolicitacaoId(e.target.value)}
                  style={{ marginTop: 4, fontSize: 12 }}
                >
                  {solicitacoes.map(s => (
                    <option key={s.id} value={s.solicitacao_id}>
                      SC #{s.solicitacao_id} — {s.obra_nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Fornecedor Destinatário:</label>
                <select
                  className="form-control"
                  value={pipelineSupplierId}
                  onChange={e => setPipelineSupplierId(e.target.value)}
                  style={{ marginTop: 4, fontSize: 12 }}
                >
                  {suggestedSuppliersForCurrent.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.telefone})
                    </option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleGeneratePipelineRequest}>
                <MessageSquare size={14} /> Gerar Mensagem Padronizada com Insumos da SC
              </button>

              {generatedRequestMsg && (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    className="form-control"
                    rows={8}
                    value={generatedRequestMsg}
                    onChange={e => setGeneratedRequestMsg(e.target.value)}
                    style={{ fontSize: 12, fontFamily: 'monospace' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedRequestMsg);
                        showToast('Mensagem copiada para envio no WhatsApp / E-mail!', 'success');
                      }}
                    >
                      <Copy size={13} /> Copiar Texto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
              📊 Status de Retorno dos Fornecedores (SC #{currentSol?.solicitacao_id})
            </h3>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Coluna</th>
                  <th>Fornecedor</th>
                  <th>Itens Cotados</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {(currentSubMapa?.fornecedores || []).map((f, idx) => {
                  const totalItems = currentSubMapa?.itens.length || 0;
                  const quotedCount = (currentSubMapa?.itens || []).filter(
                    it => (it.cotacoes[f.id]?.preco_unitario || 0) > 0
                  ).length;

                  return (
                    <tr key={f.id}>
                      <td><strong>Forn. {idx + 1}</strong></td>
                      <td>{f.nome}</td>
                      <td>
                        {quotedCount} / {totalItems} insumos
                      </td>
                      <td>
                        <span
                          className="role-pill"
                          style={{
                            background: quotedCount === totalItems ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: quotedCount === totalItems ? '#34d399' : '#fbbf24',
                            padding: '2px 7px',
                            fontSize: 10
                          }}
                        >
                          {quotedCount === totalItems ? 'Mapa Preenchido' : 'Aguardando Retorno'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, padding: '2px 8px' }}
                          onClick={() => {
                            setSelectedSupplierId(f.id);
                            setSubTab('preencher-mapa');
                          }}
                        >
                          Informar Retorno
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-ABA 4: NEGOCIAÇÃO & CONTRAPROPOSTA COMERCIAL
          ==================================================================== */}
      {subTab === 'negociacao' && (
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={18} color="#34d399" />
            Gerador de Contraproposta Comercial (Target Price)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Fornecedor:</label>
              <input
                type="text"
                className="form-control"
                value={negSupplier}
                onChange={e => setNegSupplier(e.target.value)}
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Insumo da Solicitação:</label>
              <input
                type="text"
                className="form-control"
                value={negItemDesc}
                onChange={e => setNegItemDesc(e.target.value)}
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Preço Ofertado (R$):</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={negCurrentPrice}
                onChange={e => setNegCurrentPrice(parseFloat(e.target.value) || 0)}
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Preço Alvo Ômega (R$):</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                value={negTargetPrice}
                onChange={e => setNegTargetPrice(parseFloat(e.target.value) || 0)}
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={handleGenerateNegotiation}>
              Gerar Argumentação de Fechamento
            </button>
          </div>

          {negMessage && (
            <div style={{ marginTop: 14 }}>
              <textarea
                className="form-control"
                rows={5}
                value={negMessage}
                onChange={e => setNegMessage(e.target.value)}
                style={{ fontSize: 13 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(negMessage);
                    showToast('Contraproposta copiada!', 'success');
                  }}
                >
                  <Copy size={13} /> Copiar Contraproposta
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
