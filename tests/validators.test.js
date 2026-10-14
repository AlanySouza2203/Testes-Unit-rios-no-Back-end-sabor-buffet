/**
 * tests/validators.test.js
 *
 * Testes unitários do back-end — Sabor Buffet
 * Ferramenta: Jest
 *
 * Casos de teste implementados:
 *   CT01 — Validar e-mail inválido (sem @)
 *   CT02 — Validar e-mail válido
 *   CT03 — Validar e-mail inválido (sem domínio)
 *   CT04 — Validar telefone muito curto (menos de 10 dígitos)
 *   CT05 — Validar telefone válido (com formatação)
 *   CT06 — Validar campos obrigatórios do cliente — campo ausente
 *   CT07 — Validar campos obrigatórios do cliente — todos preenchidos
 *   CT08 — Calcular total do pedido com múltiplos itens
 *   CT09 — Calcular total quando quantidade é zero
 *   CT10 — Calcular total com valores decimais
 *   CT11 — Mapear status "Confirmado" para orçamento
 *   CT12 — Mapear status desconhecido para "pendente"
 *   CT13 — Mapear status "Cancelado" para orçamento
 *   CT14 — Validar campos obrigatórios do item — campo vazio
 *   CT15 — Validar campos obrigatórios do evento — tipo ausente
 */

const {
    validarEmail,
    validarTelefone,
    validarCamposCliente,
    validarCamposItem,
    validarCamposEvento,
    validarCamposUsuario,
    calcularTotalPedido,
    mapearStatusOrcamento,
    mapearStatusPedido
} = require("../utils/validators");

// ================================================
// BLOCO 1: Validação de E-mail
// ================================================

describe("Validação de E-mail", () => {

    test("CT01 — deve retornar FALSE para e-mail sem @ (formato inválido)", () => {
        // Cenário: e-mail digitado sem o símbolo @
        // Entrada: "usuarioemail.com"
        // Esperado: false (e-mail inválido, cadastro não deve prosseguir)
        const resultado = validarEmail("usuarioemail.com");
        expect(resultado).toBe(false);
    });

    test("CT02 — deve retornar TRUE para e-mail em formato válido", () => {
        // Cenário: e-mail bem formatado com @ e domínio completo
        // Entrada: "cliente@saborbuffe.com.br"
        // Esperado: true
        const resultado = validarEmail("cliente@saborbuffet.com.br");
        expect(resultado).toBe(true);
    });

    test("CT03 — deve retornar FALSE para e-mail sem domínio após o @", () => {
        // Cenário: e-mail parcialmente digitado, faltando o domínio
        // Entrada: "usuario@"
        // Esperado: false
        const resultado = validarEmail("usuario@");
        expect(resultado).toBe(false);
    });

    test("CT03b — deve retornar FALSE para e-mail nulo ou indefinido", () => {
        // Cenário: campo de e-mail não preenchido (null/undefined)
        // Esperado: false — sistema não deve aceitar valor vazio
        expect(validarEmail(null)).toBe(false);
        expect(validarEmail(undefined)).toBe(false);
        expect(validarEmail("")).toBe(false);
    });

});

// ================================================
// BLOCO 2: Validação de Telefone
// ================================================

describe("Validação de Telefone", () => {

    test("CT04 — deve retornar FALSE para telefone com menos de 10 dígitos", () => {
        // Cenário: cliente digita número incompleto
        // Entrada: "1234" (apenas 4 dígitos)
        // Esperado: false
        const resultado = validarTelefone("1234");
        expect(resultado).toBe(false);
    });

    test("CT05 — deve retornar TRUE para telefone válido com formatação", () => {
        // Cenário: telefone formatado com parênteses e traço — formato brasileiro comum
        // Entrada: "(11) 99999-9999" → 11 dígitos após remover caracteres especiais
        // Esperado: true
        const resultado = validarTelefone("(11) 99999-9999");
        expect(resultado).toBe(true);
    });

    test("CT05b — deve retornar TRUE para telefone fixo (10 dígitos)", () => {
        // Cenário: telefone fixo com DDD — exatamente 10 dígitos
        // Entrada: "1133334444"
        // Esperado: true (valor limite mínimo aceito)
        const resultado = validarTelefone("1133334444");
        expect(resultado).toBe(true);
    });

});

// ================================================
// BLOCO 3: Validação de Campos Obrigatórios — Cliente
// ================================================

