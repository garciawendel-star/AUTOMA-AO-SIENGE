import {
  User,
  Solicitacao,
  PedidoCancelamento,
  PipelineItem,
  HistoricoPreco,
  AppConfig,
  CorrelacaoFornecedorObraInsumo,
  SubMapaFornecedor
} from '../types';

export const INITIAL_USERS: Record<string, User> = {
  wendel: {
    username: 'wendel',
    name: 'Wendel Andrade',
    email: 'suprimentos@omegarj.com.br',
    phone: '(21) 98765-4321',
    role: 'admin',
    allowed_cost_centers: '*',
    active: true,
    password: 'omega123',
    created_at: '2026-01-10 08:30'
  },
  dangelo: {
    username: 'dangelo',
    name: "D'Angelo (Diretoria)",
    email: 'dangelo@omegarj.com.br',
    phone: '(21) 99888-1122',
    role: 'gestor',
    allowed_cost_centers: '*',
    active: true,
    password: 'gestor123',
    created_at: '2026-01-10 08:30'
  },
  romualdo: {
    username: 'romualdo',
    name: 'Romualdo (Diretoria)',
    email: 'romualdo@omegarj.com.br',
    phone: '(21) 99777-3344',
    role: 'gestor',
    allowed_cost_centers: '*',
    active: true,
    password: 'gestor123',
    created_at: '2026-01-10 08:30'
  },
  comprador: {
    username: 'comprador',
    name: 'Equipe de Compras',
    email: 'compras@omegarj.com.br',
    phone: '(21) 98555-6677',
    role: 'comprador',
    allowed_cost_centers: '*',
    active: true,
    password: 'compras123',
    created_at: '2026-01-15 09:00'
  },
  engenharia: {
    username: 'engenharia',
    name: 'Engenharia de Obras',
    email: 'supervisaodeobras1@omegarj.com.br',
    phone: '(21) 98444-7788',
    role: 'engenheiro',
    allowed_cost_centers: '188, 441, 442, 446, 455',
    active: true,
    password: 'obra123',
    created_at: '2026-02-01 10:00'
  }
};

export const INITIAL_CONFIG: AppConfig = {
  sienge_url: 'https://bjgestao.sienge.com.br/sienge/8/index.html',
  sienge_url_solicitacoes: 'https://bjgestao.sienge.com.br/sienge/8/index.html',
  sienge_url_cancelamento: 'https://bjgestao.sienge.com.br/sienge/8/index.html',
  pdf_path: 'Pedidos Pendentes.pdf',
  excel_contacts_path: 'Base_Contatos_Fornecedores.xlsx',
  download_dir: 'C:\\Downloads\\SOLICITACOES',
  macro_file: 'C:\\Caminho\\01 - Resumo de Cotacao - MACRO.xlsm',
  remote_debugging_port: 9222,
  dry_run: false,
  email_mode: 'drafts',
  email_provider: 'outlook',
  send_supplier_emails: true,
  send_management_report: true,
  management_emails: ['diretoria@omegarj.com.br', 'suprimentos@omegarj.com.br'],
  obra_engineers_emails: {
    '188': 'engenharia.jardim@omegarj.com.br',
    '217': 'engenharia.alpha@omegarj.com.br',
    '442': 'engenharia.barra@omegarj.com.br',
    '446': 'engenharia.solar@omegarj.com.br',
    '455': 'engenharia.aguas@omegarj.com.br'
  },
  delay_between_orders_seconds: 1.5,
  cost_centers: '188, 217, 233, 393, 416, 417, 441, 442, 445, 446, 455, 472, 503',
  start_date: '01/01/2026',
  end_date: '31/12/2026',
  schedule_time: '07:00',
  schedule_enabled: true,
  gemini_api_key: '',
  gemini_model: 'gemini-2.5-flash',
  considerar_frete_equalizacao: true,
  theme: 'dark'
};

/**
 * MATRIZ DE CORRELAÇÃO: FORNECEDOR x OBRA x INSUMO
 * Contém o histórico dos últimos fornecedores que participaram das cotações de cada obra e tipo de insumo.
 */
