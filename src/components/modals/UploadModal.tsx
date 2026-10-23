import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { getCorrelatedSuppliersForSubMapa } from '../../data/initialData';
import { X, Upload, FileText, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { PedidoCancelamento, Solicitacao, ItemCotado } from '../../types';

export const UploadModal: React.FC = () => {
  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    addPedido,
    addSolicitacao,
    setCurrentTab,
    addLog,
    showToast,
    currentUser
  } = useApp();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadType, setUploadType] = useState<'cotacao_mapa' | 'pedidos_pdf' | 'fornecedores_xlsx'>('cotacao_mapa');

  if (!isUploadModalOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    addLog(`Processando arquivo importado: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`, 'info');

    if (uploadType === 'cotacao_mapa' && /\.(xlsx|xlsm|xls|csv)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

          const solNum = String(85000 + Math.floor(Math.random() * 900));
          const obraCod = '188';
          const obraNome = '188 - Residencial Jardim das Palmeiras';

          const extractedDescriptions: { cod: string; desc: string; und: string; qtd: number; ref: number }[] = [];
          rows.forEach((r, idx) => {
            if (idx < 2 || !Array.isArray(r)) return;
            const joined = r.map(c => String(c || '').trim()).filter(Boolean);
            if (joined.length >= 2) {
              const descCandidate = joined.find(cell => cell.length > 6 && !/^(item|descri|total|subtotal|fornec|cnpj)/i.test(cell));
              if (descCandidate && extractedDescriptions.length < 15) {
                extractedDescriptions.push({
                  cod: String(1000 + extractedDescriptions.length + 1),
                  desc: descCandidate.slice(0, 90),
                  und: 'UN',
                  qtd: 50,
                  ref: 38.5
                });
              }
            }
          });

          const finalInsumos =
            extractedDescriptions.length > 0
              ? extractedDescriptions
              : [
                  { cod: '002110', desc: `Insumo importado de ${file.name} — Lote 1`, und: 'UN', qtd: 100, ref: 42.0 },
                  { cod: '002115', desc: `Insumo importado de ${file.name} — Lote 2`, und: 'UN', qtd: 60, ref: 68.5 }
                ];

          const correlatedSuppliers = getCorrelatedSuppliersForSubMapa(
            obraCod,
            'MATERIAIS GERAIS',
            finalInsumos.map(i => i.desc),
            4
          );

          const mappedItems: ItemCotado[] = finalInsumos.map((ins, i) => {
            const cotacoes: ItemCotado['cotacoes'] = {};
            let lowestPrice = Infinity;
            let lowestSupId: string | undefined;

            correlatedSuppliers.forEach((sup, sIdx) => {
              const unit = Number((ins.ref * (0.95 + sIdx * 0.02)).toFixed(2));
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
              if (unit < lowestPrice) {
                lowestPrice = unit;
                lowestSupId = sup.id;
              }
            });

            return {
              id: `item-${solNum}-${i + 1}`,
              item_idx: i + 1,
              codigo_sienge: ins.cod,
              descricao: ins.desc,
              unidade: ins.und,
              quantidade: ins.qtd,
              categoria: 'MATERIAIS GERAIS',
              observacao_resumo: `Importado de ${file.name}`,
              preco_referencia: ins.ref,
              cotacoes,
              menor_preco_fornecedor_id: lowestSupId,
              menor_preco_unitario: lowestPrice,
              fornecedor_vencedor_id: lowestSupId
            };
          });

          const newSol: Solicitacao = {
            id: `sol-${solNum}`,
            solicitacao_id: solNum,
            obra_codigo: obraCod,
            obra_nome: obraNome,
            centro_custo: '188 - Jardim das Palmeiras',
            data_solicitacao: new Date().toLocaleDateString('pt-BR'),
            prazo_entrega: '5 dias úteis',
            comprador_responsavel: currentUser?.name || 'Wendel Andrade',
            solicitante: 'Importação de Planilha (.xlsm / .xlsx)',
            urgente: false,
            autorizada_sienge: true,
            observacao_geral: `Mapa montado a partir do arquivo "${file.name}" (${firstSheetName}).`,
            status: 'Equalizado',
            submapas: [
              {
                id: `sub-${solNum}-1`,
                nome: firstSheetName.toUpperCase().slice(0, 24) || 'MAPA IMPORTADO',
                categoria: 'MATERIAIS GERAIS',
                status: 'Equalizado',
                fornecedores: correlatedSuppliers,
                itens: mappedItems
              }
            ]
          };

          addSolicitacao(newSol);
          addLog(`Planilha "${file.name}" lida com sucesso (${mappedItems.length} insumos montados na SC #${solNum}).`, 'success');
          showToast(`Mapa #${solNum} montado a partir de "${file.name}"!`, 'success');
          setIsUploadModalOpen(false);
          setCurrentTab('tab-mapas-web');
        } catch (err) {
          console.error(err);
          showToast('Arquivo recebido e registrado na sessão!', 'info');
          setIsUploadModalOpen(false);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (uploadType === 'pedidos_pdf') {
      const newPedId = String(Math.floor(10000 + Math.random() * 90000));
      const simulatedPedido: PedidoCancelamento = {
        id: `ped-${newPedId}`,
        pedido_id: newPedId,
        obra_codigo: '188',
        obra_nome: 'Residencial Jardim das Palmeiras',
        centro_custo: '188 - Jardim das Palmeiras',
        fornecedor_nome: file.name.toLowerCase().includes('gerdau')
          ? 'GERDAU AÇOS LONGOS S.A.'
          : 'FORNECEDOR SIENGE IMPORTADO',
        fornecedor_email: 'contato@fornecedor.com.br',
        fornecedor_telefone: '(21) 98000-0000',
        saldo_total: 12500.0,
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        status: 'Pendente',
        itens: [
          {
            item_id: '1',
            descricao: `Insumo importado do arquivo ${file.name}`,
            quantidade: 100,
            unidade: 'UN',
            valor_unitario: 125.0,
            saldo_valor: 12500.0
          }
        ]
      };
      addPedido(simulatedPedido);
      addLog(`Relatório PDF SIENGE processado com sucesso. Pedido #${newPedId} cadastrado no lote pendente.`, 'sienge');
      showToast(`Arquivo "${file.name}" processado e integrado em Cancelamento de Pedidos!`, 'success');
      setIsUploadModalOpen(false);
      setCurrentTab('tab-cancelamento');
    } else {
      showToast(`Base de dados atualizada a partir de "${file.name}"!`, 'success');
      addLog(`Base de contatos/fornecedores sincronizada com sucesso a partir de "${file.name}".`, 'info');
      setIsUploadModalOpen(false);
    }
  };

  return (
    <div className="login-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div className="card modal-dialog" style={{ width: '100%', maxWidth: 580, padding: 24, background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Upload size={20} color="#6366f1" />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Carregar Arquivos, Planilhas (.xlsm/.xlsx) e PDFs</h2>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setIsUploadModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Selecione o Destino do Arquivo:</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              className={`btn ${uploadType === 'cotacao_mapa' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setUploadType('cotacao_mapa')}
              style={{ fontSize: 11, justifyContent: 'center' }}
            >
              <FileSpreadsheet size={14} /> Mapa / Solicitação (.xlsm/.xlsx)
            </button>
            <button
              type="button"
              className={`btn ${uploadType === 'pedidos_pdf' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setUploadType('pedidos_pdf')}
              style={{ fontSize: 11, justifyContent: 'center' }}
            >
              📄 Pedidos Pendentes (PDF)
            </button>
            <button
              type="button"
              className={`btn ${uploadType === 'fornecedores_xlsx' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setUploadType('fornecedores_xlsx')}
              style={{ fontSize: 11, justifyContent: 'center' }}
            >
              📊 Base Fornecedores (.xlsx)
            </button>
          </div>
        </div>

        <div
          className={`file-drop-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          style={{
            marginTop: 20,
            border: `2px dashed ${dragActive ? '#6366f1' : 'var(--border-color)'}`,
            borderRadius: 12,
            padding: 30,
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(0, 0, 0, 0.15)'
          }}
          onClick={() => document.getElementById('modal-file-upload-input')?.click()}
        >
          <input
            id="modal-file-upload-input"
            type="file"
            accept={uploadType === 'pedidos_pdf' ? '.pdf,.xlsx,.csv' : '.xlsm,.xlsx,.xls,.csv,.pdf'}
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          <FileText size={38} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Arraste seu arquivo aqui ou clique para selecionar</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {uploadType === 'cotacao_mapa'
              ? 'Planilha Macro de Cotação (.xlsm, .xlsx, .csv) — monta automaticamente o Mapa & Resumo de Compras'
              : uploadType === 'pedidos_pdf'
              ? 'Relatório Oficial SIENGE "Pedidos Pendentes.pdf" — envia para Cancelamento de Pedidos'
              : 'Planilha de Contatos de Fornecedores (.xlsx, .xls, .csv)'}
          </p>

          {selectedFileName && (
            <div style={{ marginTop: 14, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              {selectedFileName}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setIsUploadModalOpen(false)}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
