# 🍽️ Sabor Buffet — Sistema de Gerenciamento de Buffet

> Sistema web completo para gerenciamento de clientes, eventos, pedidos e orçamentos de buffet. Desenvolvido como Projeto Integrador.

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [Como Executar](#como-executar)
- [Testes Unitários](#testes-unitários)
- [Endpoints da API](#endpoints-da-api)
- [Regras de Negócio](#regras-de-negócio)

---

## Sobre o Projeto

O **Sabor Buffet** é uma aplicação web desenvolvida para facilitar o gerenciamento de um serviço de buffet. O sistema possui dois perfis de acesso:

- **Administrador:** gerencia clientes, eventos, itens do cardápio, pedidos e orçamentos.
- **Cliente:** visualiza seu orçamento, acompanha o status do pedido e vê os detalhes do evento contratado.

---

## Funcionalidades

### Área do Administrador
- ✅ Cadastro, edição e exclusão de clientes
- ✅ Gerenciamento de itens do cardápio (com categorias e valores)
- ✅ Visualização e atualização de pedidos recebidos
- ✅ Criação e aprovação de orçamentos
- ✅ Controle de status dos pedidos (Pendente → Confirmado → Preparando → Finalizado)

### Área do Cliente
- ✅ Cadastro e login de usuário
- ✅ Visualização do orçamento personalizado
- ✅ Acompanhamento do status do pedido em tempo real
- ✅ Visualização dos detalhes do evento (data, local, convidados)

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Back-end** | Node.js + Express 5 |
| **Banco de Dados** | MySQL 2 |
| **Front-end** | HTML, CSS, JavaScript (Vanilla) |
| **Testes** | Jest 29.7.0 |
| **Outras libs** | bcrypt, cors |

---

## Estrutura do Projeto

```
Sabor_Buffet/
├── adm/                        # Páginas do painel administrativo
├── public/                     # Páginas públicas (login, cadastro, cliente)
├── img/                        # Imagens do sistema
├── tests/
│   └── validators.test.js      # ✅ Suite de testes unitários (30 testes)
├── utils/
│   └── validators.js           # ✅ Módulo de validações e cálculos (testável)
├── server.js                   # Servidor principal com todos os endpoints
├── db.js                       # Configuração de conexão com MySQL
├── package.json                # Dependências e scripts
└── SABOR BUFFET SQL.sql        # Script de criação do banco de dados
```

---

## Banco de Dados

O banco de dados `buffet_db` possui as seguintes tabelas principais:

```sql
usuario        -- Usuários do sistema (admin e clientes)
cliente        -- Dados dos clientes
evento         -- Eventos contratados pelos clientes
item_servico   -- Itens do cardápio (pratos, bebidas, decoração, etc.)
pedido         -- Pedidos realizados pelos clientes
orcamento      -- Orçamentos gerados pelo admin
item_orcamento -- Itens vinculados a cada orçamento
```

Para criar o banco, execute o arquivo `SABOR BUFFET SQL.sql` no seu MySQL.

---

## Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18 ou superior
- [MySQL](https://www.mysql.com/) rodando localmente na porta 3306

### 1. Clone o repositório
```bash
git clone https://github.com/AlanySouza2203/buffet.git
cd buffet
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados
- Abra o MySQL e execute o script:
```bash
mysql -u root -p < "SABOR BUFFET SQL.sql"
```
- O banco `buffet_db` será criado automaticamente.

### 4. Configure a conexão (se necessário)
Abra o `server.js` e ajuste as configurações do MySQL se necessário:
```js
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",       // Sua senha do MySQL
  database: "buffet_db",
  port: 3306
});
```

### 5. Inicie o servidor
```bash
npm start
```

O servidor estará disponível em: **http://localhost:3000**

---

## Testes Unitários

O projeto possui uma suite completa de **30 testes unitários** cobrindo as principais regras de negócio do back-end.

### Ferramenta Utilizada
**Jest 29.7.0** — framework de testes para JavaScript/Node.js.

### Como Executar os Testes
```bash
npm test
```

Ou com output detalhado:
```bash
npx jest --verbose
```

### Resultado da Execução

```
PASS tests/validators.test.js
  Validação de E-mail                              4 testes ✓
  Validação de Telefone                            3 testes ✓
  Validação de Campos Obrigatórios — Cliente       3 testes ✓
  Cálculo de Total do Pedido                       4 testes ✓
  Mapeamento de Status (Pedido → Orçamento)        5 testes ✓
  Mapeamento de Status (Orçamento → Pedido)        3 testes ✓
  Validação de Campos Obrigatórios — Item          3 testes ✓
  Validação de Campos Obrigatórios — Evento        3 testes ✓
  Validação de Campos Obrigatórios — Usuário       2 testes ✓

Tests: 30 passed, 30 total  |  Time: 7.656 s
```

### O que é testado?

| Módulo | Função | Casos Testados |
|--------|--------|---------------|
| Validação | `validarEmail()` | E-mail sem @, e-mail válido, sem domínio, nulo |
| Validação | `validarTelefone()` | Menos de 10 dígitos, com formatação, fixo |
| Validação | `validarCamposCliente()` | Nome vazio, todos preenchidos, e-mail ausente |
| Validação | `validarCamposItem()` | Categoria vazia, completo, valor zero |
| Validação | `validarCamposEvento()` | Tipo vazio, completo, sem cliente_id |
| Validação | `validarCamposUsuario()` | Senha ausente, cadastro completo |
| Cálculo | `calcularTotalPedido()` | Múltiplos itens, quantidade zero, decimais, lista vazia |
| Status | `mapearStatusOrcamento()` | Confirmado, Cancelado, Preparando, Finalizado, desconhecido |
| Status | `mapearStatusPedido()` | aprovado, recusado, preparando, desconhecido |

### Estrutura dos arquivos de teste

```
utils/
└── validators.js           # Funções puras extraídas do server.js
                            # → validarEmail, validarTelefone,
                            #   validarCamposCliente, validarCamposItem,
                            #   validarCamposEvento, validarCamposUsuario,
                            #   calcularTotalPedido, mapearStatusOrcamento,
                            #   mapearStatusPedido

tests/
└── validators.test.js      # Suite de testes — 9 blocos, 30 casos
```

> **Por que um módulo separado?**  
> O `server.js` conecta diretamente com o MySQL. Para garantir testes unitários **isolados** (sem banco de dados), as funções de validação e cálculo foram extraídas para `utils/validators.js`, que contém apenas lógica pura — testável sem qualquer infraestrutura.

---

## Endpoints da API

### Itens de Serviço
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/itens` | Lista todos os itens (filtro por `?categoria=`) |
| `POST` | `/itens` | Cadastra novo item |
| `PUT` | `/itens/:id` | Atualiza item existente |
| `DELETE` | `/itens/:id` | Remove item |

### Clientes
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/clientes` | Lista todos os clientes |
| `POST` | `/clientes` | Cadastra cliente + evento + orçamento padrão |
| `PUT` | `/clientes/:id` | Atualiza dados do cliente |
| `DELETE` | `/clientes/:id` | Remove cliente (bloqueado se tiver eventos) |

### Eventos
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/eventos` | Lista eventos (filtro por `?cliente_id=` ou `?admin_id=`) |
| `POST` | `/eventos` | Cria novo evento |
| `DELETE` | `/eventos/:id` | Remove evento |

### Pedidos
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/pedidos` | Lista pedidos (filtro por `?evento_id=` ou `?cliente_id=`) |
| `POST` | `/pedidos` | Cria novo pedido |
| `PUT` | `/pedidos/:id/status` | Atualiza status do pedido |
| `PUT` | `/pedidos/:id/confirmar` | Confirma pedido e gera orçamento |
| `DELETE` | `/pedidos/:id` | Remove pedido |

### Orçamentos
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/orcamentos` | Lista orçamentos |
| `GET` | `/orcamentos/:id` | Lista itens de um orçamento |
| `POST` | `/orcamentos` | Cria orçamento manualmente |
| `PUT` | `/orcamentos/:id` | Atualiza status ou itens do orçamento |

### Usuários e Autenticação
| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/login` | Autentica usuário (retorna tipo: admin/cliente) |
| `POST` | `/usuarios` | Cadastra novo usuário cliente |

### Área do Cliente
| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/cliente/orcamento-completo/:clienteId` | Busca orçamento + itens + evento em uma chamada |
| `GET` | `/cliente/orcamento/:clienteId` | Busca orçamento mais recente (legado) |
| `GET` | `/meu-pedido/:clienteId` | Busca o último pedido do cliente |

---

## Regras de Negócio

| Regra | Descrição |
|-------|-----------|
| 📧 **E-mail único** | Não é permitido cadastrar dois clientes/usuários com o mesmo e-mail |
| 🔒 **Cliente com eventos** | Um cliente não pode ser excluído se possuir eventos vinculados |
| 📦 **Pedido com itens** | Um pedido só pode ser criado se tiver pelo menos um item |
| 💰 **Cálculo automático** | O total do pedido é calculado automaticamente como `Σ (valor × quantidade)` |
| 🔄 **Sincronização de status** | Ao atualizar o status de um pedido, o orçamento correspondente é sincronizado automaticamente |
| 📅 **Evento padrão** | Ao cadastrar um cliente pelo painel admin, um evento padrão é criado automaticamente para 30 dias após o cadastro |
| ✅ **Campos obrigatórios** | Todos os cadastros validam campos obrigatórios antes de persistir no banco |

---

## Licença

Este projeto foi desenvolvido para fins acadêmicos como Projeto Integrador.

---

*Sabor Buffet © 2026 — Alany Souza*