export const CORRELACAO_FORNECEDORES_OBRA_INSUMO: CorrelacaoFornecedorObraInsumo[] = [
  {
    id: 'corr-1',
    fornecedor_id: 'sup-gerdau',
    fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
    contato: 'Carlos Eduardo',
    telefone: '21981234567',
    email: 'carlos.vendas@gerdau.com.br',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['AÇO E FERRAGEM'],
    insumos_frequentes: ['Barra Aço CA-50 8.0mm', 'Barra Aço CA-50 10.0mm', 'Barra Aço CA-50 12.5mm', 'Arame Recozido 18 BWG', 'Tela Soldada Q-196'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84810', insumo_descricao: 'Barra Aço CA-50 8.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 41.50, data: '10/04/2026', venceu: true },
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84810', insumo_descricao: 'Barra Aço CA-50 10.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 64.90, data: '10/04/2026', venceu: false },
      { obra_codigo: '442', obra_nome: 'Condomínio Barra Prime Residencial', solicitacao_id: '84750', insumo_descricao: 'Arame Recozido Torcido Duplo 1.25mm', unidade: 'KG', ultimo_preco: 13.90, data: '02/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-2',
    fornecedor_id: 'sup-macfer',
    fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
    contato: 'Fernanda Rocha',
    telefone: '21972345678',
    email: 'fernanda@macfer.com.br',
    condicao_padrao: '30 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446'],
    categorias_insumos: ['AÇO E FERRAGEM'],
    insumos_frequentes: ['Barra Aço CA-50 8.0mm', 'Barra Aço CA-50 10.0mm', 'Treliça H8', 'Arame Recozido 18 BWG'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84810', insumo_descricao: 'Barra Aço CA-50 10.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 63.20, data: '10/04/2026', venceu: true },
      { obra_codigo: '217', obra_nome: 'Edifício Boulevard Alpha', solicitacao_id: '84690', insumo_descricao: 'Barra Aço CA-50 8.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 43.80, data: '28/03/2026', venceu: false }
    ]
  },
  {
    id: 'corr-3',
    fornecedor_id: 'sup-arcelor',
    fornecedor_nome: 'ARCELORMITTAL BRASIL S/A',
    contato: 'Marcos Vinicius',
    telefone: '21983456789',
    email: 'marcos.aco@arcelormittal.com.br',
    condicao_padrao: '28/35 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['AÇO E FERRAGEM'],
    insumos_frequentes: ['Barra Aço CA-50 8.0mm', 'Barra Aço CA-50 10.0mm', 'Tela Soldada Q-196', 'Aço CA-60 5.0mm'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84810', insumo_descricao: 'Barra Aço CA-50 8.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 42.00, data: '10/04/2026', venceu: false },
      { obra_codigo: '446', obra_nome: 'Residencial Solar do Parque', solicitacao_id: '84712', insumo_descricao: 'Tela Soldada Nervurada Q-196', unidade: 'PAINEL', ultimo_preco: 305.00, data: '01/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-4',
    fornecedor_id: 'sup-belgo',
    fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
    contato: 'Roberto Alves',
    telefone: '21984567890',
    email: 'atendimento@belgobekaert.com.br',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '442', '446', '455'],
    categorias_insumos: ['AÇO E FERRAGEM'],
    insumos_frequentes: ['Arame Recozido Torcido Duplo', 'Tela Soldada Q-196', 'Barra Aço CA-50 10.0mm'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84790', insumo_descricao: 'Arame Recozido Torcido Duplo 1.25mm', unidade: 'KG', ultimo_preco: 14.10, data: '05/04/2026', venceu: false },
      { obra_codigo: '446', obra_nome: 'Residencial Solar do Parque', solicitacao_id: '84712', insumo_descricao: 'Arame Recozido 18 BWG', unidade: 'KG', ultimo_preco: 13.80, data: '01/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-5',
    fornecedor_id: 'sup-ferroaco-rj',
    fornecedor_nome: 'FERRO & AÇO DISTRIBUIDORA RJ',
    contato: 'Henrique Souza',
    telefone: '21985678901',
    email: 'comercial@ferroacorj.com.br',
    condicao_padrao: '21/28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442'],
    categorias_insumos: ['AÇO E FERRAGEM'],
    insumos_frequentes: ['Barra Aço CA-50 8.0mm', 'Barra Aço CA-50 10.0mm', 'Pregos 18x27'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84790', insumo_descricao: 'Barra Aço CA-50 10.0mm Barra 12m', unidade: 'BARRA', ultimo_preco: 64.20, data: '05/04/2026', venceu: false }
    ]
  },
  {
    id: 'corr-6',
    fornecedor_id: 'sup-votorantim',
    fornecedor_nome: 'VOTORANTIM CIMENTOS S.A.',
    contato: 'Ricardo Mendes',
    telefone: '21986112233',
    email: 'comercial.sudeste@votorantim.com',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['CIMENTO E ALVENARIA', 'AGREGADOS'],
    insumos_frequentes: ['Cimento Portland CP II-E-32 Saco 50kg', 'Cimento CP III-40', 'Argamassa Colante AC-II', 'Cal Hidratada CH-III'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84805', insumo_descricao: 'Cimento Portland CP II-E-32 Saco 50kg', unidade: 'SC', ultimo_preco: 32.50, data: '09/04/2026', venceu: true },
      { obra_codigo: '217', obra_nome: 'Edifício Boulevard Alpha', solicitacao_id: '84760', insumo_descricao: 'Cimento Portland CP II-E-32 Saco 50kg', unidade: 'SC', ultimo_preco: 33.00, data: '03/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-7',
    fornecedor_id: 'sup-csn',
    fornecedor_nome: 'CSN CIMENTOS BRASIL S/A',
    contato: 'Luciana Freitas',
    telefone: '21987223344',
    email: 'vendas.rj@csncimentos.com.br',
    condicao_padrao: '30 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446'],
    categorias_insumos: ['CIMENTO E ALVENARIA'],
    insumos_frequentes: ['Cimento Portland CP II-E-32 Saco 50kg', 'Cimento CP II-F-32', 'Cal Hidratada 20kg'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84805', insumo_descricao: 'Cimento Portland CP II-E-32 Saco 50kg', unidade: 'SC', ultimo_preco: 33.20, data: '09/04/2026', venceu: false }
    ]
  },
  {
    id: 'corr-8',
    fornecedor_id: 'sup-maua',
    fornecedor_nome: 'CIMENTO MAUÁ / NACIONAL',
    contato: 'André Gomes',
    telefone: '21988334455',
    email: 'andre.gomes@cimentomaua.com.br',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['CIMENTO E ALVENARIA'],
    insumos_frequentes: ['Cimento Portland CP II-E-32 Saco 50kg', 'Argamassa AC-III 20kg', 'Bloco Cerâmico 14x19x29'],
    ultimas_participacoes: [
      { obra_codigo: '188', obra_nome: 'Residencial Jardim das Palmeiras', solicitacao_id: '84805', insumo_descricao: 'Cimento Portland CP II-E-32 Saco 50kg', unidade: 'SC', ultimo_preco: 32.90, data: '09/04/2026', venceu: false }
    ]
  },
  {
    id: 'corr-9',
    fornecedor_id: 'sup-tigre',
    fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
    contato: 'Julio Cesar',
    telefone: '21987112233',
    email: 'julio.tigre@tigre.com.br',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['HIDRÁULICA', 'ELÉTRICA E TI'],
    insumos_frequentes: ['Tubo PVC Soldável 25mm', 'Tubo Esgoto 100mm', 'Joelho 90 Soldável 25mm', 'Curva Longa 90 100mm'],
    ultimas_participacoes: [
      { obra_codigo: '442', obra_nome: 'Condomínio Barra Prime Residencial', solicitacao_id: '84890', insumo_descricao: 'Tubo PVC Soldável 25mm 3/4" x 6m', unidade: 'VARA', ultimo_preco: 28.90, data: '12/04/2026', venceu: false }
    ]
  },
  {
    id: 'corr-10',
    fornecedor_id: 'sup-amanco',
    fornecedor_nome: 'AMANCO WAVIN BRASIL',
    contato: 'Patrícia Lima',
    telefone: '21988223344',
    email: 'patricia@wavin.com.br',
    condicao_padrao: '30 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446', '455'],
    categorias_insumos: ['HIDRÁULICA', 'ELÉTRICA E TI'],
    insumos_frequentes: ['Tubo PVC Soldável 25mm', 'Tubo Esgoto 100mm', 'Joelho 90 Soldável 25mm', 'Caixa Sifonada 150x150x50'],
    ultimas_participacoes: [
      { obra_codigo: '442', obra_nome: 'Condomínio Barra Prime Residencial', solicitacao_id: '84890', insumo_descricao: 'Tubo PVC Soldável 25mm 3/4" x 6m', unidade: 'VARA', ultimo_preco: 26.50, data: '12/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-11',
    fornecedor_id: 'sup-kronan',
    fornecedor_nome: 'KRONA TUBOS E CONEXÕES S/A',
    contato: 'Sérgio Bastos',
    telefone: '21989334455',
    email: 'sergio.rj@krona.com.br',
    condicao_padrao: '28/42 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446'],
    categorias_insumos: ['HIDRÁULICA', 'ELÉTRICA E TI'],
    insumos_frequentes: ['Tubo PVC Soldável 25mm', 'Joelho 90 Soldável 25mm', 'Eletroduto Corrugado 3/4"'],
    ultimas_participacoes: [
      { obra_codigo: '442', obra_nome: 'Condomínio Barra Prime Residencial', solicitacao_id: '84890', insumo_descricao: 'Tubo PVC Soldável 25mm 3/4" x 6m', unidade: 'VARA', ultimo_preco: 25.90, data: '12/04/2026', venceu: true }
    ]
  },
  {
    id: 'corr-12',
    fornecedor_id: 'sup-hidromar',
    fornecedor_nome: 'HIDROMAR SUPRIMENTOS TÉCNICOS LTDA',
    contato: 'Camila Peixoto',
    telefone: '21981998877',
    email: 'camila@hidromarrj.com.br',
    condicao_padrao: '28 DDL',
    frete_padrao: 'CIF',
    obras_atendidas: ['188', '217', '442', '446'],
    categorias_insumos: ['HIDRÁULICA', 'ACABAMENTO E PVC'],
    insumos_frequentes: ['Tubo PVC Soldável 25mm', 'Joelho 90 Soldável 25mm', 'Registro Gaveta Bruto 3/4" Deca'],
    ultimas_participacoes: [
      { obra_codigo: '442', obra_nome: 'Condomínio Barra Prime Residencial', solicitacao_id: '84890', insumo_descricao: 'Joelho 90 Soldável 25mm Água Fria', unidade: 'UN', ultimo_preco: 2.25, data: '12/04/2026', venceu: false }
    ]
  }
];

/**
 * Retorna automaticamente os últimos 3 a 5 fornecedores correlacionando Fornecedor x Obra x Insumo
 */
export function getCorrelatedSuppliersForSubMapa(
  obraCodigo: string,
  categoria: string,
  insumosDescricoes: string[],
  limit: number = 4
): SubMapaFornecedor[] {
  const scored = CORRELACAO_FORNECEDORES_OBRA_INSUMO.map(c => {
    let score = 0;
    if (c.obras_atendidas.includes(obraCodigo)) score += 30;
    if (c.categorias_insumos.includes(categoria)) score += 40;
    const descMatchCount = insumosDescricoes.filter(desc =>
      c.insumos_frequentes.some(freq => desc.toLowerCase().includes(freq.toLowerCase().split(' ')[0]))
    ).length;
    score += descMatchCount * 15;
    const obraParticipacoes = c.ultimas_participacoes.filter(p => p.obra_codigo === obraCodigo).length;
    score += obraParticipacoes * 10;

    return { corr: c, score, participacoes: Math.max(2, obraParticipacoes + 2) };
  })
    .filter(item => item.score >= 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(5, Math.max(3, limit)));

  return scored.map(item => ({
    id: item.corr.fornecedor_id,
    nome: item.corr.fornecedor_nome,
    contato: item.corr.contato,
    telefone: item.corr.telefone,
    email: item.corr.email,
    condicao_pagamento: item.corr.condicao_padrao,
    frete_tipo: item.corr.frete_padrao,
    frete_valor: 0,
    prazo_entrega: '3 dias úteis',
    participacoes_obra: item.participacoes,
    ultima_cotacao_data: item.corr.ultimas_participacoes[0]?.data || '10/04/2026'
  }));
}

export const INITIAL_SOLICITACOES: Solicitacao[] = [
  {
    id: 'sol-84920',
    solicitacao_id: '84920',
    obra_codigo: '188',
    obra_nome: '188 - Residencial Jardim das Palmeiras',
    centro_custo: '188 - Jardim das Palmeiras',
    data_solicitacao: '14/04/2026',
    prazo_entrega: '22/04/2026',
    comprador_responsavel: 'Wendel Andrade',
    solicitante: 'Eng. Lucas Martins',
    urgente: true,
    autorizada_sienge: true,
    observacao_geral: 'Entrega programada no canteiro da Obra 188 em horário comercial (07h às 16h). Frete CIF incluso.',
    status: 'Equalizado',
    submapas: [
      {
        id: 'sub-84920-aco',
        nome: 'AÇO E FERRAGEM',
        categoria: 'AÇO E FERRAGEM',
        status: 'Equalizado',
        observacao: 'Mapa comparativo equalizado para Aço Estrutural.',
        fornecedores: [
          {
            id: 'sup-gerdau',
            nome: 'GERDAU AÇOS LONGOS S.A.',
            contato: 'Carlos Eduardo',
            telefone: '(21) 98123-4567',
            email: 'carlos.vendas@gerdau.com.br',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '3 dias',
            participacoes_obra: 5,
            ultima_cotacao_data: '10/04/2026'
          },
          {
            id: 'sup-macfer',
            nome: 'MACFER AÇOS E METAIS LTDA',
            contato: 'Fernanda Rocha',
            telefone: '(21) 97234-5678',
            email: 'fernanda@macfer.com.br',
            condicao_pagamento: '30 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '2 dias',
            participacoes_obra: 4,
            ultima_cotacao_data: '10/04/2026'
          },
          {
            id: 'sup-arcelor',
            nome: 'ARCELORMITTAL BRASIL S/A',
            contato: 'Marcos Vinicius',
            telefone: '(21) 98345-6789',
            email: 'marcos.aco@arcelormittal.com.br',
            condicao_pagamento: '28/35 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '4 dias',
            participacoes_obra: 4,
            ultima_cotacao_data: '05/04/2026'
          },
          {
            id: 'sup-belgo',
            nome: 'BELGO BEKAERT ARAMES LTDA',
            contato: 'Roberto Alves',
            telefone: '(21) 98456-7890',
            email: 'atendimento@belgobekaert.com.br',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '3 dias',
            participacoes_obra: 3,
            ultima_cotacao_data: '05/04/2026'
          }
        ],
        itens: [
          {
            id: 'item-1',
            item_idx: 1,
            codigo_sienge: '001420',
            descricao: 'Barra Aço CA-50 8.0mm Barra 12m',
            unidade: 'BARRA',
            quantidade: 220,
            categoria: 'AÇO E FERRAGEM',
            observacao_resumo: 'Gerdau / NBR 7480',
            preco_referencia: 46.00,
            menor_preco_fornecedor_id: 'sup-gerdau',
            menor_preco_unitario: 41.50,
            fornecedor_vencedor_id: 'sup-gerdau',
            cotacoes: {
              'sup-gerdau': {
                fornecedor_id: 'sup-gerdau',
                fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
                preco_unitario: 41.50,
                preco_total: 9130.00,
                prazo_dias: 3,
                marca: 'Gerdau',
                frete_tipo: 'CIF',
                condicao_pagamento: '28 DDL'
              },
              'sup-macfer': {
                fornecedor_id: 'sup-macfer',
                fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
                preco_unitario: 43.80,
                preco_total: 9636.00,
                prazo_dias: 2,
                marca: 'Arcelor/Gerdau',
                frete_tipo: 'CIF',
                condicao_pagamento: '30 DDL'
              },
              'sup-arcelor': {
                fornecedor_id: 'sup-arcelor',
                fornecedor_nome: 'ARCELORMITTAL BRASIL S/A',
                preco_unitario: 42.00,
                preco_total: 9240.00,
                prazo_dias: 4,
                marca: 'ArcelorMittal',
                frete_tipo: 'CIF',
                condicao_pagamento: '28/35 DDL'
              },
              'sup-belgo': {
                fornecedor_id: 'sup-belgo',
                fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
                preco_unitario: 42.90,
                preco_total: 9438.00,
                prazo_dias: 3,
                marca: 'Belgo',
                frete_tipo: 'CIF',
                condicao_pagamento: '28 DDL'
              }
            }
          },
          {
            id: 'item-2',
            item_idx: 2,
            codigo_sienge: '001425',
            descricao: 'Barra Aço CA-50 10.0mm Barra 12m',
            unidade: 'BARRA',
            quantidade: 180,
            categoria: 'AÇO E FERRAGEM',
            observacao_resumo: 'Arcelor / NBR 7480',
            preco_referencia: 68.00,
            menor_preco_fornecedor_id: 'sup-macfer',
            menor_preco_unitario: 63.20,
            fornecedor_vencedor_id: 'sup-macfer',
            cotacoes: {
              'sup-gerdau': {
                fornecedor_id: 'sup-gerdau',
                fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
                preco_unitario: 64.90,
                preco_total: 11682.00,
                prazo_dias: 3,
                marca: 'Gerdau',
                frete_tipo: 'CIF'
              },
              'sup-macfer': {
                fornecedor_id: 'sup-macfer',
                fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
                preco_unitario: 63.20,
                preco_total: 11376.00,
                prazo_dias: 2,
                marca: 'Arcelor',
                frete_tipo: 'CIF'
              },
              'sup-arcelor': {
                fornecedor_id: 'sup-arcelor',
                fornecedor_nome: 'ARCELORMITTAL BRASIL S/A',
                preco_unitario: 65.50,
                preco_total: 11790.00,
                prazo_dias: 4,
                marca: 'ArcelorMittal',
                frete_tipo: 'CIF'
              },
              'sup-belgo': {
                fornecedor_id: 'sup-belgo',
                fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
                preco_unitario: 64.50,
                preco_total: 11610.00,
                prazo_dias: 3,
                marca: 'Belgo',
                frete_tipo: 'CIF'
              }
            }
          },
          {
            id: 'item-3',
            item_idx: 3,
            codigo_sienge: '001890',
            descricao: 'Arame Recozido Torcido Duplo 1.25mm Rolo 1kg',
            unidade: 'KG',
            quantidade: 120,
            categoria: 'AÇO E FERRAGEM',
            observacao_resumo: 'Belgo / Rolo 1kg',
            preco_referencia: 16.50,
            menor_preco_fornecedor_id: 'sup-belgo',
            menor_preco_unitario: 13.70,
            fornecedor_vencedor_id: 'sup-belgo',
            cotacoes: {
              'sup-gerdau': {
                fornecedor_id: 'sup-gerdau',
                fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
                preco_unitario: 13.90,
                preco_total: 1668.00,
                prazo_dias: 3,
                marca: 'Gerdau',
                frete_tipo: 'CIF'
              },
              'sup-macfer': {
                fornecedor_id: 'sup-macfer',
                fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
                preco_unitario: 14.80,
                preco_total: 1776.00,
                prazo_dias: 2,
                marca: 'Morlan',
                frete_tipo: 'CIF'
              },
              'sup-arcelor': {
                fornecedor_id: 'sup-arcelor',
                fornecedor_nome: 'ARCELORMITTAL BRASIL S/A',
                preco_unitario: 14.50,
                preco_total: 1740.00,
                prazo_dias: 4,
                marca: 'ArcelorMittal',
                frete_tipo: 'CIF'
              },
              'sup-belgo': {
                fornecedor_id: 'sup-belgo',
                fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
                preco_unitario: 13.70,
                preco_total: 1644.00,
                prazo_dias: 3,
                marca: 'Belgo',
                frete_tipo: 'CIF'
              }
            }
          }
        ]
      },
      {
        id: 'sub-84920-cim',
        nome: 'CIMENTO E ALVENARIA',
        categoria: 'CIMENTO E ALVENARIA',
        status: 'Equalizado',
        observacao: 'Mapa comparativo equalizado para Cimento e Alvenaria.',
        fornecedores: [
          {
            id: 'sup-votorantim',
            nome: 'VOTORANTIM CIMENTOS S.A.',
            contato: 'Ricardo Mendes',
            telefone: '(21) 98611-2233',
            email: 'comercial.sudeste@votorantim.com',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '2 dias',
            participacoes_obra: 6,
            ultima_cotacao_data: '09/04/2026'
          },
          {
            id: 'sup-csn',
            nome: 'CSN CIMENTOS BRASIL S/A',
            contato: 'Luciana Freitas',
            telefone: '(21) 98722-3344',
            email: 'vendas.rj@csncimentos.com.br',
            condicao_pagamento: '30 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '3 dias',
            participacoes_obra: 4,
            ultima_cotacao_data: '09/04/2026'
          },
          {
            id: 'sup-maua',
            nome: 'CIMENTO MAUÁ / NACIONAL',
            contato: 'André Gomes',
            telefone: '(21) 98833-4455',
            email: 'andre.gomes@cimentomaua.com.br',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            frete_valor: 0,
            prazo_entrega: '2 dias',
            participacoes_obra: 5,
            ultima_cotacao_data: '09/04/2026'
          }
        ],
        itens: [
          {
            id: 'item-c1',
            item_idx: 1,
            codigo_sienge: '000210',
            descricao: 'Cimento Portland CP II-E-32 Saco 50kg',
            unidade: 'SC',
            quantidade: 300,
            categoria: 'CIMENTO E ALVENARIA',
            observacao_resumo: 'Obras Estruturais / Paletizado',
            preco_referencia: 35.00,
            menor_preco_fornecedor_id: 'sup-votorantim',
            menor_preco_unitario: 31.90,
            fornecedor_vencedor_id: 'sup-votorantim',
            cotacoes: {
              'sup-votorantim': {
                fornecedor_id: 'sup-votorantim',
                fornecedor_nome: 'VOTORANTIM CIMENTOS S.A.',
                preco_unitario: 31.90,
                preco_total: 9570.00,
                marca: 'Votoran'
              },
              'sup-csn': {
                fornecedor_id: 'sup-csn',
                fornecedor_nome: 'CSN CIMENTOS BRASIL S/A',
                preco_unitario: 32.80,
                preco_total: 9840.00,
                marca: 'CSN'
              },
              'sup-maua': {
                fornecedor_id: 'sup-maua',
                fornecedor_nome: 'CIMENTO MAUÁ / NACIONAL',
                preco_unitario: 32.40,
                preco_total: 9720.00,
                marca: 'Mauá'
              }
            }
          },
          {
            id: 'item-c2',
            item_idx: 2,
            codigo_sienge: '000315',
            descricao: 'Argamassa Colante AC-III Cinza Saco 20kg',
            unidade: 'SC',
            quantidade: 85,
            categoria: 'CIMENTO E ALVENARIA',
            observacao_resumo: 'Piso sobre Piso / Fachada',
            preco_referencia: 29.90,
            menor_preco_fornecedor_id: 'sup-maua',
            menor_preco_unitario: 25.50,
            fornecedor_vencedor_id: 'sup-maua',
            cotacoes: {
              'sup-votorantim': {
                fornecedor_id: 'sup-votorantim',
                fornecedor_nome: 'VOTORANTIM CIMENTOS S.A.',
                preco_unitario: 26.80,
                preco_total: 2278.00,
                marca: 'Votomassa'
              },
              'sup-csn': {
                fornecedor_id: 'sup-csn',
                fornecedor_nome: 'CSN CIMENTOS BRASIL S/A',
                preco_unitario: 27.10,
                preco_total: 2303.50,
                marca: 'CSN'
              },
              'sup-maua': {
                fornecedor_id: 'sup-maua',
                fornecedor_nome: 'CIMENTO MAUÁ / NACIONAL',
                preco_unitario: 25.50,
                preco_total: 2167.50,
                marca: 'Quartzolit/Mauá'
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: 'sol-84925',
    solicitacao_id: '84925',
    obra_codigo: '442',
    obra_nome: '442 - Condomínio Barra Prime Residencial',
    centro_custo: '442 - Barra Prime',
    data_solicitacao: '17/04/2026',
    prazo_entrega: '25/04/2026',
    comprador_responsavel: 'Equipe de Compras',
    solicitante: 'Eng. Rodrigo Peixoto',
    urgente: false,
    autorizada_sienge: true,
    observacao_geral: 'Material hidráulico para prumadas do Bloco B. Entregar com nota fiscal eletrônica XML.',
    status: 'Em Cotação',
    submapas: [
      {
        id: 'sub-84925-hid',
        nome: 'HIDRÁULICA',
        categoria: 'HIDRÁULICA',
        status: 'Em Cotação',
        observacao: 'Mapa comparativo de Hidráulica.',
        fornecedores: [
          {
            id: 'sup-tigre',
            nome: 'TIGRE TUBOS E CONEXÕES S/A',
            contato: 'Julio Cesar',
            telefone: '(21) 98711-2233',
            email: 'julio.tigre@tigre.com.br',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            participacoes_obra: 5,
            ultima_cotacao_data: '12/04/2026'
          },
          {
            id: 'sup-amanco',
            nome: 'AMANCO WAVIN BRASIL',
            contato: 'Patrícia Lima',
            telefone: '(21) 98822-3344',
            email: 'patricia@wavin.com.br',
            condicao_pagamento: '30 DDL',
            frete_tipo: 'CIF',
            participacoes_obra: 4,
            ultima_cotacao_data: '12/04/2026'
          },
          {
            id: 'sup-kronan',
            nome: 'KRONA TUBOS E CONEXÕES S/A',
            contato: 'Sérgio Bastos',
            telefone: '(21) 98933-4455',
            email: 'sergio.rj@krona.com.br',
            condicao_pagamento: '28/42 DDL',
            frete_tipo: 'CIF',
            participacoes_obra: 3,
            ultima_cotacao_data: '12/04/2026'
          },
          {
            id: 'sup-hidromar',
            nome: 'HIDROMAR SUPRIMENTOS TÉCNICOS LTDA',
            contato: 'Camila Peixoto',
            telefone: '(21) 98199-8877',
            email: 'camila@hidromarrj.com.br',
            condicao_pagamento: '28 DDL',
            frete_tipo: 'CIF',
            participacoes_obra: 3,
            ultima_cotacao_data: '12/04/2026'
          }
        ],
        itens: [
          {
            id: 'item-h1',
            item_idx: 1,
            codigo_sienge: '004102',
            descricao: 'Tubo PVC Soldável 25mm 3/4" x 6m Água Fria',
            unidade: 'VARA',
            quantidade: 90,
            categoria: 'HIDRÁULICA',
            observacao_resumo: 'Linha Predial NBR 5648',
            preco_referencia: 32.00,
            menor_preco_fornecedor_id: 'sup-kronan',
            menor_preco_unitario: 25.90,
            fornecedor_vencedor_id: 'sup-kronan',
            cotacoes: {
              'sup-tigre': {
                fornecedor_id: 'sup-tigre',
                fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
                preco_unitario: 28.90,
                preco_total: 2601.00,
                prazo_dias: 2,
                marca: 'Tigre'
              },
              'sup-amanco': {
                fornecedor_id: 'sup-amanco',
                fornecedor_nome: 'AMANCO WAVIN BRASIL',
                preco_unitario: 26.50,
                preco_total: 2385.00,
                prazo_dias: 3,
                marca: 'Amanco Wavin'
              },
              'sup-kronan': {
                fornecedor_id: 'sup-kronan',
                fornecedor_nome: 'KRONA TUBOS E CONEXÕES S/A',
                preco_unitario: 25.90,
                preco_total: 2331.00,
                prazo_dias: 3,
                marca: 'Krona'
              },
              'sup-hidromar': {
                fornecedor_id: 'sup-hidromar',
                fornecedor_nome: 'HIDROMAR SUPRIMENTOS TÉCNICOS LTDA',
                preco_unitario: 27.40,
                preco_total: 2466.00,
                prazo_dias: 2,
                marca: 'Tigre/Amanco'
              }
            }
          },
          {
            id: 'item-h2',
            item_idx: 2,
            codigo_sienge: '004215',
            descricao: 'Joelho 90 Graus Soldável 25mm Água Fria',
            unidade: 'UN',
            quantidade: 150,
            categoria: 'HIDRÁULICA',
            observacao_resumo: 'Linha Soldável Marrom',
            preco_referencia: 2.80,
            menor_preco_fornecedor_id: 'sup-amanco',
            menor_preco_unitario: 2.10,
            fornecedor_vencedor_id: 'sup-amanco',
            cotacoes: {
              'sup-tigre': {
                fornecedor_id: 'sup-tigre',
                fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
                preco_unitario: 2.35,
                preco_total: 352.50,
                prazo_dias: 2,
                marca: 'Tigre'
              },
              'sup-amanco': {
                fornecedor_id: 'sup-amanco',
                fornecedor_nome: 'AMANCO WAVIN BRASIL',
                preco_unitario: 2.10,
                preco_total: 315.00,
                prazo_dias: 3,
                marca: 'Amanco Wavin'
              },
              'sup-kronan': {
                fornecedor_id: 'sup-kronan',
                fornecedor_nome: 'KRONA TUBOS E CONEXÕES S/A',
                preco_unitario: 2.15,
                preco_total: 322.50,
                prazo_dias: 3,
                marca: 'Krona'
              },
              'sup-hidromar': {
                fornecedor_id: 'sup-hidromar',
                fornecedor_nome: 'HIDROMAR SUPRIMENTOS TÉCNICOS LTDA',
                preco_unitario: 2.25,
                preco_total: 337.50,
                prazo_dias: 2,
                marca: 'Amanco'
              }
            }
          },
          {
            id: 'item-h3',
            item_idx: 3,
            codigo_sienge: '004380',
            descricao: 'Tubo PVC Esgoto Série Normal 100mm x 6m',
            unidade: 'VARA',
            quantidade: 60,
            categoria: 'HIDRÁULICA',
            observacao_resumo: 'Ponta e Bolsa / NBR 5688',
            preco_referencia: 84.00,
            menor_preco_fornecedor_id: 'sup-amanco',
            menor_preco_unitario: 74.50,
            fornecedor_vencedor_id: 'sup-amanco',
            cotacoes: {
              'sup-tigre': {
                fornecedor_id: 'sup-tigre',
                fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
                preco_unitario: 78.90,
                preco_total: 4734.00,
                prazo_dias: 2,
                marca: 'Tigre'
              },
              'sup-amanco': {
                fornecedor_id: 'sup-amanco',
                fornecedor_nome: 'AMANCO WAVIN BRASIL',
                preco_unitario: 74.50,
                preco_total: 4470.00,
                prazo_dias: 3,
                marca: 'Amanco Wavin'
              },
              'sup-kronan': {
                fornecedor_id: 'sup-kronan',
                fornecedor_nome: 'KRONA TUBOS E CONEXÕES S/A',
                preco_unitario: 75.80,
                preco_total: 4548.00,
                prazo_dias: 3,
                marca: 'Krona'
              },
              'sup-hidromar': {
                fornecedor_id: 'sup-hidromar',
                fornecedor_nome: 'HIDROMAR SUPRIMENTOS TÉCNICOS LTDA',
                preco_unitario: 77.00,
                preco_total: 4620.00,
                prazo_dias: 2,
                marca: 'Amanco'
              }
            }
          }
        ]
      }
    ]
  }
];

export const INITIAL_PEDIDOS: PedidoCancelamento[] = [
  {
    id: 'ped-10822',
    pedido_id: '10822',
    solicitacao_origem_id: '84810',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    centro_custo: '188 - Jardim das Palmeiras',
    fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
    fornecedor_email: 'carlos.vendas@gerdau.com.br',
    fornecedor_telefone: '(21) 98123-4567',
    saldo_total: 14850.00,
    data_emissao: '12/03/2026',
    status: 'Pendente',
    itens: [
      {
        item_id: '1',
        descricao: 'Barra de Aço CA-50 10.0mm x 12m',
        quantidade: 150,
        unidade: 'BARRA',
        valor_unitario: 65.00,
        saldo_valor: 9750.00
      },
      {
        item_id: '2',
        descricao: 'Barra de Aço CA-50 12.5mm x 12m',
        quantidade: 50,
        unidade: 'BARRA',
        valor_unitario: 102.00,
        saldo_valor: 5100.00
      }
    ]
  },
  {
    id: 'ped-10945',
    pedido_id: '10945',
    solicitacao_origem_id: '84760',
    obra_codigo: '217',
    obra_nome: 'Edifício Boulevard Alpha',
    centro_custo: '217 - Boulevard Alpha',
    fornecedor_nome: 'VOTORANTIM CIMENTOS S.A.',
    fornecedor_email: 'comercial.sudeste@votorantim.com',
    fornecedor_telefone: '(21) 98611-2233',
    saldo_total: 7920.00,
    data_emissao: '18/03/2026',
    status: 'Pendente',
    itens: [
      {
        item_id: '1',
        descricao: 'Cimento Portland CP II-E-32 Saco 50kg',
        quantidade: 240,
        unidade: 'SC',
        valor_unitario: 33.00,
        saldo_valor: 7920.00
      }
    ]
  },
  {
    id: 'ped-11012',
    pedido_id: '11012',
    solicitacao_origem_id: '84890',
    obra_codigo: '442',
    obra_nome: 'Condomínio Barra Prime Residencial',
    centro_custo: '442 - Barra Prime',
    fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
    fornecedor_email: 'julio.tigre@tigre.com.br',
    fornecedor_telefone: '(21) 98711-2233',
    saldo_total: 6340.50,
    data_emissao: '25/03/2026',
    status: 'Pendente',
    itens: [
      {
        item_id: '1',
        descricao: 'Tubo Esgoto Serie Normal 100mm x 6m',
        quantidade: 45,
        unidade: 'VARA',
        valor_unitario: 82.00,
        saldo_valor: 3690.00
      },
      {
        item_id: '2',
        descricao: 'Curva Longa 90 Graus 100mm Esgoto',
        quantidade: 60,
        unidade: 'UN',
        valor_unitario: 44.175,
        saldo_valor: 2650.50
      }
    ]
  },
  {
    id: 'ped-11105',
    pedido_id: '11105',
    solicitacao_origem_id: '84712',
    obra_codigo: '446',
    obra_nome: 'Residencial Solar do Parque',
    centro_custo: '446 - Solar do Parque',
    fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
    fornecedor_email: 'atendimento@belgobekaert.com.br',
    fornecedor_telefone: '(21) 98456-7890',
    saldo_total: 18400.00,
    data_emissao: '02/04/2026',
    status: 'Cancelado',
    cancelado_em: '15/04/2026 14:22',
    cancelado_por: 'wendel',
    motivo: 'Ajuste de estoque e troca por tela soldada',
    itens: [
      {
        item_id: '1',
        descricao: 'Arame Recozido 18 BWG em Rolo 1kg',
        quantidade: 200,
        unidade: 'KG',
        valor_unitario: 14.50,
        saldo_valor: 2900.00
      },
      {
        item_id: '2',
        descricao: 'Tela Soldada Nervurada Q-196 (Painel 2,45x6,00m)',
        quantidade: 50,
        unidade: 'PAINEL',
        valor_unitario: 310.00,
        saldo_valor: 15500.00
      }
    ]
  },
  {
    id: 'ped-11190',
    pedido_id: '11190',
    solicitacao_origem_id: '84805',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    centro_custo: '188 - Jardim das Palmeiras',
    fornecedor_nome: 'LEROY MERLIN COMPANHIA BRASILEIRA',
    fornecedor_email: 'pro.barra@leroymerlin.com.br',
    fornecedor_telefone: '(21) 3987-6000',
    saldo_total: 4210.80,
    data_emissao: '10/04/2026',
    status: 'Pendente',
    itens: [
      {
        item_id: '1',
        descricao: 'Compensado Resinado 12mm 2,20x1,10m',
        quantidade: 40,
        unidade: 'CHAPA',
        valor_unitario: 105.27,
        saldo_valor: 4210.80
      }
    ]
  }
];

export const INITIAL_PIPELINE: PipelineItem[] = [
  {
    id: 'pipe-1',
    solicitacao_id: '84920',
    submapa_id: 'sub-84920-aco',
    fornecedor_id: 'sup-gerdau',
    fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
    contato: 'Carlos Eduardo',
    telefone: '(21) 98123-4567',
    email: 'carlos.vendas@gerdau.com.br',
    submapa_nome: 'AÇO E FERRAGEM',
    obra_nome: '188 - Residencial Jardim das Palmeiras',
    status: 'Fechado',
    valor_proposta: 22480.00,
    data_envio: '14/04/2026 10:15',
    ultima_interacao: '16/04/2026 16:40',
    historico_mensagens: [
      {
        remetente: 'agente',
        canal: 'whatsapp',
        texto: 'Olá Carlos, solicitamos cotação de AÇO E FERRAGEM para a Obra 188 - Jardim das Palmeiras (Solicitação 84920).',
        timestamp: '14/04 10:15'
      },
      {
        remetente: 'fornecedor',
        canal: 'whatsapp',
        texto: 'Boa tarde Wendel, segue proposta comercial: Barra 8mm R$ 41,50 | Barra 10mm R$ 64,90 | Arame Recozido R$ 13,90. Prazo 3 dias úteis, 28 DDL CIF.',
        timestamp: '15/04 11:30'
      },
      {
        remetente: 'agente',
        canal: 'whatsapp',
        texto: 'Valores preenchidos automaticamente no Mapa de Cotação #84920.',
        timestamp: '16/04 16:40'
      }
    ]
  },
  {
    id: 'pipe-2',
    solicitacao_id: '84920',
    submapa_id: 'sub-84920-aco',
    fornecedor_id: 'sup-macfer',
    fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
    contato: 'Fernanda Rocha',
    telefone: '(21) 97234-5678',
    email: 'fernanda@macfer.com.br',
    submapa_nome: 'AÇO E FERRAGEM',
    obra_nome: '188 - Residencial Jardim das Palmeiras',
    status: 'Fechado',
    valor_proposta: 22788.00,
    data_envio: '14/04/2026 10:20',
    ultima_interacao: '16/04/2026 17:00',
    historico_mensagens: [
      {
        remetente: 'agente',
        canal: 'email',
        texto: 'Solicitação de cotação de preços para Obra 188 - Jardim das Palmeiras (Solicitação 84920).',
        timestamp: '14/04 10:20'
      },
      {
        remetente: 'fornecedor',
        canal: 'email',
        texto: 'Enviamos nossa cotação: Barra 8mm R$ 43,80 | Barra 10mm R$ 63,20 | Arame R$ 14,80. 30 DDL CIF.',
        timestamp: '15/04 14:10'
      }
    ]
  },
  {
    id: 'pipe-3',
    solicitacao_id: '84925',
    submapa_id: 'sub-84925-hid',
    fornecedor_id: 'sup-tigre',
    fornecedor_nome: 'TIGRE TUBOS E CONEXÕES S/A',
    contato: 'Julio Cesar',
    telefone: '(21) 98711-2233',
    email: 'julio.tigre@tigre.com.br',
    submapa_nome: 'HIDRÁULICA',
    obra_nome: '442 - Condomínio Barra Prime Residencial',
    status: 'Em Negociação',
    valor_proposta: 7687.50,
    data_envio: '17/04/2026 11:00',
    ultima_interacao: '18/04/2026 09:20',
    historico_mensagens: [
      {
        remetente: 'agente',
        canal: 'whatsapp',
        texto: 'Olá Julio, solicitamos cotação dos insumos da Solicitação 84925 para a Obra 442 - Barra Prime.',
        timestamp: '17/04 11:00'
      },
      {
        remetente: 'fornecedor',
        canal: 'whatsapp',
        texto: 'Tubo 25mm R$ 28,90 | Joelho 25mm R$ 2,35 | Tubo Esgoto 100mm R$ 78,90. 28 DDL CIF.',
        timestamp: '17/04 17:45'
      }
    ]
  },
  {
    id: 'pipe-4',
    solicitacao_id: '84925',
    submapa_id: 'sub-84925-hid',
    fornecedor_id: 'sup-amanco',
    fornecedor_nome: 'AMANCO WAVIN BRASIL',
    contato: 'Patrícia Lima',
    telefone: '(21) 98822-3344',
    email: 'patricia@wavin.com.br',
    submapa_nome: 'HIDRÁULICA',
    obra_nome: '442 - Condomínio Barra Prime Residencial',
    status: 'Proposta Recebida',
    valor_proposta: 7170.00,
    data_envio: '17/04/2026 11:05',
    ultima_interacao: '17/04/2026 18:30',
    historico_mensagens: [
      {
        remetente: 'agente',
        canal: 'whatsapp',
        texto: 'Olá Patrícia, solicitamos cotação de tubos e conexões hidráulicas (Solic. 84925 - Obra 442).',
        timestamp: '17/04 11:05'
      },
      {
        remetente: 'fornecedor',
        canal: 'whatsapp',
        texto: 'Tubo 25mm R$ 26,50 | Joelho 25mm R$ 2,10 | Tubo Esgoto 100mm R$ 74,50. Frete CIF 30 DDL.',
        timestamp: '17/04 18:30'
      }
    ]
  }
];

export const INITIAL_HISTORICO_PRECOS: HistoricoPreco[] = [
  {
    id: 'hp-1',
    insumo_descricao: 'Barra Aço CA-50 8.0mm Barra 12m',
    unidade: 'BARRA',
    categoria: 'AÇO E FERRAGEM',
    preco_unitario: 41.50,
    fornecedor_nome: 'GERDAU AÇOS LONGOS S.A.',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    solicitacao_id: '84920',
    data: '16/04/2026',
    tendencia: 'queda'
  },
  {
    id: 'hp-2',
    insumo_descricao: 'Barra Aço CA-50 10.0mm Barra 12m',
    unidade: 'BARRA',
    categoria: 'AÇO E FERRAGEM',
    preco_unitario: 63.20,
    fornecedor_nome: 'MACFER AÇOS E METAIS LTDA',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    solicitacao_id: '84920',
    data: '16/04/2026',
    tendencia: 'estavel'
  },
  {
    id: 'hp-3',
    insumo_descricao: 'Cimento Portland CP II-E-32 Saco 50kg',
    unidade: 'SC',
    categoria: 'CIMENTO E ALVENARIA',
    preco_unitario: 31.90,
    fornecedor_nome: 'VOTORANTIM CIMENTOS S.A.',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    solicitacao_id: '84920',
    data: '15/04/2026',
    tendencia: 'queda'
  },
  {
    id: 'hp-4',
    insumo_descricao: 'Tubo PVC Soldável 25mm 3/4" x 6m Água Fria',
    unidade: 'VARA',
    categoria: 'HIDRÁULICA',
    preco_unitario: 25.90,
    fornecedor_nome: 'KRONA TUBOS E CONEXÕES S/A',
    obra_codigo: '442',
    obra_nome: 'Condomínio Barra Prime',
    solicitacao_id: '84925',
    data: '17/04/2026',
    tendencia: 'queda'
  },
  {
    id: 'hp-5',
    insumo_descricao: 'Tubo PVC Esgoto Série Normal 100mm x 6m',
    unidade: 'VARA',
    categoria: 'HIDRÁULICA',
    preco_unitario: 74.50,
    fornecedor_nome: 'AMANCO WAVIN BRASIL',
    obra_codigo: '442',
    obra_nome: 'Condomínio Barra Prime',
    solicitacao_id: '84925',
    data: '17/04/2026',
    tendencia: 'queda'
  },
  {
    id: 'hp-6',
    insumo_descricao: 'Arame Recozido Torcido Duplo 1.25mm Rolo 1kg',
    unidade: 'KG',
    categoria: 'AÇO E FERRAGEM',
    preco_unitario: 13.70,
    fornecedor_nome: 'BELGO BEKAERT ARAMES LTDA',
    obra_codigo: '188',
    obra_nome: 'Residencial Jardim das Palmeiras',
    solicitacao_id: '84920',
    data: '16/04/2026',
    tendencia: 'queda'
  }
];
