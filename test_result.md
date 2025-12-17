#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS

user_problem_statement: "Portal web Instituto Jussara Kaisel - Teste completo de todas as funcionalidades: cadastro de mentoradas, mentorias com foto, produtos com vitrine, financeiro, sessões, tarefas, agendamentos."

backend:
  - task: "POST /api/auth/register - Criar nova mentorada"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "GET /api/mentorada-mentorias/all - Listar vínculos"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/mentorias - Criar mentoria com imagem e link"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/produtos - Criar produto com imagem e preço"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/sessoes - Criar sessão"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/tarefas - Criar tarefa"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/financeiro - Criar registro financeiro"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

frontend:
  - task: "AdminPanel - Dropdown de mentoradas em Sessões"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "AdminPanel - Dropdown de mentoradas em Tarefas"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "AdminPanel - Mentorias com imagem de capa e link"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "AdminPanel - Produtos em formato vitrine"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminPanel.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "FinanceiroAdmin - Criar e editar registro"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/FinanceiroAdmin.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: true

test_plan:
  current_focus:
    - "Fluxo completo de cadastro de mentorada"
    - "Criação de mentoria com imagem"
    - "Criação de produto com vitrine"
    - "Dropdown de mentoradas funcionando"
    - "Financeiro, sessões e tarefas"
  stuck_tasks: []
  test_all: true

agent_communication:
  - agent: "main"
    message: "VERIFICAÇÃO FINAL: 1) Parcelas dinâmicas funcionando; 2) Menu lateral mobile com scroll (Perfil visível); 3) Sessões/Financeiro buscando de todas mentorias; 4) Calendário com links de agendamento (Calendly/YouCanBookMe) salvos no banco; 5) Vitrine de mentorias com cadeado; 6) Perfil com país/moeda/telefone editáveis. Credenciais: admin=jussarakaiselvc@gmail.com/jussara123, mentorada=karina_kiriki@icloud.com/mentorada123"