describe("Validação de Campos Obrigatórios — Cliente", () => {

    test("CT06 — deve retornar FALSE quando nome está vazio", () => {
        // Cenário: formulário de cadastro enviado sem nome
        // Entrada: { nome: "", telefone: "11999999999", email: "a@b.com" }
        // Esperado: false — campo obrigatório não preenchido
        const resultado = validarCamposCliente({
            nome: "",
            telefone: "11999999999",
            email: "a@b.com"
        });
        expect(resultado).toBe(false);
    });

    test("CT07 — deve retornar TRUE quando todos os campos do cliente estão preenchidos", () => {
        // Cenário: cadastro completo e válido de cliente
        // Entrada: { nome: "Maria Silva", telefone: "11999990000", email: "maria@email.com" }
        // Esperado: true — pode prosseguir com o cadastro
        const resultado = validarCamposCliente({
            nome: "Maria Silva",
            telefone: "11999990000",
            email: "maria@email.com"
        });
        expect(resultado).toBe(true);
    });

    test("CT07b — deve retornar FALSE quando e-mail está ausente", () => {
        // Cenário: formulário enviado sem e-mail
        // Esperado: false
        const resultado = validarCamposCliente({
            nome: "João",
            telefone: "11988887777",
            email: ""
        });
        expect(resultado).toBe(false);
    });

});

// ================================================
// BLOCO 4: Cálculo de Total do Pedido
// ================================================

describe("Cálculo de Total do Pedido", () => {

    test("CT08 — deve calcular corretamente o total com múltiplos itens", () => {
        // Cenário: pedido com 2 itens distintos
        // Entrada: Buffet Completo (R$500 × 2) + Decoração (R$300 × 1)
        // Esperado: 500*2 + 300*1 = 1300
        const itens = [
            { nome: "Buffet Completo", valor: 500, quantidade: 2 },
            { nome: "Decoração",       valor: 300, quantidade: 1 }
        ];
        const resultado = calcularTotalPedido(itens);
        expect(resultado).toBe(1300);
    });

    test("CT09 — deve retornar 0 quando quantidade do item é zero", () => {
        // Cenário: item adicionado ao pedido mas com quantidade zerada
        // Entrada: [{ valor: 50, quantidade: 0 }]
        // Esperado: 0 — nenhum valor deve ser somado
        const itens = [{ nome: "Salgados", valor: 50, quantidade: 0 }];
        const resultado = calcularTotalPedido(itens);
        expect(resultado).toBe(0);
    });

    test("CT10 — deve calcular corretamente com valores decimais (centavos)", () => {
        // Cenário: itens com preços fracionados — comum em buffets
        // Entrada: [{ valor: 29.90, quantidade: 3 }]
        // Esperado: 29.90 * 3 = 89.70
        const itens = [{ nome: "Mini Quiche", valor: 29.90, quantidade: 3 }];
        const resultado = calcularTotalPedido(itens);
        expect(resultado).toBeCloseTo(89.70, 2);
    });

    test("CT10b — deve retornar 0 para lista de itens vazia", () => {
        // Cenário: pedido criado sem nenhum item selecionado
        // Esperado: 0 — sistema não deve quebrar, deve retornar zero
        const resultado = calcularTotalPedido([]);
        expect(resultado).toBe(0);
    });

});

// ================================================
// BLOCO 5: Mapeamento de Status Pedido → Orçamento
// ================================================

describe("Mapeamento de Status (Pedido → Orçamento)", () => {

    test("CT11 — status 'Confirmado' deve mapear para 'aprovado'", () => {
        // Cenário: admin confirma o pedido do cliente
        // Regra: ao confirmar pedido, orçamento fica como "aprovado"
        // Entrada: "Confirmado"
        // Esperado: "aprovado"
        const resultado = mapearStatusOrcamento("Confirmado");
        expect(resultado).toBe("aprovado");
    });

    test("CT12 — status desconhecido deve mapear para 'pendente'", () => {
        // Cenário: sistema recebe um status não mapeado
        // Entrada: "OutroStatus"
        // Esperado: "pendente" — comportamento padrão seguro
        const resultado = mapearStatusOrcamento("OutroStatus");
        expect(resultado).toBe("pendente");
    });

    test("CT13 — status 'Cancelado' deve mapear para 'recusado'", () => {
        // Cenário: pedido cancelado pelo admin ou pelo cliente
        // Regra: ao cancelar pedido, orçamento fica como "recusado"
        // Entrada: "Cancelado"
        // Esperado: "recusado"
        const resultado = mapearStatusOrcamento("Cancelado");
        expect(resultado).toBe("recusado");
    });

    test("CT13b — status 'Finalizado' deve mapear para 'aprovado'", () => {
        // Cenário: evento já realizado, pedido finalizado
        // Regra: pedido finalizado também marca orçamento como "aprovado"
        const resultado = mapearStatusOrcamento("Finalizado");
        expect(resultado).toBe("aprovado");
    });

    test("CT13c — status 'Preparando' deve mapear para 'preparando'", () => {
        // Cenário: admin está preparando o evento
        const resultado = mapearStatusOrcamento("Preparando");
        expect(resultado).toBe("preparando");
    });

});

// ================================================
// BLOCO 6: Mapeamento de Status Orçamento → Pedido
// ================================================

