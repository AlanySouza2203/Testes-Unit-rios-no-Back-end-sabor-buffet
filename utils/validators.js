/**
 * utils/validators.js
 * 
 * Módulo de funções puras de validação e cálculo extraídas do back-end
 * do Sabor Buffet. Separado do server.js para permitir testes unitários
 * isolados, sem dependência de banco de dados ou HTTP.
 */

// ===============================
// VALIDAÇÃO DE E-MAIL
// ===============================

/**
 * Verifica se uma string possui formato de e-mail válido.
 * Regra: deve conter um "@" e um domínio com pelo menos um ponto.
 *
 * @param {string} email
 * @returns {boolean}
 */
function validarEmail(email) {
    if (!email || typeof email !== "string") return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

// ===============================
// VALIDAÇÃO DE TELEFONE
// ===============================

/**
 * Verifica se o telefone possui pelo menos 10 dígitos numéricos.
 * Remove caracteres de formatação antes de contar.
 *
 * @param {string} telefone
 * @returns {boolean}
 */
function validarTelefone(telefone) {
    if (!telefone || typeof telefone !== "string") return false;
    const apenasDigitos = telefone.replace(/\D/g, "");
    return apenasDigitos.length >= 10;
}

// ===============================
// VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
// ===============================

/**
 * Valida os campos obrigatórios para cadastro/atualização de cliente.
 * Espelha a regra do endpoint POST /clientes e PUT /clientes/:id.
 *
 * @param {{ nome: string, telefone: string, email: string }} dados
 * @returns {boolean} true se todos os campos estão preenchidos
 */
function validarCamposCliente({ nome, telefone, email } = {}) {
    return !!(nome && telefone && email);
}

/**
 * Valida os campos obrigatórios para cadastro/atualização de item.
 * Espelha a regra do endpoint POST /itens e PUT /itens/:id.
 *
 * @param {{ nome: string, categoria: string, valor: number|string, tipo: string }} dados
 * @returns {boolean}
 */
function validarCamposItem({ nome, categoria, valor, tipo } = {}) {
    return !!(nome && categoria && valor && tipo);
}

/**
 * Valida os campos obrigatórios para criação de evento.
 * Espelha a regra do endpoint POST /eventos.
 *
 * @param {{ cliente_id: number, tipo: string, data: string, local: string }} dados
 * @returns {boolean}
 */
function validarCamposEvento({ cliente_id, tipo, data, local } = {}) {
    return !!(cliente_id && tipo && data && local);
}

/**
 * Valida os campos obrigatórios para cadastro de usuário.
 * Espelha a regra do endpoint POST /usuarios.
 *
 * @param {{ nome: string, telefone: string, email: string, senha: string }} dados
 * @returns {boolean}
 */
function validarCamposUsuario({ nome, telefone, email, senha } = {}) {
    return !!(nome && telefone && email && senha);
}

// ===============================
// CÁLCULO DE TOTAL DO PEDIDO
// ===============================

/**
 * Calcula o valor total de um pedido somando valor × quantidade de cada item.
 * Espelha a lógica presente no endpoint POST /pedidos e PUT /pedidos/:id/confirmar.
 *
 * @param {Array<{ valor: number, quantidade: number }>} itens
 * @returns {number} total calculado
 */
function calcularTotalPedido(itens) {
    if (!Array.isArray(itens)) return 0;
    return itens.reduce(
        (acc, item) => acc + ((Number(item.valor) || 0) * (Number(item.quantidade) || 0)),
        0
    );
}

// ===============================
// MAPEAMENTO DE STATUS
// ===============================

/**
 * Converte o status de um pedido para o status equivalente de orçamento.
 * Espelha a lógica do endpoint PUT /pedidos/:id/status.
 *
 * Mapeamento:
 *   "Confirmado"  → "aprovado"
 *   "Preparando"  → "preparando"
 *   "Cancelado"   → "recusado"
 *   "Finalizado"  → "aprovado"
 *   (qualquer outro) → "pendente"
 *
 * @param {string} statusPedido
 * @returns {string} statusOrcamento
 */
function mapearStatusOrcamento(statusPedido) {
    const mapa = {
        Confirmado: "aprovado",
        Preparando: "preparando",
        Cancelado:  "recusado",
        Finalizado: "aprovado"
    };
    return mapa[statusPedido] ?? "pendente";
}

/**
 * Converte o status de um orçamento para o status equivalente de pedido.
 * Espelha a lógica do endpoint PUT /orcamentos/:id.
 *
 * Mapeamento:
 *   "aprovado"    → "Confirmado"
 *   "recusado"    → "Cancelado"
 *   "preparando"  → "Preparando"
 *   (qualquer outro) → "Pendente"
 *
 * @param {string} statusOrcamento
 * @returns {string} statusPedido
 */
function mapearStatusPedido(statusOrcamento) {
    const mapa = {
        aprovado:   "Confirmado",
        recusado:   "Cancelado",
        preparando: "Preparando"
    };
    return mapa[statusOrcamento] ?? "Pendente";
}

// ===============================
// EXPORTAÇÕES
// ===============================

module.exports = {
    validarEmail,
    validarTelefone,
    validarCamposCliente,
    validarCamposItem,
    validarCamposEvento,
    validarCamposUsuario,
    calcularTotalPedido,
    mapearStatusOrcamento,
    mapearStatusPedido
};
