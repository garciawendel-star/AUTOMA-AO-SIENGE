import * as XLSX from 'xlsx';
import { SubMapa, PedidoCancelamento } from '../types';

export function exportSubMapaToExcel(submapa: SubMapa, solicitacaoId: string, obraNome: string) {
  const rows: any[] = [];

  // Header row
  rows.push(['OMEGA CONSTRUTORA — MAPA COMPARATIVO DE COTAÇÃO']);
  rows.push([`Solicitação Nº: ${solicitacaoId}`, `Obra: ${obraNome}`, `Submapa: ${submapa.nome}`]);
  rows.push([`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`]);
  rows.push([]);

  // Table header
  const tableHeader = ['Item', 'Descrição do Insumo', 'Unid.', 'Qtd.', 'Preço Ref.'];
  submapa.fornecedores.forEach(f => {
    tableHeader.push(`${f.nome} (Unit)`);
    tableHeader.push(`${f.nome} (Total)`);
  });
  tableHeader.push('Menor Preço Unit.');
  tableHeader.push('Fornecedor Vencedor');
  tableHeader.push('Saving Unit.');
  rows.push(tableHeader);

  // Table data
  submapa.itens.forEach(item => {
    const row: any[] = [
      item.item_idx,
      item.descricao,
      item.unidade,
      item.quantidade,
      item.preco_referencia ? `R$ ${item.preco_referencia.toFixed(2)}` : '-'
    ];

    submapa.fornecedores.forEach(f => {
      const c = item.cotacoes[f.id];
      if (c && c.preco_unitario > 0) {
        row.push(`R$ ${c.preco_unitario.toFixed(2)}`);
        row.push(`R$ ${(c.preco_unitario * item.quantidade).toFixed(2)}`);
      } else {
        row.push('-');
        row.push('-');
      }
    });

    const menorUnit = item.menor_preco_unitario || 0;
    const vencedor = submapa.fornecedores.find(f => f.id === item.menor_preco_fornecedor_id)?.nome || '-';
    const savingUnit = item.preco_referencia && menorUnit ? (item.preco_referencia - menorUnit) : 0;

    row.push(menorUnit ? `R$ ${menorUnit.toFixed(2)}` : '-');
    row.push(vencedor);
    row.push(savingUnit > 0 ? `R$ ${savingUnit.toFixed(2)}` : '-');

    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mapa Cotacao');

  const filename = `Mapa_Cotacao_Sol_${solicitacaoId}_${submapa.nome.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportPedidosCancelamentoToExcel(pedidos: PedidoCancelamento[]) {
  const rows: any[] = [];
  rows.push(['OMEGA CONSTRUTORA — RELATÓRIO CONSOLIDADO DE PEDIDOS PENDENTES / CANCELAMENTOS']);
  rows.push([`Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
  rows.push([]);

  rows.push(['Nº Pedido', 'Obra / Centro de Custo', 'Fornecedor', 'E-mail Fornecedor', 'Saldo em Aberto (R$)', 'Data Emissão', 'Status']);

  pedidos.forEach(p => {
    rows.push([
      p.pedido_id,
      p.obra_nome,
      p.fornecedor_nome,
      p.fornecedor_email,
      p.saldo_total,
      p.data_emissao,
      p.status
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cancelamentos');

  const filename = `Relatorio_Cancelamento_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
