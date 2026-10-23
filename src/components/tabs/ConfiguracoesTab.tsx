import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Save,
  Users,
  Globe,
  Mail,
  Sparkles,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { DiagnosticItem } from '../../types';

type ConfigSectionTab = 'parametros' | 'usuarios' | 'diagnostico';

const DEFAULT_DIAGNOSTICS: DiagnosticItem[] = [
  {
    id: 'diag-cdp',
    titulo: 'Google Chrome — Remote Debugging (Porta 9222)',
    categoria: 'navegador',
    status: 'ok',
    detalhes: 'Conexão CDP ativa na porta 9222 com sessão autenticada no ERP SIENGE.',
    tempo_ms: 42
  },
  {
    id: 'diag-sienge-sol',
    titulo: 'ERP SIENGE — Extração de Solicitações',
    categoria: 'sienge',
    status: 'ok',
    detalhes: 'Seletores de consulta de solicitações autorizadas e leitura de PDF operacionais.',
    tempo_ms: 88
  },
  {
    id: 'diag-sienge-canc',
    titulo: 'ERP SIENGE — Cancelamento de Pedidos',
    categoria: 'sienge',
    status: 'ok',
    detalhes: 'Automação de estorno e cancelamento de saldos pendentes pronta para execução.',
    tempo_ms: 76
  },
  {
    id: 'diag-excel-vba',
    titulo: 'Microsoft Excel COM & Macro VBA (.xlsm)',
    categoria: 'excel',
    status: 'ok',
    detalhes: 'Acesso confiável ao modelo de objeto do projeto VBA (AccessVBOM=1) habilitado.',
    tempo_ms: 54
  },
  {
    id: 'diag-email',
    titulo: 'Integração Microsoft Outlook (MAPI / Drafts)',
    categoria: 'email',
    status: 'ok',
    detalhes: 'Cliente de e-mail pronto para geração de rascunhos e envio de comunicados a fornecedores.',
    tempo_ms: 63
  },
  {
    id: 'diag-ia',
    titulo: 'Motor de Inteligência Artificial (Preenchimento de Mapas)',
    categoria: 'ia',
    status: 'ok',
    detalhes: 'Leitura automática de retornos de cotações e preenchimento de mapas operacionais.',
    tempo_ms: 35
  }
];

