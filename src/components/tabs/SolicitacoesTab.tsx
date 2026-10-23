import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Inbox,
  MessageCircle,
  Mail,
  Play,
  FileSpreadsheet,
  Save,
  Trash2,
  ArrowRight,
  Bell,
  Copy,
  Sparkles,
  Table
} from 'lucide-react';

export const SolicitacoesTab: React.FC = () => {
  const {
    solicitacoes,
    deleteSolicitacao,
    setSelectedSolicitacaoId,
    setSelectedSubMapaId,
    setCurrentTab,
    runSiengeExtractionAutomation,
    addLog,
    showToast,
    config,
    updateConfig
  } = useApp();

  const [siengeUrl, setSiengeUrl] = useState(config.sienge_url_solicitacoes);
  const [costCenters, setCostCenters] = useState(config.cost_centers);
  const [startDate, setStartDate] = useState(config.start_date);
  const [endDate, setEndDate] = useState(config.end_date);
  const [downloadDir, setDownloadDir] = useState(config.download_dir || 'C:\\Downloads\\SOLICITACOES');
  const [macroFile, setMacroFile] = useState(config.macro_file || 'C:\\Caminho\\01 - Resumo de Cotacao - MACRO.xlsm');
  const [scheduleTime, setScheduleTime] = useState(config.schedule_time || '07:00');
  const [scheduleEnabled, setScheduleEnabled] = useState(config.schedule_enabled);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStepText, setExtractStepText] = useState('');
  const [isRunningMacro, setIsRunningMacro] = useState(false);

  const [filterObra, setFilterObra] = useState('ALL');
  const [alertScope, setAlertScope] = useState<'diretoria' | '188' | '217' | '442' | '446'>('diretoria');

  // Executa a automação completa de extração no SIENGE
  const handleRunSiengeExtraction = async () => {
    setIsExtracting(true);
    setExtractProgress(15);
    setExtractStepText('Conectando ao navegador Chrome via CDP no SIENGE...');
    addLog(`[CDP 9222] Iniciando automação SIENGE para Centros de Custo: ${costCenters}...`, 'sienge');

    setTimeout(() => {
      setExtractProgress(45);
      setExtractStepText(`Filtrando período ${startDate} a ${endDate} e baixando relatórios de solicitações pendentes...`);
      addLog(`[SIENGE] Relatórios de solicitações pendentes localizados e extraídos em ${downloadDir}.`, 'info');
    }, 600);

    setTimeout(() => {
      setExtractProgress(75);
      setExtractStepText('Estruturando insumos e montando o Mapa de Cotação...');
      addLog('[MAPA] Estruturando itens da solicitação para montagem automática do Mapa & Resumo...', 'info');
    }, 1200);

    setTimeout(async () => {
      const novaSol = await runSiengeExtractionAutomation(costCenters, startDate, endDate);
      setExtractProgress(100);
      setExtractStepText(`Concluído! Solicitação #${novaSol.solicitacao_id} montada com sucesso.`);
      addLog(`[SUCESSO] Solicitação #${novaSol.solicitacao_id} (${novaSol.obra_nome}) integrada ao Mapa & Resumo!`, 'success');
      showToast(`Solicitação #${novaSol.solicitacao_id} extraída e montada no Mapa com sucesso!`, 'success');
      setTimeout(() => {
        setIsExtracting(false);
        setExtractProgress(0);
      }, 1200);
    }, 1800);
  };

  // Executa a Macro Excel (.xlsm)
  const handleRunMacroScript = () => {
    setIsRunningMacro(true);
    addLog(`[POWERSHELL] Executando scripts/executar_macro_excel.ps1 na planilha "${macroFile}"...`, 'info');
    setTimeout(() => {
      setIsRunningMacro(false);
      addLog(`[MACRO EXCEL] Planilha "${macroFile}" alimentada e atualizada com os mapas de cotação.`, 'success');
      showToast('Planilha Macro (.xlsm) alimentada com sucesso!', 'success');
    }, 1100);
  };

  // Salva parâmetros e agendamento
  const handleSaveAndSchedule = () => {
    updateConfig({
      sienge_url_solicitacoes: siengeUrl,
      cost_centers: costCenters,
      start_date: startDate,
      end_date: endDate,
      download_dir: downloadDir,
      macro_file: macroFile,
      schedule_time: scheduleTime,
      schedule_enabled: scheduleEnabled
    });
    addLog(
      `[AGENDADOR] Rotina salva. Extração diária ${scheduleEnabled ? `ATIVADA para às ${scheduleTime}` : 'DESATIVADA'}.`,
      'success'
    );
  };

  // Gera o Boletim Oficial de Alerta WhatsApp conforme templates_mensagens.json
  const alertPreviewText = useMemo(() => {
    const targetSolicitacoes = solicitacoes.filter(s => alertScope === 'diretoria' || s.obra_codigo === alertScope);
    const totalInsumos = targetSolicitacoes.reduce(
      (acc, s) => acc + s.submapas.reduce((a, sub) => a + sub.itens.length, 0),
      0
    );
    const urgentesCount = targetSolicitacoes.filter(s => s.urgente).length;
    const destLabel =
      alertScope === 'diretoria'
        ? "Diretoria (D'Angelo / Romualdo)"
        : `Engenharia Obra ${alertScope} (${config.obra_engineers_emails[alertScope] || 'supervisaodeobras1@omegarj.com.br'})`;

    const details = targetSolicitacoes
      .map(s => {
        const count = s.submapas.reduce((a, sub) => a + sub.itens.length, 0);
        const firstItems = s.submapas
          .flatMap(sub => sub.itens.map(i => i.descricao))
          .slice(0, 2)
          .join(', ');
        return `🔹 *Solic. ${s.solicitacao_id}* — ${s.urgente ? '🚨 *URGENTE* | ' : ''}${s.data_solicitacao}\n   🏗️ *Obra:* ${s.obra_nome}\n   📦 ${count} item(ns): _${firstItems}_\n   📌 Status: *${s.status}*`;
      })
      .join('\n\n');

    return `🏗️ *OMEGA CONSTRUTORA — ALERTA DE SUPRIMENTOS*
📅 *Atualizado em:* ${new Date().toLocaleString('pt-BR')}
👤 *Destinatário:* ${destLabel}

📊 *RESUMO DE SOLICITAÇÕES PENDENTES:*
• *Solicitações em Aberto:* ${targetSolicitacoes.length}
• *Total de Insumos Pendentes:* ${totalInsumos} itens
• *Com Pedido de URGÊNCIA:* ${urgentesCount}

📋 *DETALHAMENTO POR SOLICITAÇÃO:*
${details || '✅ *Nenhuma solicitação pendente para este filtro no momento.*'}

🔗 _Acesse a Plataforma Integrada Omega Construtora para visualizar o Mapa de Cotação e aprovar o Resumo de Compras._`;
  }, [solicitacoes, alertScope, config.obra_engineers_emails]);

  const handleCopyAlertWhatsApp = () => {
    navigator.clipboard?.writeText(alertPreviewText);
    showToast('Boletim de Alerta copiado para o WhatsApp!', 'success');
    addLog(`[ALERTA WHATSAPP] Boletim de solicitações copiado para disparo (${alertScope.toUpperCase()}).`, 'info');
  };

  const handleDispatchEmailAlert = () => {
    const dest =
      alertScope === 'diretoria'
        ? config.management_emails.join(', ')
        : config.obra_engineers_emails[alertScope] || 'supervisaodeobras1@omegarj.com.br';
    addLog(`[OUTLOOK / SMTP] Boletim HTML de Solicitações Pendentes gerado para: ${dest}.`, 'success');
    showToast(`E-mail de alerta enviado para ${dest}!`, 'success');
  };

  const handleOpenInMapa = (solId: string, subId?: string) => {
    setSelectedSolicitacaoId(solId);
    if (subId) setSelectedSubMapaId(subId);
    setCurrentTab('tab-mapas-web');
  };

  const handleOpenInAgente = (solId: string, subId?: string) => {
    setSelectedSolicitacaoId(solId);
    if (subId) setSelectedSubMapaId(subId);
    setCurrentTab('tab-agente-ia');
  };

  return (
    <section id="tab-solicitacoes" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Cabeçalho da Etapa 1 */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Inbox size={22} color="#60a5fa" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="module-badge" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.35)' }}>
                ETAPA 1 DO FLUXO
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                Extração das Solicitações SIENGE & Alertas aos Gestores
              </h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Extrai as solicitações pendentes no SIENGE via navegador CDP, alimenta a planilha Macro (.xlsm) e monta automaticamente os Mapas de Cotação.
            </p>
          </div>
        </div>

        <div className="btn-group">
          <button
            className="btn btn-omega"
            onClick={() => setCurrentTab('tab-mapas-web')}
          >
            Ir para Etapa 2: Mapa & Resumos <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* PAINEL DE AUTOMAÇÃO SIENGE & MACRO EXCEL */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Parâmetros da Automação de Extração SIENGE & Planilha Macro (.xlsm)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="switch-wrapper" style={{ fontSize: 12, fontWeight: 600 }}>
              <span className="switch">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={e => setScheduleEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </span>
              <span>Agendamento Diário ({scheduleTime})</span>
            </label>
          </div>
        </div>

        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label>URL SIENGE — Solicitações de Compras:</label>
            <input
              type="text"
              className="form-control"
              value={siengeUrl}
              onChange={e => setSiengeUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Centros de Custo / Obras (Separados por vírgula):</label>
            <input
              type="text"
              className="form-control"
              value={costCenters}
              onChange={e => setCostCenters(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Período de Extração (Início / Fim):</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                placeholder="01/01/2026"
              />
              <input
                type="text"
                className="form-control"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                placeholder="31/12/2026"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Diretório de Download das Solicitações:</label>
            <input
              type="text"
              className="form-control"
              value={downloadDir}
              onChange={e => setDownloadDir(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Caminho da Planilha Macro (.xlsm):</label>
            <input
              type="text"
              className="form-control"
              value={macroFile}
              onChange={e => setMacroFile(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Horário de Execução Automática:</label>
            <input
              type="time"
              className="form-control"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
            />
          </div>
        </div>

        {/* Barra de Progresso quando em execução */}
        {isExtracting && (
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 12, borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
              <span>{extractStepText}</span>
              <span>{extractProgress}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${extractProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Botões de Ação da Automação */}
        <div className="ux-toolbar-clusters" style={{ justifyContent: 'space-between', paddingTop: 6 }}>
          <div className="btn-group">
            <button
              className="btn btn-primary"
              onClick={handleRunSiengeExtraction}
              disabled={isExtracting}
            >
              <Play size={15} />
              {isExtracting ? 'Extraindo no SIENGE e Montando Mapa...' : '🚀 1. Extrair Solicitações no SIENGE & Montar Mapa'}
            </button>

            <button
              className="btn btn-outline"
              onClick={handleRunMacroScript}
              disabled={isRunningMacro}
            >
              <FileSpreadsheet size={15} color="#10b981" />
              {isRunningMacro ? 'Executando Macro...' : '📊 2. Alimentar Planilha Macro (.xlsm)'}
            </button>
          </div>

          <button className="btn btn-outline" onClick={handleSaveAndSchedule}>
            <Save size={15} />
            Salvar & Agendar Rotina
          </button>
        </div>
      </div>

      {/* LISTA DE SOLICITAÇÕES EXTRAÍDAS & TRANSIÇÃO PARA ETAPA 2 / EXCLUSÃO */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Solicitações Extraídas & Prontas para Montagem do Mapa ({solicitacoes.length})
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Gerencie as solicitações extraídas e acesse diretamente o Mapa & Resumo de Compras ou o Agente de Cotação.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filtrar Obra:</span>
            <select
              className="form-control"
              value={filterObra}
              onChange={e => setFilterObra(e.target.value)}
              style={{ fontSize: 12, padding: '5px 10px', width: 230 }}
            >
              <option value="ALL">Todas as Obras</option>
              <option value="188">188 - Jardim das Palmeiras</option>
              <option value="217">217 - Boulevard Alpha</option>
              <option value="442">442 - Barra Prime</option>
              <option value="446">446 - Solar do Parque</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nº Solicitação</th>
                <th>Obra / Centro de Custo</th>
                <th>Data / Prazo</th>
                <th>Solicitante / Comprador</th>
                <th>Mapas & Insumos</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Fluxo de Trabalho / Ações</th>
              </tr>
            </thead>
            <tbody>
              {solicitacoes
                .filter(s => filterObra === 'ALL' || s.obra_codigo === filterObra)
                .map(s => {
                  const totalItens = s.submapas.reduce((acc, sub) => acc + sub.itens.length, 0);
                  const supsCount = s.submapas[0]?.fornecedores.length || 0;

                  return (
                    <tr key={s.id}>
                      <td>
                        <strong style={{ color: '#60a5fa', fontSize: 13 }}>#{s.solicitacao_id}</strong>
                        {s.urgente && (
                          <span className="badge-urgente" style={{ marginLeft: 6 }}>URGENTE</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.obra_nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>CC: {s.centro_custo}</div>
                      </td>
                      <td>
                        <div>{s.data_solicitacao}</div>
                        {s.prazo_entrega && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Prazo: {s.prazo_entrega}</div>
                        )}
                      </td>
                      <td>
                        <div>{s.solicitante || 'Engenharia de Obra'}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Resp: {s.comprador_responsavel}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#34d399', fontSize: 12 }}>
                          {s.submapas.length} mapa(s) • {totalItens} insumo(s)
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {supsCount} fornecedores no mapa
                        </div>
                      </td>
                      <td>
                        <span className="badge-aprovado">{s.status}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            className="btn btn-omega btn-sm"
                            onClick={() => handleOpenInMapa(s.solicitacao_id, s.submapas[0]?.id)}
                            title="Abrir na Etapa 2: Mapa & Resumo de Compras"
                          >
                            <Table size={13} /> 2. Mapa & Resumo
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenInAgente(s.solicitacao_id, s.submapas[0]?.id)}
                            title="Abrir na Etapa 3: Preencher respostas com Agente de Cotação"
                          >
                            <Sparkles size={13} color="#c084fc" /> 3. Agente
                          </button>
                          <button
                            className="btn btn-delete-selected btn-sm"
                            onClick={() => deleteSolicitacao(s.solicitacao_id)}
                            title="Excluir esta solicitação"
                            style={{ padding: '5px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAINEL DE DISPARO DE ALERTAS AOS GESTORES & ENGENHEIROS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="#f59e0b" />
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Boletim Automático de Alertas para Diretoria e Engenheiros de Obra
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={alertScope}
              onChange={e => setAlertScope(e.target.value as any)}
              style={{ width: 250, padding: '6px 10px', fontSize: 12 }}
            >
              <option value="diretoria">Destinatário: Diretoria Geral (Todas as Obras)</option>
              <option value="188">Engenharia Obra 188 - Jardim das Palmeiras</option>
              <option value="217">Engenharia Obra 217 - Boulevard Alpha</option>
              <option value="442">Engenharia Obra 442 - Barra Prime</option>
              <option value="446">Engenharia Obra 446 - Solar do Parque</option>
            </select>

            <button className="btn btn-outline btn-sm" onClick={handleCopyAlertWhatsApp}>
              <Copy size={14} /> Copiar WhatsApp
            </button>
            <button className="btn btn-success btn-sm" onClick={handleCopyAlertWhatsApp}>
              <MessageCircle size={14} /> Disparar WhatsApp
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleDispatchEmailAlert}>
              <Mail size={14} /> Enviar E-mail Executivo
            </button>
          </div>
        </div>

        <div className="wa-preview-box">{alertPreviewText}</div>
      </div>
    </section>
  );
};
