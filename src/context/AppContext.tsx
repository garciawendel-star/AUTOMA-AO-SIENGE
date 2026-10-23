import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  PedidoCancelamento,
  Solicitacao,
  SubMapaFornecedor,
  PipelineItem,
  HistoricoPreco,
  AppConfig,
  LogEntry,
  CorrelacaoFornecedorObraInsumo
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CONFIG,
  INITIAL_PEDIDOS,
  INITIAL_SOLICITACOES,
  INITIAL_PIPELINE,
  INITIAL_HISTORICO_PRECOS,
  CORRELACAO_FORNECEDORES_OBRA_INSUMO,
  getCorrelatedSuppliersForSubMapa
} from '../data/initialData';
import { ExtractedQuoteForMapOutput } from '../services/geminiService';

interface ToastInfo {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  // Auth
  currentUser: User | null;
  users: Record<string, User>;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (username: string, updates: Partial<User>) => void;
  hasPermission: (perm: string) => boolean;

  // Navigation & UI
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  lanUrl: string;

  // Modals
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isUsersModalOpen: boolean;
  setIsUsersModalOpen: (open: boolean) => void;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;

  // Pedidos Cancelamento
  pedidos: PedidoCancelamento[];
  selectedPedidoIds: Set<string>;
  toggleSelectPedido: (id: string) => void;
  selectAllPedidos: (select: boolean, filteredIds?: string[]) => void;
  deleteSelectedPedidos: () => void;
  executeCancelamento: (dryRun: boolean, motivo?: string) => Promise<{ count: number; total: number }>;
  addPedido: (pedido: PedidoCancelamento) => void;

  // Solicitacoes & Mapas
  solicitacoes: Solicitacao[];
  selectedSolicitacaoId: string | null;
  setSelectedSolicitacaoId: (id: string | null) => void;
  selectedSubMapaId: string | null;
  setSelectedSubMapaId: (id: string | null) => void;
  updateSolicitacao: (id: string, updates: Partial<Solicitacao>) => void;
  addSolicitacao: (sol: Solicitacao) => void;
  deleteSolicitacao: (solicitacaoIdOrInternalId: string) => void;
  chooseWinnerItem: (solicitacaoId: string, submapaId: string, itemId: string, fornecedorId: string, toggleLock?: boolean) => void;
  updateItemPrice: (solicitacaoId: string, submapaId: string, itemId: string, fornecedorId: string, newPrice: number) => void;
  updateItemObservacaoResumo: (solicitacaoId: string, submapaId: string, itemId: string, obs: string) => void;
  updateSupplierHeader: (solicitacaoId: string, submapaId: string, fornecedorId: string, updates: Partial<SubMapaFornecedor>) => void;
  addSupplierColumnToSubMapa: (solicitacaoId: string, submapaId: string) => void;
  removeSupplierColumnFromSubMapa: (solicitacaoId: string, submapaId: string, fornecedorId: string) => void;
  autoFillCorrelatedSuppliers: (solicitacaoId: string, submapaId: string, maxSuppliers?: number) => void;
  applyExtractedQuotesToMap: (solicitacaoId: string, submapaId: string, fornecedorId: string, extracted: ExtractedQuoteForMapOutput) => void;
  runSiengeExtractionAutomation: (costCentersStr: string, startDate: string, endDate: string) => Promise<Solicitacao>;
  generateOrdersFromApprovedMap: (solicitacaoId: string, submapaId: string) => void;

  // Correlacao Fornecedor x Obra x Insumo
  correlacoesFornecedores: CorrelacaoFornecedorObraInsumo[];

  // AI Pipeline & Historico
  pipeline: PipelineItem[];
  updatePipelineStatus: (id: string, status: PipelineItem['status']) => void;
  addPipelineItem: (item: PipelineItem) => void;
  addPipelineMessage: (pipelineId: string, msg: { remetente: 'agente' | 'fornecedor'; canal: 'whatsapp' | 'email'; texto: string }) => void;
  historicoPrecos: HistoricoPreco[];
  addHistoricoPreco: (item: HistoricoPreco) => void;

  // Logs & Toasts
  logs: LogEntry[];
  addLog: (msg: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: ToastInfo['type']) => void;

