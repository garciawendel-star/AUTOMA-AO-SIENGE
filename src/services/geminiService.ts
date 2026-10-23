import { GoogleGenAI } from '@google/genai';
import { ItemCotado } from '../types';

export interface MappedItemQuote {
  item_id: string;
  item_idx: number;
  descricao_original: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  marca?: string;
}

export interface ExtractedQuoteForMapOutput {
  fornecedor_identificado: string;
  prazo_entrega_dias: number;
  validade_dias: number;
  condicao_pagamento: string;
  frete_tipo: 'CIF' | 'FOB';
  frete_valor: number;
  itens_preenchidos: MappedItemQuote[];
}

/**
 * Lê a resposta de cotação enviada pelo fornecedor (WhatsApp, E-mail, PDF/Texto)
 * e correlaciona ESTRITAMENTE com os insumos JÁ EXISTENTES no Submapa da Solicitação,
 * sem criar novos insumos.
 */
export async function matchAndFillMapFromSupplierResponse(
  quoteText: string,
  existingItems: ItemCotado[],
  fornecedorNome: string,
  apiKey?: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<ExtractedQuoteForMapOutput> {
  if (apiKey && apiKey.trim().length > 10 && existingItems.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const itemsSchemaList = existingItems.map(it => ({
        item_id: it.id,
        item_idx: it.item_idx,
        descricao: it.descricao,
        unidade: it.unidade,
        quantidade: it.quantidade
      }));

      const prompt = `Você é o Agente de Suprimentos com IA da Omega Construtora.
Sua tarefa é ler a resposta de cotação enviada pelo fornecedor "${fornecedorNome}" e preencher APENAS os insumos já existentes no Mapa de Cotação abaixo.
REGRA CRÍTICA: NÃO crie novos insumos. Associe cada preço encontrado no texto do fornecedor ao "item_id" correspondente da lista de insumos existentes do mapa.

Insumos existentes no Mapa de Cotação:
${JSON.stringify(itemsSchemaList, null, 2)}

Retorne em JSON estrito no formato:
{
  "fornecedor_identificado": string,
  "prazo_entrega_dias": number,
  "validade_dias": number,
  "condicao_pagamento": string,
  "frete_tipo": "CIF" ou "FOB",
  "frete_valor": number,
  "itens_preenchidos": [
    {
      "item_id": string (deve ser exatamente um item_id da lista acima),
      "preco_unitario": number,
      "marca": string
    }
  ]
}

Resposta / Orçamento enviado pelo fornecedor:
${quoteText}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.itens_preenchidos)) {
        const mapped: MappedItemQuote[] = [];
        for (const pItem of parsed.itens_preenchidos) {
          const target = existingItems.find(e => e.id === pItem.item_id);
          if (target && Number(pItem.preco_unitario) > 0) {
            const unit = Number(pItem.preco_unitario);
            mapped.push({
              item_id: target.id,
              item_idx: target.item_idx,
              descricao_original: target.descricao,
              unidade: target.unidade,
              quantidade: target.quantidade,
              preco_unitario: unit,
              preco_total: unit * target.quantidade,
              marca: pItem.marca || fornecedorNome.split(' ')[0]
            });
          }
        }

        if (mapped.length > 0) {
          return {
            fornecedor_identificado: parsed.fornecedor_identificado || fornecedorNome,
            prazo_entrega_dias: Number(parsed.prazo_entrega_dias) || 3,
            validade_dias: Number(parsed.validade_dias) || 7,
            condicao_pagamento: parsed.condicao_pagamento || '28 DDL',
            frete_tipo: parsed.frete_tipo === 'FOB' ? 'FOB' : 'CIF',
            frete_valor: Number(parsed.frete_valor) || 0,
            itens_preenchidos: mapped
          };
        }
      }
    } catch (err) {
      console.warn('Erro ao chamar Gemini para correlação no mapa, usando motor heurístico:', err);
    }
  }

  // Motor Heurístico de Correlação Estrita com os Insumos Existentes no Mapa
  let condicao = '28 DDL';
  let frete_tipo: 'CIF' | 'FOB' = 'CIF';
  let frete_valor = 0;
  let prazo_entrega_dias = 3;

  if (/FOB/i.test(quoteText)) {
    frete_tipo = 'FOB';
    const freteMatch = quoteText.match(/frete\s*(?:de|:)?\s*R?\$?\s*(\d+(?:[.,]\d{2})?)/i);
    if (freteMatch) frete_valor = parseFloat(freteMatch[1].replace(',', '.'));
  }
  if (/A VISTA|À VISTA|PIX/i.test(quoteText)) condicao = 'À Vista';
  else if (/28\/35/i.test(quoteText)) condicao = '28/35 DDL';
  else if (/28\/42/i.test(quoteText)) condicao = '28/42 DDL';
  else if (/30 DDL|30 DIAS/i.test(quoteText)) condicao = '30 DDL';
  else if (/21 DDL|21 DIAS/i.test(quoteText)) condicao = '21 DDL';

  const prazoMatch = quoteText.match(/(\d+)\s*dias?\s*(?:úteis|uteis|corridos)?/i);
  if (prazoMatch && Number(prazoMatch[1]) <= 15) {
    prazo_entrega_dias = Number(prazoMatch[1]);
  }

  // Extrai todos os preços presentes no texto por linha ou segmento separado por "|" ou ";"
  const segments = quoteText
    .split(/\r?\n|\||;/)
    .map(s => s.trim())
    .filter(Boolean);

  const usedSegmentIndices = new Set<number>();
  const itens_preenchidos: MappedItemQuote[] = [];

  // 1ª Passada: Correlação por palavras-chave / bitolas / especificações de cada insumo existente no mapa
  existingItems.forEach((existingItem, idx) => {
    const descWords = existingItem.descricao
      .toLowerCase()
      .replace(/[^\wà-ÿ0-9.,"]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !['de', 'da', 'do', 'com', 'para', 'barra', 'saco', 'vara'].includes(w));

    let bestSegIdx = -1;
    let bestScore = 0;
    let bestPrice = 0;

    segments.forEach((seg, segIdx) => {
      if (usedSegmentIndices.has(segIdx)) return;
      if (/frete|total geral|cnpj/i.test(seg) && !descWords.some(w => seg.toLowerCase().includes(w))) return;

      const priceMatches = Array.from(seg.matchAll(/(?:R\$\s*)?(\d{1,5}(?:[.,]\d{2}))(?!\s*mm|\s*m\b|\s*kg)/gi));
      if (priceMatches.length === 0) return;

      const segLower = seg.toLowerCase();
      let score = 0;
      descWords.forEach(w => {
        if (segLower.includes(w)) {
          // Bitolas numéricas (ex: 8.0mm, 8mm, 10mm, 25mm, 100mm, cp-ii, ac-iii) têm peso maior
          if (/\d/.test(w)) score += 25;
          else score += 10;
        }
      });

      // Também checa versão sem ".0" (ex: 8.0mm -> 8mm, 10.0mm -> 10mm)
      descWords.forEach(w => {
        const simplified = w.replace('.0', '');
        if (simplified !== w && segLower.includes(simplified)) {
          score += 25;
        }
      });

      if (score > bestScore) {
        const rawVal = priceMatches[0][1].replace('.', '').replace(',', '.');
        const parsedPrice = parseFloat(
          priceMatches[0][1].includes(',')
            ? priceMatches[0][1].replace(/\.(?=\d{3})/g, '').replace(',', '.')
            : rawVal
        );
        if (parsedPrice > 0) {
          bestScore = score;
          bestSegIdx = segIdx;
          bestPrice = parsedPrice;
        }
      }
    });

    if (bestSegIdx !== -1 && bestPrice > 0) {
      usedSegmentIndices.add(bestSegIdx);
      itens_preenchidos.push({
        item_id: existingItem.id,
        item_idx: existingItem.item_idx,
        descricao_original: existingItem.descricao,
        unidade: existingItem.unidade,
        quantidade: existingItem.quantidade,
        preco_unitario: bestPrice,
        preco_total: Number((bestPrice * existingItem.quantidade).toFixed(2)),
        marca: fornecedorNome.split(' ')[0]
      });
    } else {
      // Fallback: se o usuário digitou apenas valores na ordem dos itens do mapa
      const allPricesInText = Array.from(quoteText.matchAll(/R\$\s*(\d+(?:[.,]\d{2}))/gi));
      if (allPricesInText[idx]) {
        const val = parseFloat(allPricesInText[idx][1].replace(',', '.'));
        if (val > 0) {
          itens_preenchidos.push({
            item_id: existingItem.id,
            item_idx: existingItem.item_idx,
            descricao_original: existingItem.descricao,
            unidade: existingItem.unidade,
            quantidade: existingItem.quantidade,
            preco_unitario: val,
            preco_total: Number((val * existingItem.quantidade).toFixed(2)),
            marca: fornecedorNome.split(' ')[0]
          });
        }
      }
    }
  });

  return {
    fornecedor_identificado: fornecedorNome,
    prazo_entrega_dias,
    validade_dias: 7,
    condicao_pagamento: condicao,
    frete_tipo,
    frete_valor,
    itens_preenchidos
  };
}
