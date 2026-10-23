export type UserRole = 'admin' | 'gestor' | 'comprador' | 'engenheiro';

export interface User {
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  allowed_cost_centers: string; // '*' or comma separated e.g. '188, 441, 442'
  active: boolean;
  password?: string;
  created_at: string;
}

export interface InsumoItem {
  id: string;
  item_idx: number;
  codigo_sienge?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  categoria?: string;
  especificacao?: string;
  observacao_resumo?: string;
}

export interface CotacaoFornecedorPreco {
  fornecedor_id: string;
  fornecedor_nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  preco_unitario: number;
  preco_total: number;
  prazo_dias?: number;
  marca?: string;
  frete_tipo?: 'CIF' | 'FOB';
  frete_valor?: number;
  condicao_pagamento?: string;
  validade_dias?: number;
  observacoes?: string;
}

export interface ItemCotado extends InsumoItem {
  cotacoes: Record<string, CotacaoFornecedorPreco>; // key is fornecedor_id
  menor_preco_fornecedor_id?: string;
  menor_preco_unitario?: number;
  fornecedor_vencedor_id?: string;
  vencedor_travado?: boolean;
  preco_referencia?: number;
}

export interface SubMapaFornecedor {
  id: string;
  nome: string;
  contato?: string;
  telefone?: string;
  email?: string;
  condicao_pagamento?: string;
  frete_tipo?: 'CIF' | 'FOB';
  frete_valor?: number;
  prazo_entrega?: string;
  participacoes_obra?: number;
  ultima_cotacao_data?: string;
}

export interface SubMapa {
  id: string;
  nome: string; // e.g. "AÇO E FERRAGEM", "CIMENTO E ALVENARIA"
  categoria: string;
  status: 'Pendente' | 'Em Cotação' | 'Equalizado' | 'Aprovado' | 'Concluído';
  observacao?: string;
  itens: ItemCotado[];
  fornecedores: SubMapaFornecedor[];
}

export interface Solicitacao {
  id: string;
  solicitacao_id: string;
  obra_codigo: string;
  obra_nome: string;
  centro_custo: string;
  data_solicitacao: string;
  prazo_entrega?: string;
  comprador_responsavel: string;
  solicitante?: string;
  urgente?: boolean;
  autorizada_sienge?: boolean;
  observacao_geral?: string;
  status: 'Pendente' | 'Em Cotação' | 'Equalizado' | 'Aprovado' | 'Concluído';
  submapas: SubMapa[];
}

export interface CorrelacaoFornecedorObraInsumo {
  id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  contato: string;
  telefone: string;
  email: string;
  condicao_padrao: string;
  frete_padrao: 'CIF' | 'FOB';
  obras_atendidas: string[]; // ['188', '217', '442', '446', '455']
  categorias_insumos: string[];
  insumos_frequentes: string[];
  ultimas_participacoes: {
    obra_codigo: string;
    obra_nome: string;
    solicitacao_id: string;
    insumo_descricao: string;
    unidade: string;
    ultimo_preco: number;
    data: string;
    venceu: boolean;
  }[];
}

export interface PedidoCancelamento {
  id: string;
  pedido_id: string;
  solicitacao_origem_id?: string;
  obra_codigo: string;
  obra_nome: string;
  centro_custo: string;
  fornecedor_nome: string;
  fornecedor_email: string;
  fornecedor_telefone?: string;
  saldo_total: number;
  data_emissao: string;
  status: 'Pendente' | 'Cancelado' | 'Simulado (OK)' | 'Já Cancelado' | 'Erro';
  itens: {
    item_id: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    saldo_valor: number;
  }[];
  cancelado_em?: string;
  cancelado_por?: string;
  motivo?: string;
}

export type PipelineStatus = 
  | 'Pendente'
  | 'Cotação Enviada'
  | 'Em Negociação'
  | 'Proposta Recebida'
  | 'Fechado'
  | 'Declinado';

export interface PipelineItem {
  id: string;
  solicitacao_id: string;
  submapa_id?: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  contato: string;
  telefone: string;
  email: string;
  status: PipelineStatus;
  submapa_nome: string;
  obra_nome?: string;
  valor_proposta?: number;
  data_envio?: string;
  ultima_interacao: string;
  historico_mensagens: {
    remetente: 'agente' | 'fornecedor';
    canal: 'whatsapp' | 'email';
    texto: string;
    timestamp: string;
  }[];
}

export interface HistoricoPreco {
  id: string;
  insumo_descricao: string;
  unidade: string;
  categoria: string;
  preco_unitario: number;
  fornecedor_nome: string;
  obra_codigo?: string;
  obra_nome: string;
  solicitacao_id?: string;
  data: string;
  tendencia: 'queda' | 'estavel' | 'alta';
}

export interface DiagnosticItem {
  id: string;
  titulo: string;
  categoria: 'sienge' | 'excel' | 'navegador' | 'banco' | 'email' | 'ia';
  status: 'ok' | 'aviso' | 'erro' | 'pendente';
  detalhes: string;
  recomendacao?: string;
  tempo_ms?: number;
}

export interface AppConfig {
  sienge_url: string;
  sienge_url_solicitacoes: string;
  sienge_url_cancelamento: string;
  pdf_path: string;
  excel_contacts_path: string;
  download_dir?: string;
  macro_file?: string;
  dry_run: boolean;
  email_mode: 'drafts' | 'smtp';
  email_provider: 'outlook' | 'gmail' | 'office365';
  send_supplier_emails: boolean;
  send_management_report: boolean;
  management_emails: string[];
  obra_engineers_emails: Record<string, string>;
  delay_between_orders_seconds: number;
  remote_debugging_port?: number;
  cost_centers: string;
  start_date: string;
  end_date: string;
  schedule_time: string;
  schedule_enabled: boolean;
  gemini_api_key: string;
  gemini_model: string;
  considerar_frete_equalizacao: boolean;
  theme: 'dark' | 'light';
}

export interface LogEntry {
  id: string;
  time: string;
  msg: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'sienge';
  timestamp: number;
}
