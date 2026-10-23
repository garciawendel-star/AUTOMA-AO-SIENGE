# 🏢 Plataforma Ômega — Suprimentos & SIENGE (React Application)

Plataforma integrada de suprimentos, mapas de cotação comparativos, cancelamento de pedidos SIENGE, alertas para gestores e agente autônomo de cotação e negociação com IA da Ômega Construtora.

Reescrita moderna como aplicação React SPA (Vite + TypeScript), preservando 100% dos recursos, regras de negócio e o design system original (temas Escuro e Claro).

---

## 🚀 Principais Módulos da Aplicação

1. **Visão Geral / Hub:**
   - KPIs em tempo real: Pedidos Pendentes, Saldo Total a Cancelar, Fornecedores Mapeados, Histórico Anti-Duplicidade.
   - Acesso rápido a todos os módulos e visualizador do terminal de logs do sistema.

2. **Mapa & Resumo de Compras Web Integrado:**
   - Comparação lado a lado de até 7 fornecedores por solicitação e obra.
   - Destaque automático do Menor Preço e cálculo dinâmico de economia (Saving).
   - Resumo consolidado por fornecedor vencedor pronto para faturamento.
   - Disparo formatado de fechamento de compra aprovada para WhatsApp.
   - Exportação em planilha Excel (.xlsx) e impressão / PDF.

3. **Agente de Cotação & Negociação IA:**
   - **Estruturação de Pedidos Avulsos:** Transforma listas em texto livre em tabelas categorizadas (Aço, Hidráulica, Cimento, Agregados, etc.).
   - **Extração Multimodal de Respostas:** Interpreta orçamentos e mensagens de WhatsApp de fornecedores (preços unitários, frete CIF/FOB, condição de pagamento).
   - **Pipeline de Fornecedores por Solicitação:** Quadro kanban interativo (`Pendente` → `Cotação Enviada` → `Em Negociação` → `Proposta Recebida` → `Fechado`).
   - **Negociação Autônoma:** Geração de contrapropostas de desconto parametrizadas com cálculo de economia.
   - **Histórico de Preços:** Monitoramento de preços praticados e tendência de mercado.

4. **Solicitações SIENGE & Alertas aos Gestores:**
   - Extração e listagem de solicitações pendentes por obra e centro de custo.
   - Disparo automatizado de alertas executivos via WhatsApp e E-mail.
   - Agendamento de rotinas operacionais diárias.

5. **Cancelamento de Pedidos & Notificação aos Fornecedores:**
   - Ingestão de relatórios PDF de pedidos pendentes do SIENGE.
   - Seleção em lote com conferência detalhada de insumos e saldos.
   - Execução com suporte a modo Simulação (Dry Run) ou Produção.
   - Geração de e-mails formais para fornecedores via Outlook/Drafts.
   - Exportação de relatórios consolidados em Excel.

6. **Diagnóstico & Pré-Requisitos:**
   - Monitoramento contínuo dos subsistemas: conectividade HTTPS SIENGE, portas Chrome CDP, leitor PDF, suporte a macros Excel, banco de dados local e Gemini AI.

7. **Configurações & Gestão de Usuários (RBAC):**
   - Controle de perfis com permissões diferenciadas: `Admin`, `Gestor/Diretoria`, `Comprador` e `Engenharia`.
   - Restrição por centros de custo e obras autorizadas.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** React 18 com TypeScript
- **Build Tool:** Vite 6
- **Ícones:** Lucide React
- **Exportação de Dados:** XLSX (SheetJS)
- **Inteligência Artificial:** SDK `@google/genai` (Gemini 2.5 Flash / Fallback Heurístico Integrado)
- **Design System:** CSS nativo com variáveis, temas Claro / Escuro e tipografia Inter & Outfit.

---

## 💻 Como Executar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Porta 3000)
npm run dev

# Gerar build de produção
npm run build
```