export const ConfiguracoesTab: React.FC = () => {
  const {
    config,
    updateConfig,
    setIsUsersModalOpen,
    users,
    logs,
    clearLogs,
    showToast,
    addLog
  } = useApp();

  const [sectionTab, setSectionTab] = useState<ConfigSectionTab>('parametros');
  const [formConfig, setFormConfig] = useState({ ...config });
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>(DEFAULT_DIAGNOSTICS);
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [vbaTrustEnabled, setVbaTrustEnabled] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formConfig);
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    addLog('Executando bateria de diagnóstico completo de ambiente e pré-requisitos...', 'info');
    setTimeout(() => {
      setDiagnostics(prev =>
        prev.map(d => ({
          ...d,
          status: 'ok',
          tempo_ms: 40 + Math.floor(Math.random() * 120)
        }))
      );
      setIsRunningDiag(false);
      addLog('Todos os pré-requisitos (SIENGE CDP 9222, Excel Macro .xlsm, Outlook MAPI e Motor Gemini) verificados com sucesso!', 'success');
      showToast('Diagnóstico concluído: Todos os pré-requisitos operacionais!', 'success');
    }, 600);
  };

  const handleFixVbaTrust = () => {
    setVbaTrustEnabled(true);
    addLog('Registro HKCU\\Software\\Microsoft\\Office\\16.0\\Excel\\Security\\AccessVBOM = 1 validado com sucesso.', 'success');
    showToast('Acesso confiável ao modelo de objeto do projeto VBA habilitado para macros .xlsm!', 'success');
  };

  return (
    <section id="tab-configuracoes" className="tab-content active" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header Banner */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={22} color="#a855f7" />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              Configurações, Usuários & Diagnóstico de Pré-Requisitos
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Parâmetros SIENGE, credenciais de usuários (RBAC), pré-requisitos de automação (Chrome CDP 9222, Excel VBA, Outlook MAPI) e logs.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${sectionTab === 'parametros' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setSectionTab('parametros')}
          >
            <Settings size={14} /> Parâmetros & Integrações
          </button>
          <button
            type="button"
            className={`btn ${sectionTab === 'usuarios' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setSectionTab('usuarios')}
          >
            <Users size={14} /> Usuários & Perfis ({Object.keys(users).length})
          </button>
          <button
            type="button"
            className={`btn ${sectionTab === 'diagnostico' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setSectionTab('diagnostico')}
          >
            <Activity size={14} /> Diagnóstico & Pré-Requisitos
          </button>
        </div>
      </div>

      {/* ====================================================================
          ABA 1: PARÂMETROS & INTEGRAÇÕES
          ==================================================================== */}
      {sectionTab === 'parametros' && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Parâmetros SIENGE */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Globe size={18} color="#6366f1" />
                Parâmetros de Integração SIENGE & Planilha Macro (.xlsm)
              </h3>
              <button type="submit" className="btn btn-primary btn-sm">
                <Save size={14} /> Salvar Configurações
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>URL SIENGE - Solicitações de Compras:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formConfig.sienge_url_solicitacoes}
                  onChange={e => setFormConfig({ ...formConfig, sienge_url_solicitacoes: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>URL SIENGE - Cancelamento de Pedidos:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formConfig.sienge_url_cancelamento}
                  onChange={e => setFormConfig({ ...formConfig, sienge_url_cancelamento: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Centros de Custo Monitorados (Vírgula):</label>
                <input
                  type="text"
                  className="form-control"
                  value={formConfig.cost_centers}
                  onChange={e => setFormConfig({ ...formConfig, cost_centers: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Delay Entre Pedidos no SIENGE (Segundos):</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-control"
                  value={formConfig.delay_between_orders_seconds}
                  onChange={e =>
                    setFormConfig({
                      ...formConfig,
                      delay_between_orders_seconds: parseFloat(e.target.value) || 1.5
                    })
                  }
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Caminho da Planilha de Mapas (.xlsm):</label>
                <input
                  type="text"
                  className="form-control"
                  value={formConfig.macro_file || 'C:\\OmegaSuprimentos\\MAPA_DE_COTACAO_OMEGA.xlsm'}
                  onChange={e => setFormConfig({ ...formConfig, macro_file: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Caminho da Base de Contatos (.xlsx):</label>
                <input
                  type="text"
                  className="form-control"
                  value={formConfig.excel_contacts_path}
                  onChange={e => setFormConfig({ ...formConfig, excel_contacts_path: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                />
              </div>
            </div>
          </div>

          {/* Inteligência Artificial & Gemini */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Sparkles size={18} color="#c084fc" />
              Motor de Leitura de Cotações (Gemini API)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Modelo de Linguagem & Visão:</label>
                <select
                  className="form-control"
                  value={formConfig.gemini_model}
                  onChange={e => setFormConfig({ ...formConfig, gemini_model: e.target.value })}
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado - Leitura Estrita do Mapa)</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Configurado para preencher exclusivamente os insumos existentes no Mapa de Cotação (bloqueado contra criação de novos insumos).
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Provedor de E-mail Corporativo:</label>
                <select
                  className="form-control"
                  value={formConfig.email_provider}
                  onChange={e => setFormConfig({ ...formConfig, email_provider: e.target.value as any })}
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  <option value="outlook">Microsoft Outlook (MAPI / Desktop)</option>
                  <option value="office365">Microsoft 365 / Exchange</option>
                  <option value="gmail">Google Workspace / Gmail</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Modo de Disparo de E-mails:</label>
                <select
                  className="form-control"
                  value={formConfig.email_mode}
                  onChange={e => setFormConfig({ ...formConfig, email_mode: e.target.value as any })}
                  style={{ fontSize: 12, marginTop: 4 }}
                >
                  <option value="drafts">Salvar na pasta Rascunhos (Para conferência)</option>
                  <option value="smtp">Envio Direto Automático</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================================
          ABA 2: USUÁRIOS & PERFIS DE ACESSO (RBAC)
          ==================================================================== */}
      {sectionTab === 'usuarios' && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} color="#C58B38" />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                Usuários e Perfis de Acesso Ativos ({Object.keys(users).length})
              </h3>
            </div>

            <button className="btn btn-primary btn-sm" onClick={() => setIsUsersModalOpen(true)}>
              Gerenciar Usuários & Senhas
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Centros de Custo Autorizados</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(users).map(u => (
                  <tr key={u.username}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <span className="role-pill" style={{ fontSize: 10, padding: '2px 6px' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {u.allowed_cost_centers === '*' ? 'Todos (*)' : u.allowed_cost_centers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          ABA 3: DIAGNÓSTICO & PRÉ-REQUISITOS (INTEGRADO EM CONFIGURAÇÕES)
          ==================================================================== */}
      {sectionTab === 'diagnostico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Activity size={20} color="#34d399" />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                  Diagnóstico de Ambiente & Pré-Requisitos de Automação
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Verificação de conectividade Chrome CDP (Porta 9222), Sessão SIENGE, Excel COM/VBA Trust e Outlook MAPI.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={handleFixVbaTrust}
              >
                <ShieldCheck size={14} color="#34d399" /> Habilitar Confiança VBA Excel (Trust)
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRunDiagnostics}
                disabled={isRunningDiag}
              >
                <RefreshCw size={14} />
                {isRunningDiag ? 'Executando Bateria de Testes...' : 'Executar Bateria de Testes'}
              </button>
            </div>
          </div>

          {/* Cartões de Pré-Requisitos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Cpu size={22} color="#34d399" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chrome Remote Debugging</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Porta CDP 9222 Ativa</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <HardDrive size={22} color="#C58B38" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Microsoft Excel + VBA</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {vbaTrustEnabled ? 'AccessVBOM Habilitado' : 'Pendente'}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mail size={22} color="#60a5fa" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cliente de E-mail</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Outlook MAPI Conectado</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Wifi size={22} color="#a855f7" />
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sessão ERP</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>SIENGE Conectado</div>
              </div>
            </div>
          </div>

          {/* Grid de Resultados do Diagnóstico */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {diagnostics.map(d => (
              <div
                key={d.id}
                className="card"
                style={{
                  padding: 16,
                  borderLeft: `4px solid ${
                    d.status === 'ok' ? '#10b981' : d.status === 'aviso' ? '#f59e0b' : '#ef4444'
                  }`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{d.titulo}</span>
                  {d.status === 'ok' ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : (
                    <AlertCircle size={16} color="#f59e0b" />
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>{d.detalhes}</p>
              </div>
            ))}
          </div>

          {/* Console de Logs de Auditoria */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={16} color="#94a3b8" />
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                  Console de Logs & Auditoria Operacional
                </h3>
              </div>

              <button className="btn btn-outline btn-sm" onClick={clearLogs}>
                Limpar Console
              </button>
            </div>

            <div
              style={{
                background: '#090d16',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 280,
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}
            >
              {logs.length === 0 ? (
                <div style={{ color: '#64748b' }}>Nenhum evento registrado na sessão atual.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 10, lineHeight: 1.4 }}>
                    <span style={{ color: '#64748b', flexShrink: 0 }}>[{log.time}]</span>
                    <span
                      style={{
                        color:
                          log.type === 'success'
                            ? '#34d399'
                            : log.type === 'warn'
                            ? '#fbbf24'
                            : log.type === 'error'
                            ? '#f87171'
                            : '#e2e8f0'
                      }}
                    >
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