describe("Mapeamento de Status (Orçamento → Pedido)", () => {

    test("deve converter status 'aprovado' para 'Confirmado'", () => {
        // Cenário: admin aprova orçamento → pedido deve ser confirmado
        const resultado = mapearStatusPedido("aprovado");
        expect(resultado).toBe("Confirmado");
    });

    test("deve converter status 'recusado' para 'Cancelado'", () => {
        // Cenário: admin recusa orçamento → pedido deve ser cancelado
        const resultado = mapearStatusPedido("recusado");
        expect(resultado).toBe("Cancelado");
    });

    test("deve retornar 'Pendente' para status de orçamento desconhecido", () => {
        // Cenário: orçamento com status não mapeado
        const resultado = mapearStatusPedido("indefinido");
        expect(resultado).toBe("Pendente");
    });

});

// ================================================
// BLOCO 7: Validação de Campos Obrigatórios — Item de Serviço
// ================================================

describe("Validação de Campos Obrigatórios — Item de Serviço", () => {

    test("CT14 — deve retornar FALSE quando categoria está vazia", () => {
        // Cenário: admin tenta cadastrar item sem categoria
        // Regra do endpoint POST /itens: nome, categoria, valor e tipo são obrigatórios
        // Entrada: { nome: "Bolo", categoria: "", valor: 150, tipo: "Sobremesa" }
        // Esperado: false
        const resultado = validarCamposItem({
            nome: "Bolo",
            categoria: "",
            valor: 150,
            tipo: "Sobremesa"
        });
        expect(resultado).toBe(false);
    });

    test("CT14b — deve retornar TRUE quando todos os campos do item estão preenchidos", () => {
        // Cenário: cadastro completo e válido de item
        const resultado = validarCamposItem({
            nome: "Frango Assado",
            categoria: "Pratos Quentes",
            valor: 280,
            tipo: "Prato Principal"
        });
        expect(resultado).toBe(true);
    });

    test("CT14c — deve retornar FALSE quando valor é 0 (falsy)", () => {
        // Cenário: item cadastrado com valor zerado — não permitido
        // Nota: 0 é falsy em JavaScript, portanto a validação atual rejeitará
        const resultado = validarCamposItem({
            nome: "Bolo",
            categoria: "Sobremesa",
            valor: 0,
            tipo: "Sobremesa"
        });
        expect(resultado).toBe(false);
    });

});

// ================================================
// BLOCO 8: Validação de Campos Obrigatórios — Evento
// ================================================

describe("Validação de Campos Obrigatórios — Evento", () => {

    test("CT15 — deve retornar FALSE quando tipo do evento está vazio", () => {
        // Cenário: formulário de evento enviado sem o tipo selecionado
        // Regra do endpoint POST /eventos: cliente_id, tipo, data e local são obrigatórios
        // Entrada: { cliente_id: 1, tipo: "", data: "2025-12-01", local: "Salão Principal" }
        // Esperado: false
        const resultado = validarCamposEvento({
            cliente_id: 1,
            tipo: "",
            data: "2025-12-01",
            local: "Salão Principal"
        });
        expect(resultado).toBe(false);
    });

    test("CT15b — deve retornar TRUE quando todos os campos do evento estão preenchidos", () => {
        // Cenário: evento cadastrado corretamente
        const resultado = validarCamposEvento({
            cliente_id: 5,
            tipo: "Casamento",
            data: "2025-12-20",
            local: "Chácara Flores"
        });
        expect(resultado).toBe(true);
    });

    test("CT15c — deve retornar FALSE quando cliente_id está ausente", () => {
        // Cenário: evento criado sem vínculo a um cliente
        // Esperado: false — todo evento precisa de um cliente
        const resultado = validarCamposEvento({
            cliente_id: null,
            tipo: "Aniversário",
            data: "2025-11-10",
            local: "Residência"
        });
        expect(resultado).toBe(false);
    });

});

// ================================================
// BLOCO 9: Validação de Campos Obrigatórios — Usuário
// ================================================

describe("Validação de Campos Obrigatórios — Usuário", () => {

    test("deve retornar FALSE quando senha está ausente no cadastro", () => {
        // Cenário: formulário de cadastro enviado sem senha
        // Regra do endpoint POST /usuarios: nome, telefone, email e senha são obrigatórios
        const resultado = validarCamposUsuario({
            nome: "Carlos",
            telefone: "11988881234",
            email: "carlos@email.com",
            senha: ""
        });
        expect(resultado).toBe(false);
    });

    test("deve retornar TRUE para cadastro de usuário completo", () => {
        // Cenário: todos os campos preenchidos corretamente
        const resultado = validarCamposUsuario({
            nome: "Ana Lima",
            telefone: "11977772222",
            email: "ana@email.com",
            senha: "senha123"
        });
        expect(resultado).toBe(true);
    });

});
