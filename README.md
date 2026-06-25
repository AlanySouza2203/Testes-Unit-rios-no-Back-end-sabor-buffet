# Sabor & Arte

Sistema de gerenciamento de buffet para eventos. Plataforma completa com área administrativa para gestão interna e portal público para clientes.

## Estrutura do Projeto

```
├── adm/                    # Painel Administrativo
│   ├── clientes.html       # Cadastro e gestão de clientes
│   ├── dashboard.html      # Dashboard com métricas e visão geral
│   ├── eventos.html        # Gerenciamento de eventos
│   ├── funcionarios.html   # Controle de funcionários
│   ├── orcamentos.html     # Aprovação e acompanhamento de orçamentos
│   ├── pedidos.html        # Controle de pedidos e status
│   └── servicos.html       # Cadastro de itens do cardápio
│
└── public/                 # Portal do Cliente
    ├── cadastro.html       # Cadastro de novos clientes
    ├── cardapio.html       # Visualização e seleção do cardápio
    ├── confirpedi.html     # Confirmação de pedido
    ├── dashboard_cliente.html # Painel do cliente
    ├── evento.html         # Criação e configuração do evento
    ├── index.html          # Página inicial / landing page
    ├── login.html          # Tela de login
    ├── meu_pedido.html     # Acompanhamento do pedido/orçamento
    ├── pacotes.html        # Seleção de pacotes de buffet
    └── pagamento.html      # Finalização e pagamento
```

## Tecnologias

- **Frontend:** HTML5, CSS3 (estilização customizada com variáveis CSS), JavaScript vanilla
- **Ícones:** Lucide Icons, Bootstrap Icons, Font Awesome
- **Backend:** Node.js + Express + MySQL
- **Fontes:** Inter, Segoe UI, Arial

## Funcionalidades

### Área Administrativa (adm/)
- Dashboard com métricas em tempo real (clientes, eventos, pedidos, receita)
- CRUD completo de clientes, funcionários, serviços e eventos
- Gestão de orçamentos com aprovação/recusa
- Controle de pedidos com status (Pendente, Preparando, Finalizado)
- Sistema de mensagens para notificar clientes
- Autenticação com controle de acesso (admin/funcionário)
- Sidebar responsiva com menu mobile

### Portal do Cliente (public/)
- Landing page com apresentação dos serviços e pacotes
- Cadastro e login de clientes
- Escolha de pacotes (Essencial, Premium, Luxo, Personalizado)
- Criação de evento com tipo, data, local e convidados
- Cardápio interativo com carrinho de compras
- Confirmação de pedido com resumo detalhado
- Acompanhamento de orçamento com timeline de status
- Área do cliente com histórico de eventos
- Sistema de pagamento (PIX, Crédito, Débito)
- Mensagens da equipe sobre o andamento do pedido

## Design

- Tema escuro premium com destaque em dourado/amarelo (`#d4a762`, `#facc15`)
- Interface moderna com cards, modais e animações sutis
- Totalmente responsivo (desktop, tablet, mobile)
- Barra de rolagem customizada
- Menu mobile com toggle

## Banco de Dados

MySQL com as seguintes tabelas principais:
- `usuario` — usuários do sistema (admin, funcionário, cliente)
- `cliente` — dados dos clientes
- `evento` — eventos agendados
- `item_servico` — itens do cardápio
- `orcamento` — orçamentos gerados
- `pedidos` — pedidos confirmados
- `pagamento` — registros de pagamento
- `mensagens` — comunicação entre equipe e cliente

## Como Executar

1. Configure o banco de dados MySQL e execute o script SQL
2. Inicie o servidor backend (`node server.js` na porta 3000)
3. Acesse a área pública em `public/index.html`
4. Acesse o painel admin em `adm/dashboard.html`

---

© 2026 Sabor & Arte