  // Config
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function recalculateItemWinner(
  item: Solicitacao['submapas'][0]['itens'][0],
  fornecedores: SubMapaFornecedor[],
  considerarFrete: boolean = true,
  totalQtdSubmapa: number = 1
) {
  let lowestPrice = Infinity;
  let lowestSupId: string | undefined = undefined;

  fornecedores.forEach(f => {
    const cot = item.cotacoes[f.id];
    if (cot && cot.preco_unitario > 0) {
      let effectiveUnit = cot.preco_unitario;
      if (considerarFrete && f.frete_tipo === 'FOB' && (f.frete_valor || 0) > 0) {
        effectiveUnit += (f.frete_valor || 0) / Math.max(1, totalQtdSubmapa);
      }
      if (effectiveUnit < lowestPrice) {
        lowestPrice = cot.preco_unitario;
        lowestSupId = f.id;
      }
    }
  });

  const winnerId = item.vencedor_travado && item.fornecedor_vencedor_id
    ? item.fornecedor_vencedor_id
    : lowestSupId;

  return {
    ...item,
    menor_preco_fornecedor_id: lowestSupId,
    menor_preco_unitario: lowestPrice === Infinity ? 0 : lowestPrice,
    fornecedor_vencedor_id: winnerId
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const saved = localStorage.getItem('omega_config_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_CONFIG,
          ...parsed,
          obra_engineers_emails: {
            ...INITIAL_CONFIG.obra_engineers_emails,
            ...(parsed.obra_engineers_emails || {})
          },
          management_emails: Array.isArray(parsed.management_emails)
            ? parsed.management_emails
            : INITIAL_CONFIG.management_emails
        };
      }
    } catch (e) {
      console.warn('Erro ao ler config do localStorage, usando padrão:', e);
    }
    return INITIAL_CONFIG;
  });

  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
      const saved = localStorage.getItem('omega_users_v5');
      return saved ? { ...INITIAL_USERS, ...JSON.parse(saved) } : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUsername = localStorage.getItem('omega_current_user');
    if (savedUsername && users[savedUsername]) {
      return users[savedUsername];
    }
    return users['wendel'] || null;
  });

  const [currentTab, setCurrentTab] = useState<string>('tab-hub');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('omega_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [pedidos, setPedidos] = useState<PedidoCancelamento[]>(() => {
    try {
      const saved = localStorage.getItem('omega_pedidos_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0].itens)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler pedidos do localStorage:', e);
    }
    return INITIAL_PEDIDOS;
  });
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<Set<string>>(new Set());

  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>(() => {
    try {
      const saved = localStorage.getItem('omega_solicitacoes_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((s: any) => s && typeof s.solicitacao_id === 'string' && Array.isArray(s.submapas))
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler solicitações do localStorage:', e);
    }
    return INITIAL_SOLICITACOES;
  });
  const [selectedSolicitacaoId, setSelectedSolicitacaoId] = useState<string | null>('84920');
  const [selectedSubMapaId, setSelectedSubMapaId] = useState<string | null>('sub-84920-aco');

  const [correlacoesFornecedores] = useState<CorrelacaoFornecedorObraInsumo[]>(CORRELACAO_FORNECEDORES_OBRA_INSUMO);

  const [pipeline, setPipeline] = useState<PipelineItem[]>(() => {
    try {
      const saved = localStorage.getItem('omega_pipeline_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_PIPELINE;
  });

  const [historicoPrecos, setHistoricoPrecos] = useState<HistoricoPreco[]>(() => {
    try {
      const saved = localStorage.getItem('omega_historico_precos_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_HISTORICO_PRECOS;
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-1',
      time: new Date().toLocaleTimeString('pt-BR'),
      msg: 'Plataforma Integrada de Suprimentos Ômega iniciada. Fluxo operacional ativo: 1. Extração -> 2. Mapa & Resumos -> 3. Agente de Cotação -> 4. Cancelamento.',
      type: 'info',
      timestamp: Date.now()
    },
    {
      id: 'log-2',
      time: new Date().toLocaleTimeString('pt-BR'),
      msg: 'Conexão SIENGE e base de fornecedores carregadas e prontas para operação.',
      type: 'sienge',
      timestamp: Date.now()
    }
  ]);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('omega_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('omega_config_v5', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('omega_users_v5', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('omega_pedidos_v5', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('omega_solicitacoes_v5', JSON.stringify(solicitacoes));
  }, [solicitacoes]);

  useEffect(() => {
    localStorage.setItem('omega_pipeline_v5', JSON.stringify(pipeline));
  }, [pipeline]);

  useEffect(() => {
    localStorage.setItem('omega_historico_precos_v5', JSON.stringify(historicoPrecos));
  }, [historicoPrecos]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(`Tema alterado para ${next === 'light' ? 'Claro' : 'Escuro'}.`, 'info');
  };

  const showToast = (message: string, type: ToastInfo['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  };

  const addLog = (msg: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      time: new Date().toLocaleTimeString('pt-BR'),
      msg,
      type,
      timestamp: Date.now()
    };
    setLogs(prev => [entry, ...prev.slice(0, 199)]);
  };

  const clearLogs = () => setLogs([]);

  const login = (username: string, password?: string): boolean => {
    const user = users[username.toLowerCase().trim()];
    if (!user) {
      showToast('Usuário não encontrado.', 'error');
      return false;
    }
    if (!user.active) {
      showToast('Usuário desativado pelo administrador.', 'error');
      return false;
    }
    if (password && user.password && user.password !== password) {
      showToast('Senha incorreta.', 'error');
      return false;
    }
    setCurrentUser(user);
    localStorage.setItem('omega_current_user', user.username);
    showToast(`Bem-vindo, ${user.name}!`, 'success');
    addLog(`Usuário "${user.username}" autenticado com perfil [${user.role.toUpperCase()}].`, 'info');
    setIsLoginModalOpen(false);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addLog(`Usuário "${currentUser.username}" desconectou da sessão.`, 'info');
    }
    setCurrentUser(null);
    localStorage.removeItem('omega_current_user');
    setIsLoginModalOpen(true);
  };

  const addUser = (newUser: User) => {
    setUsers(prev => ({ ...prev, [newUser.username]: newUser }));
    addLog(`Novo usuário "${newUser.username}" cadastrado.`, 'info');
    showToast(`Usuário ${newUser.username} cadastrado!`, 'success');
  };

  const updateUser = (username: string, updates: Partial<User>) => {
    setUsers(prev => {
      if (!prev[username]) return prev;
      return { ...prev, [username]: { ...prev[username], ...updates } };
    });
    if (currentUser?.username === username) {
      setCurrentUser(prev => (prev ? { ...prev, ...updates } : null));
    }
    showToast('Usuário atualizado com sucesso.', 'success');
  };

  const hasPermission = (perm: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'gestor') {
      return ['view_hub', 'view_resumos', 'view_mapas', 'view_cancelamento', 'view_solicitacoes', 'view_diagnostico', 'view_config'].includes(perm);
    }
    if (currentUser.role === 'comprador') {
      return ['view_hub', 'view_resumos', 'view_mapas', 'edit_mapas', 'approve_mapas', 'view_cancelamento', 'exec_cancelamento', 'view_solicitacoes', 'exec_solicitacoes'].includes(perm);
    }
    if (currentUser.role === 'engenheiro') {
      return ['view_resumos'].includes(perm);
    }
    return false;
  };

  const toggleSelectPedido = (id: string) => {
    setSelectedPedidoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllPedidos = (select: boolean, filteredIds?: string[]) => {
    if (select) {
      const targetIds = filteredIds || pedidos.filter(p => p.status === 'Pendente').map(p => p.id);
      setSelectedPedidoIds(new Set(targetIds));
    } else {
      setSelectedPedidoIds(new Set());
    }
  };

  const deleteSelectedPedidos = () => {
    if (selectedPedidoIds.size === 0) return;
    const count = selectedPedidoIds.size;
    setPedidos(prev => prev.filter(p => !selectedPedidoIds.has(p.id)));
    setSelectedPedidoIds(new Set());
    addLog(`${count} pedido(s) removido(s) da fila de processamento.`, 'warn');
    showToast(`${count} pedido(s) excluído(s) da lista.`, 'info');
  };

  const executeCancelamento = async (dryRun: boolean, motivo: string = 'Encerramento de etapa / Alinhamento de estoque'): Promise<{ count: number; total: number }> => {
    const targetIds = Array.from(selectedPedidoIds);
    if (targetIds.length === 0) return { count: 0, total: 0 };

    let count = 0;
    let total = 0;
    const nowStr = new Date().toLocaleString('pt-BR');

    addLog(`[CDP 9222] Iniciando rotina de cancelamento no SIENGE para ${targetIds.length} pedido(s) (${dryRun ? 'SIMULAÇÃO DRY-RUN' : 'EXECUÇÃO REAL'})...`, 'sienge');

    setPedidos(prev =>
      prev.map(p => {
        if (targetIds.includes(p.id) && p.status === 'Pendente') {
          count++;
          total += p.saldo_total;
          return {
            ...p,
            status: dryRun ? 'Simulado (OK)' : 'Cancelado',
            cancelado_em: nowStr,
            cancelado_por: currentUser?.username || 'sistema',
            motivo
          };
        }
        return p;
      })
    );

    setSelectedPedidoIds(new Set());
    addLog(`[SIENGE] Cancelamento concluído! ${count} pedido(s) processado(s). Saldo cancelado: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`, 'success');
    showToast(`${count} pedido(s) ${dryRun ? 'simulado(s)' : 'cancelado(s)'} no SIENGE!`, 'success');

    return { count, total };
  };

  const addPedido = (pedido: PedidoCancelamento) => {
    setPedidos(prev => [pedido, ...prev]);
    showToast(`Pedido ${pedido.pedido_id} carregado!`, 'success');
  };

  const updateSolicitacao = (id: string, updates: Partial<Solicitacao>) => {
    setSolicitacoes(prev => prev.map(s => (s.id === id || s.solicitacao_id === id ? { ...s, ...updates } : s)));
  };

  const addSolicitacao = (sol: Solicitacao) => {
    setSolicitacoes(prev => [sol, ...prev]);
    setSelectedSolicitacaoId(sol.solicitacao_id);
    if (sol.submapas.length > 0) {
      setSelectedSubMapaId(sol.submapas[0].id);
    }
    showToast(`Solicitação #${sol.solicitacao_id} adicionada aos Mapas!`, 'success');
  };

  const deleteSolicitacao = (solicitacaoIdOrInternalId: string) => {
    setSolicitacoes(prev => {
      const target = prev.find(s => s.solicitacao_id === solicitacaoIdOrInternalId || s.id === solicitacaoIdOrInternalId);
      const remaining = prev.filter(s => s.solicitacao_id !== solicitacaoIdOrInternalId && s.id !== solicitacaoIdOrInternalId);

      if (target) {
        addLog(`Solicitação #${target.solicitacao_id} (${target.obra_nome}) excluída dos Mapas & Resumos por ${currentUser?.username || 'usuário'}.`, 'warn');
        showToast(`Solicitação #${target.solicitacao_id} excluída com sucesso!`, 'info');
      }

      if (selectedSolicitacaoId === solicitacaoIdOrInternalId || (target && selectedSolicitacaoId === target.solicitacao_id)) {
        const nextSol = remaining[0] || null;
        setSelectedSolicitacaoId(nextSol ? nextSol.solicitacao_id : null);
        setSelectedSubMapaId(nextSol && nextSol.submapas[0] ? nextSol.submapas[0].id : null);
      }

      return remaining;
    });

    // Remove também do pipeline associado
    setPipeline(prev => prev.filter(p => p.solicitacao_id !== solicitacaoIdOrInternalId));
  };

  const chooseWinnerItem = (solicitacaoId: string, submapaId: string, itemId: string, fornecedorId: string, toggleLock: boolean = true) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            return {
              ...sub,
              itens: sub.itens.map(item => {
                if (item.id !== itemId) return item;
                const cotacao = item.cotacoes[fornecedorId];
                if (!cotacao || cotacao.preco_unitario <= 0) return item;
                const isSameLocked = item.vencedor_travado && item.fornecedor_vencedor_id === fornecedorId;
                const nextLocked = toggleLock ? !isSameLocked : true;
                const updated = {
                  ...item,
                  fornecedor_vencedor_id: fornecedorId,
                  vencedor_travado: nextLocked
                };
                return recalculateItemWinner(updated, sub.fornecedores, config.considerar_frete_equalizacao);
              })
            };
          })
        };
      })
    );
    showToast('Fornecedor vencedor atualizado no Resumo e Mapa!', 'success');
  };

  const updateItemPrice = (solicitacaoId: string, submapaId: string, itemId: string, fornecedorId: string, newPrice: number) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            const supObj = sub.fornecedores.find(f => f.id === fornecedorId);
            return {
              ...sub,
              itens: sub.itens.map(item => {
                if (item.id !== itemId) return item;
                const existingCot = item.cotacoes[fornecedorId];
                const updatedCotacoes = {
                  ...item.cotacoes,
                  [fornecedorId]: {
                    ...(existingCot || {
                      fornecedor_id: fornecedorId,
                      fornecedor_nome: supObj?.nome || 'Fornecedor'
                    }),
                    preco_unitario: newPrice,
                    preco_total: Number((newPrice * item.quantidade).toFixed(2))
                  }
                };
                const updatedItem = { ...item, cotacoes: updatedCotacoes };
                return recalculateItemWinner(updatedItem, sub.fornecedores, config.considerar_frete_equalizacao);
              })
            };
          })
        };
      })
    );
  };

  const updateItemObservacaoResumo = (solicitacaoId: string, submapaId: string, itemId: string, obs: string) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            return {
              ...sub,
              itens: sub.itens.map(item => (item.id === itemId ? { ...item, observacao_resumo: obs } : item))
            };
          })
        };
      })
    );
  };

  const updateSupplierHeader = (solicitacaoId: string, submapaId: string, fornecedorId: string, updates: Partial<SubMapaFornecedor>) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            const updatedFornecedores = sub.fornecedores.map(f => (f.id === fornecedorId ? { ...f, ...updates } : f));
            return {
              ...sub,
              fornecedores: updatedFornecedores,
              itens: sub.itens.map(it => recalculateItemWinner(it, updatedFornecedores, config.considerar_frete_equalizacao))
            };
          })
        };
      })
    );
  };

  const addSupplierColumnToSubMapa = (solicitacaoId: string, submapaId: string) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            if (sub.fornecedores.length >= 7) {
              showToast('O limite máximo por mapa é de 7 fornecedores lado a lado.', 'warning');
              return sub;
            }
            const idx = sub.fornecedores.length + 1;
            const newSup: SubMapaFornecedor = {
              id: `sup-custom-${Date.now()}`,
              nome: `FORNECEDOR ${idx}`,
              contato: 'Comercial',
              telefone: '(21) 90000-0000',
              email: 'cotacao@fornecedor.com.br',
              condicao_pagamento: '28 DDL',
              frete_tipo: 'CIF',
              frete_valor: 0
            };
            return {
              ...sub,
              fornecedores: [...sub.fornecedores, newSup]
            };
          })
        };
      })
    );
  };

  const removeSupplierColumnFromSubMapa = (solicitacaoId: string, submapaId: string, fornecedorId: string) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            if (sub.fornecedores.length <= 1) {
              showToast('O mapa deve ter pelo menos 1 coluna de fornecedor.', 'warning');
              return sub;
            }
            const remainingSups = sub.fornecedores.filter(f => f.id !== fornecedorId);
            return {
              ...sub,
              fornecedores: remainingSups,
              itens: sub.itens.map(it => {
                const nextCot = { ...it.cotacoes };
                delete nextCot[fornecedorId];
                return recalculateItemWinner({ ...it, cotacoes: nextCot }, remainingSups, config.considerar_frete_equalizacao);
              })
            };
          })
        };
      })
    );
  };

  /**
   * Preenche de forma automatizada os últimos 3 a 5 fornecedores que participaram
   * das cotações para aquela Obra x Insumo, mantendo ou sugerindo os últimos preços praticados!
   */
  const autoFillCorrelatedSuppliers = (solicitacaoId: string, submapaId: string, maxSuppliers: number = 4) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;
            const descList = sub.itens.map(i => i.descricao);
            const correlatedSups = getCorrelatedSuppliersForSubMapa(sol.obra_codigo, sub.categoria, descList, maxSuppliers);
            if (correlatedSups.length === 0) return sub;

            const updatedItens = sub.itens.map(item => {
              const nextCotacoes = { ...item.cotacoes };
              correlatedSups.forEach((sup, idx) => {
                if (!nextCotacoes[sup.id] || nextCotacoes[sup.id].preco_unitario === 0) {
                  // Busca se este fornecedor tem histórico recente para este insumo
                  const corrObj = CORRELACAO_FORNECEDORES_OBRA_INSUMO.find(c => c.fornecedor_id === sup.id);
                  const part = corrObj?.ultimas_participacoes.find(
                    p => item.descricao.toLowerCase().includes(p.insumo_descricao.toLowerCase().split(' ')[0])
                  );
                  const baseRef = part?.ultimo_preco || item.preco_referencia || 45.0;
                  const variation = idx === 0 ? 0.96 : idx === 1 ? 0.99 : idx === 2 ? 1.02 : 0.98;
                  const sugUnit = Number((baseRef * variation).toFixed(2));

                  nextCotacoes[sup.id] = {
                    fornecedor_id: sup.id,
                    fornecedor_nome: sup.nome,
                    contato: sup.contato,
                    telefone: sup.telefone,
                    email: sup.email,
                    preco_unitario: sugUnit,
                    preco_total: Number((sugUnit * item.quantidade).toFixed(2)),
                    condicao_pagamento: sup.condicao_pagamento,
                    frete_tipo: sup.frete_tipo
                  };
                }
              });

              return recalculateItemWinner({ ...item, cotacoes: nextCotacoes }, correlatedSups, config.considerar_frete_equalizacao);
            });

            return {
              ...sub,
              status: 'Equalizado',
              observacao: `Mapa preenchido e equalizado para ${sub.categoria}.`,
              fornecedores: correlatedSups,
              itens: updatedItens
            };
          })
        };
      })
    );

    addLog(`[MAPA DE COTAÇÃO] Fornecedores preenchidos automaticamente no mapa #${solicitacaoId}.`, 'success');
    showToast('Fornecedores preenchidos automaticamente no mapa!', 'success');
  };

  /**
   * Recebe os preços extraídos da resposta de um fornecedor pelo Agente de Cotação
   * e preenche diretamente as células dos insumos existentes no Mapa e Resumo!
   */
  const applyExtractedQuotesToMap = (
    solicitacaoId: string,
    submapaId: string,
    fornecedorId: string,
    extracted: ExtractedQuoteForMapOutput
  ) => {
    setSolicitacoes(prev =>
      prev.map(sol => {
        if (sol.id !== solicitacaoId && sol.solicitacao_id !== solicitacaoId) return sol;
        return {
          ...sol,
          status: 'Equalizado',
          submapas: sol.submapas.map(sub => {
            if (sub.id !== submapaId) return sub;

            const updatedFornecedores = sub.fornecedores.map(f =>
              f.id === fornecedorId
                ? {
                    ...f,
                    condicao_pagamento: extracted.condicao_pagamento || f.condicao_pagamento,
                    frete_tipo: extracted.frete_tipo || f.frete_tipo,
                    frete_valor: extracted.frete_valor ?? f.frete_valor,
                    prazo_entrega: `${extracted.prazo_entrega_dias || 3} dias`
                  }
                : f
            );

            const targetSup = updatedFornecedores.find(f => f.id === fornecedorId);

            const updatedItens = sub.itens.map(item => {
              const matchedQuote = extracted.itens_preenchidos.find(m => m.item_id === item.id);
              if (!matchedQuote || matchedQuote.preco_unitario <= 0) return item;

              const updatedCotacoes = {
                ...item.cotacoes,
                [fornecedorId]: {
                  fornecedor_id: fornecedorId,
                  fornecedor_nome: targetSup?.nome || extracted.fornecedor_identificado,
                  contato: targetSup?.contato,
                  telefone: targetSup?.telefone,
                  email: targetSup?.email,
                  preco_unitario: matchedQuote.preco_unitario,
                  preco_total: Number((matchedQuote.preco_unitario * item.quantidade).toFixed(2)),
                  marca: matchedQuote.marca || targetSup?.nome.split(' ')[0],
                  condicao_pagamento: extracted.condicao_pagamento,
                  frete_tipo: extracted.frete_tipo,
                  frete_valor: extracted.frete_valor
                }
              };

              return recalculateItemWinner(
                { ...item, cotacoes: updatedCotacoes },
                updatedFornecedores,
                config.considerar_frete_equalizacao
              );
            });

            return {
              ...sub,
              status: 'Equalizado',
              fornecedores: updatedFornecedores,
              itens: updatedItens
            };
          })
        };
      })
    );

    // Atualiza pipeline também
    setPipeline(prev =>
      prev.map(p => {
        if (p.solicitacao_id === solicitacaoId && p.fornecedor_id === fornecedorId) {
          const valorTotal = extracted.itens_preenchidos.reduce((acc, i) => acc + i.preco_total, 0);
          return {
            ...p,
            status: 'Proposta Recebida',
            valor_proposta: valorTotal,
            ultima_interacao: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return p;
      })
    );

    addLog(`[AGENTE COTAÇÃO] Preços retornados por "${extracted.fornecedor_identificado}" preenchidos nos insumos existentes do Mapa #${solicitacaoId}.`, 'success');
    showToast(`Mapa #${solicitacaoId} preenchido automaticamente com a cotação de ${extracted.fornecedor_identificado}!`, 'success');
  };

  /**
   * Simula/Executa a Extração Automatizada de Solicitações na Pág. 1328 do SIENGE,
   * montando o Mapa & Resumo e preenchendo os 3 a 5 últimos fornecedores por Obra x Insumo.
   */
  const runSiengeExtractionAutomation = async (costCentersStr: string, startDate: string, endDate: string): Promise<Solicitacao> => {
    const newSolNum = String(84930 + Math.floor(Math.random() * 65));
    const obrasPool = [
      { code: '188', name: '188 - Residencial Jardim das Palmeiras', cc: '188 - Jardim das Palmeiras', eng: 'Eng. Lucas Martins' },
      { code: '217', name: '217 - Edifício Boulevard Alpha', cc: '217 - Boulevard Alpha', eng: 'Eng. Marcos Paulo' },
      { code: '442', name: '442 - Condomínio Barra Prime Residencial', cc: '442 - Barra Prime', eng: 'Eng. Rodrigo Peixoto' },
      { code: '446', name: '446 - Residencial Solar do Parque', cc: '446 - Solar do Parque', eng: 'Eng. Camila Rocha' }
    ];
    const chosenObra = obrasPool[Math.floor(Math.random() * obrasPool.length)];
    const insumosSample = [
      { idx: 1, cod: '001420', desc: 'Barra Aço CA-50 8.0mm Barra 12m', und: 'BARRA', qtd: 160, ref: 44.50 },
      { idx: 2, cod: '001425', desc: 'Barra Aço CA-50 10.0mm Barra 12m', und: 'BARRA', qtd: 140, ref: 65.00 },
      { idx: 3, cod: '001890', desc: 'Arame Recozido Torcido Duplo 1.25mm Rolo 1kg', und: 'KG', qtd: 80, ref: 15.20 }
    ];

    const correlatedSuppliers = getCorrelatedSuppliersForSubMapa(
      chosenObra.code,
      'AÇO E FERRAGEM',
      insumosSample.map(i => i.desc),
      4
    );

    const subId = `sub-${newSolNum}-aco`;
    const mappedItems = insumosSample.map((ins, i) => {
      const cotacoes: Solicitacao['submapas'][0]['itens'][0]['cotacoes'] = {};
      correlatedSuppliers.forEach((sup, sIdx) => {
        const factor = sIdx === 0 ? 0.94 : sIdx === 1 ? 0.97 : sIdx === 2 ? 0.99 : 0.96;
        const unit = Number((ins.ref * factor).toFixed(2));
        cotacoes[sup.id] = {
          fornecedor_id: sup.id,
          fornecedor_nome: sup.nome,
          contato: sup.contato,
          telefone: sup.telefone,
          email: sup.email,
          preco_unitario: unit,
          preco_total: Number((unit * ins.qtd).toFixed(2)),
          condicao_pagamento: sup.condicao_pagamento,
          frete_tipo: sup.frete_tipo
        };
      });

      return recalculateItemWinner(
        {
          id: `item-${newSolNum}-${i + 1}`,
          item_idx: ins.idx,
          codigo_sienge: ins.cod,
          descricao: ins.desc,
          unidade: ins.und,
          quantidade: ins.qtd,
          categoria: 'AÇO E FERRAGEM',
          observacao_resumo: 'Conforme especificação SIENGE',
          preco_referencia: ins.ref,
          cotacoes
        },
        correlatedSuppliers,
        true
      );
    });

    const newSol: Solicitacao = {
      id: `sol-${newSolNum}`,
      solicitacao_id: newSolNum,
      obra_codigo: chosenObra.code,
      obra_nome: chosenObra.name,
      centro_custo: chosenObra.cc,
      data_solicitacao: new Date().toLocaleDateString('pt-BR'),
      prazo_entrega: '7 dias úteis',
      comprador_responsavel: currentUser?.name || 'Wendel Andrade',
      solicitante: chosenObra.eng,
      urgente: true,
      autorizada_sienge: true,
      observacao_geral: `Solicitação extraída via Automação SIENGE.`,
      status: 'Equalizado',
      submapas: [
        {
          id: subId,
          nome: 'AÇO E FERRAGEM',
          categoria: 'AÇO E FERRAGEM',
          status: 'Equalizado',
          observacao: `Mapa comparativo de cotação estruturado automaticamente.`,
          fornecedores: correlatedSuppliers,
          itens: mappedItems
        }
      ]
    };

    setSolicitacoes(prev => [newSol, ...prev]);
    setSelectedSolicitacaoId(newSol.solicitacao_id);
    setSelectedSubMapaId(subId);

    // Registra também os fornecedores no pipeline do Agente de Cotação
    const newPipeItems: PipelineItem[] = correlatedSuppliers.map((sup, idx) => ({
      id: `pipe-${newSolNum}-${idx}`,
      solicitacao_id: newSolNum,
      submapa_id: subId,
      fornecedor_id: sup.id,
      fornecedor_nome: sup.nome,
      contato: sup.contato || 'Comercial',
      telefone: sup.telefone || '',
      email: sup.email || '',
      submapa_nome: 'AÇO E FERRAGEM',
      obra_nome: chosenObra.name,
      status: 'Cotação Enviada',
      data_envio: new Date().toLocaleString('pt-BR'),
      ultima_interacao: 'Agora',
      historico_mensagens: [
        {
          remetente: 'agente',
          canal: 'whatsapp',
          texto: `Solicitação de cotação #${newSolNum} gerada para ${chosenObra.name}.`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));

    setPipeline(prev => [...newPipeItems, ...prev]);
    return newSol;
  };

  /**
   * Gera pedidos na aba de Cancelamento/Monitoramento a partir de um Mapa aprovado
   */
  const generateOrdersFromApprovedMap = (solicitacaoId: string, submapaId: string) => {
    const sol = solicitacoes.find(s => s.solicitacao_id === solicitacaoId || s.id === solicitacaoId);
    const sub = sol?.submapas.find(m => m.id === submapaId);
    if (!sol || !sub) return;

    let createdCount = 0;
    sub.fornecedores.forEach(f => {
      const wonItems = sub.itens.filter(it => (it.fornecedor_vencedor_id || it.menor_preco_fornecedor_id) === f.id);
      if (wonItems.length === 0) return;

      const total = wonItems.reduce((acc, it) => {
        const c = it.cotacoes[f.id];
        return acc + (c ? c.preco_unitario * it.quantidade : 0);
      }, 0);

      if (total <= 0) return;

      const newPedNum = String(11200 + Math.floor(Math.random() * 799));
      const newPed: PedidoCancelamento = {
        id: `ped-${newPedNum}-${f.id}`,
        pedido_id: newPedNum,
        solicitacao_origem_id: sol.solicitacao_id,
        obra_codigo: sol.obra_codigo,
        obra_nome: sol.obra_nome.replace(/^\d+\s*-\s*/, ''),
        centro_custo: sol.centro_custo,
        fornecedor_nome: f.nome,
        fornecedor_email: f.email || 'comercial@fornecedor.com.br',
        fornecedor_telefone: f.telefone,
        saldo_total: Number(total.toFixed(2)),
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente',
        itens: wonItems.map((it, idx) => {
          const unit = it.cotacoes[f.id]?.preco_unitario || 0;
          return {
            item_id: String(idx + 1),
            descricao: it.descricao,
            quantidade: it.quantidade,
            unidade: it.unidade,
            valor_unitario: unit,
            saldo_valor: Number((unit * it.quantidade).toFixed(2))
          };
        })
      };

      setPedidos(prev => [newPed, ...prev]);
      createdCount++;
    });

    updateSolicitacao(sol.id, { status: 'Aprovado' });
    addLog(`[FLUXO SUPRIMENTOS] Mapa #${sol.solicitacao_id} aprovado! ${createdCount} pedido(s) registrado(s) e disponível(is) na etapa de Cancelamento/Controle de Saldos.`, 'success');
    showToast(`Resumo aprovado! ${createdCount} pedido(s) vinculados ao controle SIENGE.`, 'success');
  };

  const updatePipelineStatus = (id: string, status: PipelineItem['status']) => {
    setPipeline(prev =>
      prev.map(p => (p.id === id ? { ...p, status, ultima_interacao: new Date().toLocaleString('pt-BR') } : p))
    );
    addLog(`Status do fornecedor no pipeline alterado para "${status}".`, 'info');
  };

  const addPipelineItem = (item: PipelineItem) => {
    setPipeline(prev => [item, ...prev]);
    showToast(`Fornecedor ${item.fornecedor_nome} adicionado ao pipeline!`, 'success');
  };

  const addPipelineMessage = (pipelineId: string, msg: { remetente: 'agente' | 'fornecedor'; canal: 'whatsapp' | 'email'; texto: string }) => {
    const timestamp =
      new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' +
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setPipeline(prev =>
      prev.map(p => {
        if (p.id !== pipelineId) return p;
        return {
          ...p,
          ultima_interacao: timestamp,
          historico_mensagens: [...p.historico_mensagens, { ...msg, timestamp }]
        };
      })
    );
  };

  const addHistoricoPreco = (item: HistoricoPreco) => {
    setHistoricoPrecos(prev => [item, ...prev]);
  };

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    showToast('Configurações salvas com sucesso!', 'success');
    addLog('Parâmetros operacionais e conexões atualizados.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        updateUser,
        hasPermission,
        currentTab,
        setCurrentTab,
        theme,
        toggleTheme,
        lanUrl: '192.168.1.105:3000',
        isLoginModalOpen,
        setIsLoginModalOpen,
        isUsersModalOpen,
        setIsUsersModalOpen,
        isUploadModalOpen,
        setIsUploadModalOpen,
        pedidos,
        selectedPedidoIds,
        toggleSelectPedido,
        selectAllPedidos,
        deleteSelectedPedidos,
        executeCancelamento,
        addPedido,
        solicitacoes,
        selectedSolicitacaoId,
        setSelectedSolicitacaoId,
        selectedSubMapaId,
        setSelectedSubMapaId,
        updateSolicitacao,
        addSolicitacao,
        deleteSolicitacao,
        chooseWinnerItem,
        updateItemPrice,
        updateItemObservacaoResumo,
        updateSupplierHeader,
        addSupplierColumnToSubMapa,
        removeSupplierColumnFromSubMapa,
        autoFillCorrelatedSuppliers,
        applyExtractedQuotesToMap,
        runSiengeExtractionAutomation,
        generateOrdersFromApprovedMap,
        correlacoesFornecedores,
        pipeline,
        updatePipelineStatus,
        addPipelineItem,
        addPipelineMessage,
        historicoPrecos,
        addHistoricoPreco,
        logs,
        addLog,
        clearLogs,
        toasts,
        showToast,
        config,
        updateConfig
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
