# 🏢 PLATAFORMA INTEGRADA DE SUPRIMENTOS - OMEGA CONSTRUTORA
## Manual de Instalação, Pré-Requisitos e Guia de Uso Operacional

A **Plataforma Integrada Omega** unifica em uma única interface moderna, ágil e 100% local as duas principais rotinas automatizadas do sistema **SIENGE**:
1. **Módulo 1: Solicitações de Compras & Mapas de Cotação (Página 1328)**
   - Extração automática de solicitações de múltiplos centros de custo/obras;
   - Agrupamento inteligente e preenchimento de planilhas de mapas de cotação Excel com macros VBA;
   - Agendamento diário automático via Windows Task Scheduler.
2. **Módulo 2: Cancelamento de Pedidos & Notificação de Fornecedores (Página 1997)**
   - Processamento de relatórios em PDF de pedidos pendentes com validação de saldo;
   - Identificação automática de contatos na base cadastral (`Base_Contatos_Fornecedores.xlsx`);
   - Cancelamento automatizado no SIENGE com log auditável e histórico imutável anti-duplicidade;
   - Geração de e-mails formais no Microsoft Outlook e relatórios gerenciais Excel.

---

## 🛠️ 1. Requisitos de Sistema & Instalação

### Pré-Requisitos Mínimos:
* **Sistema Operacional:** Windows 10 ou Windows 11 (64-bit).
* **Python:** Versão 3.10 ou superior instalada (marcar a caixa *"Add python.exe to PATH"* durante a instalação).
* **Microsoft Office:** Excel (para execução de macros de mapas) e Outlook (para disparo de notificações).
* **Navegador Web:** Brave Browser ou Google Chrome (para comunicação via Chrome DevTools Protocol na porta 9222).
* **Acesso à Rede Corporativa:** Unidade `Z:\` mapeada (para exportação e salvamento de mapas de cotação).

---

### Instalação Rápida (1 Clique):
1. Dê um duplo clique no arquivo **`INSTALAR_PRE_REQUISITOS.bat`**.
2. O script executará automaticamente:
   - Checagem do Python e atualização do `pip`;
   - Instalação de todas as bibliotecas necessárias (`Flask`, `pandas`, `openpyxl`, `pypdf`, `pywin32`, `websocket-client`, etc.);
   - Configuração de permissão para macros do Excel (`AccessVBOM`);
   - Teste de integridade de todos os módulos.
3. Ao finalizar, basta dar duplo clique em **`INICIAR_PLATAFORMA.bat`**.

---

## 🩺 2. Verificação & Diagnóstico em Tempo Real

A plataforma possui um sistema próprio de **autodiagnóstico** integrado. Acesse a aba **`🩺 Diagnóstico & Requisitos`** para testar:
- **Navegador & Porta 9222:** Verifica se o Brave ou Chrome está aberto em modo de depuração.
- **Microsoft Excel & Macros:** Checa se a interface COM e a política de confiança do VBA estão ativas (com botão de **Correção Automática com 1 Clique**).
- **Microsoft Outlook:** Valida se há perfil ativo configurado para envio de comunicados.
- **Unidade de Rede `Z:\`:** Checa se o diretório de destino das cotações está acessível e com permissão de gravação.
- **Conectividade SIENGE:** Valida se os servidores da Bom Jardim Gestão (`bjgestao.sienge.com.br`) estão respondendo normalmente.

---

## 🌐 3. Como Iniciar o Navegador na Porta 9222

Para que as automações do SIENGE interajam com o sistema sem exigir login ou senhas salvas no código:
1. Feche as instâncias comuns do seu navegador.
2. No menu Iniciar ou no prompt, execute:
   - **Brave:** `"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe" --remote-debugging-port=9222`
   - **Chrome:** `"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222`
   *(Você também pode utilizar o botão "Iniciar Navegador com Depuração" dentro da aba Diagnóstico da plataforma).*
3. Faça o login manual no SIENGE. A partir daí, a plataforma assume o controle das rotinas conforme o seu comando.

---

## 📦 4. Como Gerar o Executável Standalone (.EXE)

