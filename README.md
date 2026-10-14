# Testes Unitários — Sabor Buffet

Testes unitários do back-end do sistema **Sabor Buffet**, implementados com **Jest**.

---

## Como executar os testes

### 1. Instale as dependências
```bash
npm install
```

### 2. Execute os testes
```bash
npm test
```

Ou com detalhes de cada caso:
```bash
npx jest --verbose
```

---

## Resultado da execução

```
PASS tests/validators.test.js
  Validação de E-mail
    ✓ CT01 — deve retornar FALSE para e-mail sem @ (formato inválido)
    ✓ CT02 — deve retornar TRUE para e-mail em formato válido
    ✓ CT03 — deve retornar FALSE para e-mail sem domínio após o @
    ✓ CT03b — deve retornar FALSE para e-mail nulo ou indefinido
  Validação de Telefone
    ✓ CT04 — deve retornar FALSE para telefone com menos de 10 dígitos
    ✓ CT05 — deve retornar TRUE para telefone válido com formatação
    ✓ CT05b — deve retornar TRUE para telefone fixo (10 dígitos)
  Validação de Campos Obrigatórios — Cliente
    ✓ CT06 — deve retornar FALSE quando nome está vazio
    ✓ CT07 — deve retornar TRUE quando todos os campos do cliente estão preenchidos
    ✓ CT07b — deve retornar FALSE quando e-mail está ausente
  Cálculo de Total do Pedido
    ✓ CT08 — deve calcular corretamente o total com múltiplos itens
    ✓ CT09 — deve retornar 0 quando quantidade do item é zero
    ✓ CT10 — deve calcular corretamente com valores decimais (centavos)
    ✓ CT10b — deve retornar 0 para lista de itens vazia
  Mapeamento de Status (Pedido → Orçamento)
    ✓ CT11 — status 'Confirmado' deve mapear para 'aprovado'
    ✓ CT12 — status desconhecido deve mapear para 'pendente'
    ✓ CT13 — status 'Cancelado' deve mapear para 'recusado'
    ✓ CT13b — status 'Finalizado' deve mapear para 'aprovado'
    ✓ CT13c — status 'Preparando' deve mapear para 'preparando'
  Mapeamento de Status (Orçamento → Pedido)
    ✓ deve converter status 'aprovado' para 'Confirmado'
    ✓ deve converter status 'recusado' para 'Cancelado'
    ✓ deve retornar 'Pendente' para status de orçamento desconhecido
  Validação de Campos Obrigatórios — Item de Serviço
    ✓ CT14 — deve retornar FALSE quando categoria está vazia
    ✓ CT14b — deve retornar TRUE quando todos os campos do item estão preenchidos
    ✓ CT14c — deve retornar FALSE quando valor é 0 (falsy)
  Validação de Campos Obrigatórios — Evento
    ✓ CT15 — deve retornar FALSE quando tipo do evento está vazio
    ✓ CT15b — deve retornar TRUE quando todos os campos do evento estão preenchidos
    ✓ CT15c — deve retornar FALSE quando cliente_id está ausente
  Validação de Campos Obrigatórios — Usuário
    ✓ deve retornar FALSE quando senha está ausente no cadastro
    ✓ deve retornar TRUE para cadastro de usuário completo

Tests: 30 passed, 30 total  |  Time: 7.656 s
```

---

## O que é testado

### Validação de E-mail
Verifica se o sistema aceita ou rejeita corretamente um endereço de e-mail.
- Rejeita e-mail sem `@`
- Rejeita e-mail sem domínio após o `@`
- Rejeita valores nulos ou vazios
- Aceita e-mails no formato correto (`usuario@dominio.com`)

### Validação de Telefone
Verifica se o número de telefone possui ao menos 10 dígitos.
- Rejeita números incompletos (menos de 10 dígitos)
- Aceita números com formatação `(11) 99999-9999` — os caracteres especiais são removidos antes da contagem
- Aceita telefones fixos com exatamente 10 dígitos (valor limite)

### Validação de Campos Obrigatórios
Verifica se os campos obrigatórios de cada cadastro estão preenchidos antes de prosseguir.

| Cadastro | Campos obrigatórios |
|----------|---------------------|
| Cliente | nome, telefone, e-mail |
| Usuário | nome, telefone, e-mail, senha |
| Item de serviço | nome, categoria, valor, tipo |
| Evento | cliente_id, tipo, data, local |

### Cálculo de Total do Pedido
Verifica se o total é calculado corretamente como a soma de `valor × quantidade` de cada item.
- Calcula corretamente com múltiplos itens
- Retorna `0` quando a quantidade de um item é zero
- Lida corretamente com valores decimais (centavos)
- Retorna `0` sem erro para lista de itens vazia

### Mapeamento de Status
Verifica a sincronização automática de status entre a tabela de pedidos e a de orçamentos.

| Status do Pedido | Status do Orçamento |
|-----------------|---------------------|
| Confirmado | aprovado |
| Preparando | preparando |
| Cancelado | recusado |
| Finalizado | aprovado |
| (desconhecido) | pendente |

| Status do Orçamento | Status do Pedido |
|--------------------|-----------------|
| aprovado | Confirmado |
| recusado | Cancelado |
| preparando | Preparando |
| (desconhecido) | Pendente |

---

## Estrutura dos arquivos

```
├── utils/
│   └── validators.js          # Funções puras extraídas do server.js
│
├── tests/
│   └── validators.test.js     # Suite de testes (30 casos)
│
└── package.json               # Jest configurado como devDependency
```

> As funções foram extraídas do `server.js` para o módulo `utils/validators.js`
> para permitir testes **isolados**, sem precisar de banco de dados ou servidor rodando.