Caso deseje disponibilizar a aplicação para um usuário que **não possui Python instalado**:
1. Execute o script **`GERAR_EXECUTAVEL.bat`**.
2. O PyInstaller compilará todo o projeto gerando uma pasta independente com o arquivo:
   `dist\OmegaPlatform\OmegaPlatform.exe`
3. Basta copiar a pasta gerada para o computador do destinatário.

---

## 📁 5. Estrutura Organizada de Pastas e Módulos

* **Raiz do Projeto:**
  * `app_plataforma_omega.py` — Aplicação principal e servidor web com console unificado e rotas de automação.
  * `INICIAR_PLATAFORMA.bat` — Atalho para execução imediata da plataforma.
  * `INSTALAR_PRE_REQUISITOS.bat` — Instalador automático de dependências e configuração de ambiente.
  * `GERAR_EXECUTAVEL.bat` — Compilador para geração do `.exe` distribuível (`dist\OmegaPlatform`).
  * `config.json` — Arquivo de configurações unificado (obras, e-mails de engenharia, diretórios e URLs).
  * `templates_mensagens.json` — **Arquivo unificado de modelos e textos de mensagens** (E-mail e WhatsApp) para edição livre de todos os comunicados da aplicação.
  * `templates_mensagens.example.json` — Cópia de fábrica de referência e backup dos templates.
  * `requirements.txt` — Lista de bibliotecas Python necessárias.

* **Pasta `modulos/` (Lógica de Negócio e Automações):**
  * `modulo_templates_mensagens.py` — Gerenciador unificado de templates com auto-reload e injeção dinâmica de variáveis em E-mails e WhatsApp.
  * `modulo_cancelamento_pedidos.py` — Automação Sienge de cancelamento de saldo de pedidos (Pág. 1997).
  * `modulo_solicitacoes_compras.py` — Automação Sienge de extração de solicitações (Pág. 1328).
  * `modulo_mapas_cotacao.py` — Motor web de gestão, consolidação e exportação dos mapas de cotação.
  * `modulo_alertas_gestores.py` — Sistema de avisos automáticos aos gestores via WhatsApp Web e E-mail.
  * `modulo_autenticacao.py` — Controle de login, usuários, sessões e permissões (RBAC).
  * `modulo_diagnostico.py` — Módulo de checagem de pré-requisitos, testes de conectividade e correção de registro.
  * `modulo_leitor_pdf.py` — Parser estruturado de relatórios em PDF de pedidos pendentes.
  * `modulo_base_fornecedores.py` — Cruzamento da base cadastral de fornecedores e contatos.
  * `modulo_notificador_email.py` — Serviço de geração e envio de comunicados por e-mail (Outlook/SMTP).
  * `modulo_relatorios_cancelamento.py` — Geração de relatórios executivos em Excel de pedidos processados.
  * `modulo_planilha_mapas.py` — Manipulação e preenchimento de mapas de cotação em Excel (macros VBA).
  * `modulo_navegador_cdp.py` — Driver de comunicação com navegador via Chrome DevTools Protocol.

* **Pasta `dados/` (Bases Cadastrais e Persistência Local):**
  * `Base_Contatos_Fornecedores.xlsx` — Base cadastral de fornecedores (razão, fantasia, e-mails, telefones).
  * `contatos_atualizados.json` — Cache de deltas e contatos editados pela interface web.
  * `historico_cancelamentos.json` — Base de dados persistente de pedidos já cancelados (proteção anti-duplicidade).
  * `mapas_cotacao_db.json` — Base de dados dos mapas de cotação e solicitações importadas.
  * `usuarios.json` — Contas de usuários, senhas criptografadas e perfis de acesso.
  * `Pedidos Pendentes.pdf` — Arquivo PDF de entrada para processamento de cancelamentos.

* **Pasta `scripts/` (Scripts Utilitários):**
  * `executar_macro_excel.ps1` — Script PowerShell para automação e importação de mapas no Excel.

* **Pasta `web/` (Frontend):**
  * `index.html`, `app.js`, `styles.css` e pasta `img/`.

* **Pasta `logs/`:**
  * `execucao.log` — Histórico de execução com rotação automática.

* **Pasta `relatorios_exportados/`:**
  * Armazenamento padrão de relatórios e resumos Excel exportados.
