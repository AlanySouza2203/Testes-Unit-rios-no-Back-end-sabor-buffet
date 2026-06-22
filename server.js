const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "buffet_db",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
  } else {
    console.log("Conectado ao MySQL ");
  }
});

// ===============================
// TESTE SERVIDOR
// ===============================

app.get("/", (req, res) => {
    res.send("Servidor funcionando");
});

// ===============================
// ITENS
// ===============================

// LISTAR ITENS
app.get("/itens", (req, res) => {

    const { categoria } = req.query;

    let sql = "SELECT * FROM item_servico";
    const params = [];

    if (categoria && categoria !== "todos") {
        sql += " WHERE categoria = ?";
        params.push(categoria);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, result) => {

        if (err) {
            console.log("Erro ao buscar itens:", err);

            return res.status(500).json({
                erro: "Erro ao buscar itens"
            });
        }

        res.json(result);
    });
});

// CRIAR ITEM
app.post("/itens", (req, res) => {

    const { nome, categoria, valor, imagem, tipo } = req.body;

    if (!nome || !categoria || !valor || !tipo) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    const sql = `
        INSERT INTO item_servico
        (nome, tipo, categoria, valor, imagem)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [nome, tipo, categoria, valor, imagem || null],
        (err, result) => {

            if (err) {
                console.log("Erro ao cadastrar item:", err);

                return res.status(500).json({
                    erro: "Erro ao cadastrar item"
                });
            }

            res.json({
                mensagem: "Item cadastrado com sucesso",
                id: result.insertId
            });
        }
    );
});

// ATUALIZAR ITEM
app.put("/itens/:id", (req, res) => {

    const { nome, categoria, valor, imagem, tipo } = req.body;
    const { id } = req.params;

    if (!nome || !categoria || !valor || !tipo) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    db.query(
        `
        UPDATE item_servico
        SET nome = ?, tipo = ?, categoria = ?, valor = ?, imagem = ?
        WHERE id = ?
        `,
        [nome, tipo, categoria, valor, imagem || null, id],
        (err, result) => {

            if (err) {
                console.log("Erro ao atualizar item:", err);

                return res.status(500).json({
                    erro: "Erro ao atualizar item"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Item não encontrado"
                });
            }

            res.json({
                mensagem: "Item atualizado com sucesso"
            });
        }
    );
});

// DELETAR ITEM
app.delete("/itens/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM item_servico WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.log("Erro ao deletar item:", err);

                return res.status(500).json({
                    erro: "Erro ao deletar item"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Item não encontrado"
                });
            }

            res.json({
                mensagem: "Item removido com sucesso"
            });
        }
    );
});

// ===============================
// CLIENTES
// ===============================

// CRIAR CLIENTE (com evento e orçamento automático)
app.post("/clientes", (req, res) => {

    const { nome, telefone, email, admin_id } = req.body;

    if (!nome || !telefone || !email) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    const adminFinal = admin_id || 1;

    // 1. CRIAR CLIENTE
    db.query(
        `INSERT INTO cliente (nome, telefone, email, admin_id)
         VALUES (?, ?, ?, ?)`,
        [nome, telefone, email, adminFinal],
        (err, resultCliente) => {
            if (err) {
                console.log("Erro ao cadastrar cliente:", err);
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        erro: "E-mail já cadastrado"
                    });
                }
                return res.status(500).json({
                    erro: "Erro ao cadastrar cliente"
                });
            }

            const clienteId = resultCliente.insertId;
            console.log("✓ Cliente criado ID:", clienteId);

            // 2. CRIAR EVENTO PADRÃO
            const dataEvento = new Date();
            dataEvento.setDate(dataEvento.getDate() + 30);
            const dataFormatada = dataEvento.toISOString().split('T')[0];

            db.query(
                `INSERT INTO evento (cliente_id, tipo, data, convidados, local, admin_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [clienteId, "Buffet", dataFormatada, 50, "A definir", adminFinal],
                (err2, resultEvento) => {
                    if (err2) {
                        console.log("Erro ao criar evento:", err2);
                        return res.status(500).json({ 
                            erro: "Erro ao criar evento",
                            clienteId 
                        });
                    }

                    const eventoId = resultEvento.insertId;
                    console.log("✓ Evento criado ID:", eventoId);

                    // 3. BUSCAR PRIMEIRO ITEM PARA USAR COMO PADRÃO
                    db.query(
                        `SELECT id, valor FROM item_servico ORDER BY id ASC LIMIT 1`,
                        [],
                        (err3, itens) => {
                            if (err3 || !itens.length) {
                                console.log("Aviso: Sem itens disponíveis para orçamento");
                                return res.status(500).json({ 
                                    erro: "Nenhum item disponível no cardápio",
                                    clienteId,
                                    eventoId
                                });
                            }

                            const itemPadrao = itens[0];
                            const valorTotal = itemPadrao.valor * 1;

                            // 4. CRIAR ORÇAMENTO COM ITEM PADRÃO
                            db.query(
                                `INSERT INTO orcamento (evento_id, admin_id, valor_total, status, status_pagamento)
                                 VALUES (?, ?, ?, ?, ?)`,
                                [eventoId, adminFinal, valorTotal, "pendente", "pendente"],
                                (err4, resultOrcamento) => {
                                    if (err4) {
                                        console.log("Erro ao criar orçamento:", err4);
                                        return res.status(500).json({ 
                                            erro: "Erro ao criar orçamento",
                                            clienteId,
                                            eventoId
                                        });
                                    }

                                    const orcamentoId = resultOrcamento.insertId;
                                    console.log("✓ Orçamento criado ID:", orcamentoId);

                                    // 5. INSERIR ITEM NO ORÇAMENTO
                                    db.query(
                                        `INSERT INTO item_orcamento (orcamento_id, item_servico_id, quantidade, valor)
                                         VALUES (?, ?, ?, ?)`,
                                        [orcamentoId, itemPadrao.id, 1, itemPadrao.valor],
                                        (err5) => {
                                            if (err5) {
                                                console.log("Erro ao adicionar item ao orçamento:", err5);
                                                return res.status(500).json({ 
                                                    erro: "Erro ao adicionar items",
                                                    clienteId,
                                                    eventoId,
                                                    orcamentoId
                                                });
                                            }

                                            console.log("✓ Item adicionado ao orçamento");
                                            console.log("=== ✅ CLIENTE + EVENTO + ORÇAMENTO CRIADOS ===");

                                            res.json({
                                                mensagem: "Cliente cadastrado com evento e orçamento!",
                                                dados: {
                                                    cliente: { id: clienteId, nome, email },
                                                    evento: { id: eventoId, tipo: "Buffet", data: dataFormatada },
                                                    orcamento: { id: orcamentoId, status: "pendente", valor_total: valorTotal }
                                                }
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// LISTAR CLIENTES
app.get("/clientes", (req, res) => {

    let sql = "SELECT * FROM cliente ORDER BY id DESC";

    db.query(sql, (err, result) => {

        if (err) {
            console.log("Erro ao buscar clientes:", err);

            return res.status(500).json({
                erro: "Erro ao buscar clientes"
            });
        }

        res.json(result);
    });
});

// ATUALIZAR CLIENTE
app.put("/clientes/:id", (req, res) => {

    const { nome, telefone, email } = req.body;
    const { id } = req.params;

    if (!nome || !telefone || !email) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    db.query(
        `
        UPDATE cliente
        SET nome = ?, telefone = ?, email = ?
        WHERE id = ?
        `,
        [nome, telefone, email, id],
        (err, result) => {

            if (err) {
                console.log("Erro ao atualizar cliente:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        erro: "E-mail já está em uso"
                    });
                }

                return res.status(500).json({
                    erro: "Erro ao atualizar cliente"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Cliente não encontrado"
                });
            }

            res.json({
                mensagem: "Cliente atualizado com sucesso"
            });
        }
    );
});


// DELETAR CLIENTE
app.delete("/clientes/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "SELECT id FROM evento WHERE cliente_id = ?",
        [id],
        (err, eventos) => {

            if (err) {
                console.log("Erro ao verificar eventos:", err);
                return res.status(500).json({
                    erro: "Erro interno"
                });
            }

            if (eventos.length > 0) {
                return res.status(400).json({
                    erro: "Cliente possui eventos vinculados"
                });
            }

            db.query(
                "DELETE FROM cliente WHERE id = ?",
                [id],
                (err2, result) => {

                    if (err2) {
                        console.log("Erro ao deletar cliente:", err2);
                        return res.status(500).json({
                            erro: "Erro ao deletar cliente"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            erro: "Cliente não encontrado"
                        });
                    }

                    res.json({
                        mensagem: "Cliente removido com sucesso"
                    });
                }
            );
        }
    );
});

// ===============================
// EVENTOS
// ===============================

// CRIAR EVENTO
app.post("/eventos", (req, res) => {

    const {
        cliente_id,
        tipo,
        data,
        convidados,
        local,
        admin_id
    } = req.body;

    if (!cliente_id || !tipo || !data || !local) {
        return res.status(400).json({
            erro: "Campos obrigatórios"
        });
    }

    db.query(
        "SELECT id, admin_id FROM cliente WHERE id = ?",
        [cliente_id],
        (err, cliente) => {

            if (err) {
                console.log("Erro ao verificar cliente:", err);

                return res.status(500).json({
                    erro: "Erro ao verificar cliente"
                });
            }

            if (cliente.length === 0) {
                return res.status(404).json({
                    erro: "Cliente não encontrado"
                });
            }

            const adminFinal = admin_id || cliente[0].admin_id || 1;

            db.query(
                `
                INSERT INTO evento
                (cliente_id, tipo, data, convidados, local, admin_id)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    cliente_id,
                    tipo,
                    data,
                    convidados || 0,
                    local,
                    adminFinal
                ],
                (err2, result) => {

                    if (err2) {
                        console.log("Erro ao criar evento:", err2);

                        return res.status(500).json({
                            erro: "Erro ao criar evento"
                        });
                    }

                    res.json({
                        mensagem: "Evento criado com sucesso",
                        id: result.insertId
                    });
                }
            );
        }
    );
});


// LISTAR EVENTOS
app.get("/eventos", (req, res) => {

    const { cliente_id, admin_id } = req.query;

    let sql = `
        SELECT
            e.*,
            c.nome AS cliente
        FROM evento e
        JOIN cliente c ON c.id = e.cliente_id
        WHERE 1 = 1
    `;

    const params = [];

    if (cliente_id) {
        sql += " AND e.cliente_id = ?";
        params.push(cliente_id);
    }

    if (admin_id) {
        sql += " AND e.admin_id = ?";
        params.push(admin_id);
    }

    sql += " ORDER BY e.id DESC";

    db.query(sql, params, (err, result) => {

        if (err) {
            console.log("Erro ao buscar eventos:", err);

            return res.status(500).json({
                erro: "Erro ao buscar eventos"
            });
        }

        console.log("EVENTOS:", result);

        res.json(result);
    });
});

// DELETAR EVENTO
app.delete("/eventos/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM pedidos WHERE evento_id = ?",
        [id],
        (err) => {

            if (err) {
                console.log("Erro ao deletar pedidos:", err);

                return res.status(500).json({
                    erro: "Erro ao deletar pedidos vinculados"
                });
            }

            db.query(
                "DELETE FROM evento WHERE id = ?",
                [id],
                (err2, result) => {

                    if (err2) {
                        console.log("Erro ao deletar evento:", err2);

                        return res.status(500).json({
                            erro: "Erro ao deletar evento"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            erro: "Evento não encontrado"
                        });
                    }

                    res.json({
                        mensagem: "Evento removido com sucesso"
                    });
                }
            );
        }
    );
});

// ===============================
// LOGIN
// ===============================

app.post("/login", (req, res) => {

    const { email, senha } = req.body;

    const sql = `
        SELECT
            u.*,
            c.id AS clienteId
        FROM usuario u
        LEFT JOIN cliente c ON c.usuario_id = u.id
        WHERE u.email = ?
    `;

    db.query(sql, [email], (err, result) => {

        if (err) {
            console.log("Erro no login:", err);

            return res.status(500).json({
                success: false
            });
        }

        if (result.length === 0) {
            return res.json({
                success: false
            });
        }

        const usuario = result[0];

        if (usuario.senha !== senha) {
            return res.json({
                success: false
            });
        }

        res.json({
            success: true,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                tipo: usuario.tipo
            },
            clienteId: usuario.clienteId || null
        });
    });
});

// ===============================
// USUÁRIOS
// ===============================

// CADASTRAR USUÁRIO
app.post("/usuarios", (req, res) => {

    const { nome, telefone, email, senha } = req.body;

    if (!nome || !telefone || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    db.query(
        `
        INSERT INTO usuario
        (nome, email, senha, tipo)
        VALUES (?, ?, ?, 'cliente')
        `,
        [nome, email, senha],
        (err, resultUsuario) => {

            if (err) {
                console.log("Erro ao criar usuário:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(400).json({
                        erro: "E-mail já cadastrado"
                    });
                }

                return res.status(500).json({
                    erro: "Erro ao criar usuário"
                });
            }

            const usuarioId = resultUsuario.insertId;

            db.query(
                `
                INSERT INTO cliente
                (nome, telefone, email, usuario_id, admin_id)
                VALUES (?, ?, ?, ?, ?)
                `,
                [nome, telefone, email, usuarioId, 1],
                (err2, resultCliente) => {

                    if (err2) {
                        console.log("Erro ao criar cliente:", err2);

                        return res.status(500).json({
                            erro: "Usuário criado, mas erro ao criar cliente"
                        });
                    }

                    res.json({
                        mensagem: "Cadastro realizado com sucesso",
                        usuarioId,
                        clienteId: resultCliente.insertId
                    });
                }
            );
        }
    );
});

// ===============================
// PEDIDOS
// ===============================

// CRIAR PEDIDO
app.post("/pedidos", (req, res) => {

    const {
        cliente_id,
        evento_id,
        admin_id,
        itens,
        total,
        metodo_pagamento
    } = req.body;

    if (!cliente_id || !evento_id || !itens?.length) {
        return res.status(400).json({
            erro: "Dados incompletos"
        });
    }

    const totalFinal = typeof total === "number"
        ? total
        : itens.reduce((acc, item) => acc + (item.valor * item.quantidade), 0);

    db.query(
        `SELECT e.admin_id AS evento_admin, c.admin_id AS cliente_admin
         FROM evento e
         LEFT JOIN cliente c ON c.id = e.cliente_id
         WHERE e.id = ?`,
        [evento_id],
        (err, rows) => {
            if (err) {
                console.log("Erro ao buscar evento para pedido:", err);
                return res.status(500).json({ erro: "Erro ao salvar pedido" });
            }

            if (!rows.length) {
                return res.status(400).json({ erro: "Evento não encontrado" });
            }

            const adminFinal = admin_id || rows[0].evento_admin || rows[0].cliente_admin || null;

            const sql = `
                INSERT INTO pedidos
                (
                    cliente_id,
                    evento_id,
                    admin_id,
                    itens,
                    total,
                    metodo_pagamento,
                    status,
                    status_pagamento
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
                sql,
                [
                    cliente_id,
                    evento_id,
                    adminFinal,
                    JSON.stringify(itens),
                    totalFinal,
                    metodo_pagamento || null,
                    "Pendente",
                    "pendente"
                ],
                (err2, result) => {

                    if (err2) {
                        console.log(err2);

                        return res.status(500).json({
                            erro: "Erro ao salvar pedido"
                        });
                    }

                    res.json({
                        mensagem: "Pedido salvo com sucesso",
                        id: result.insertId
                    });
                }
            );
        }
    );
});

// LISTAR PEDIDOS
app.get("/pedidos", (req, res) => {

    const { evento_id, cliente_id } = req.query;

    let sql = `
        SELECT 
            p.*, 
            c.nome AS cliente, 
            c.email AS cliente_email,
            c.telefone AS cliente_telefone,
            e.tipo AS evento_tipo,
            e.data AS evento_data
        FROM pedidos p
        JOIN cliente c ON p.cliente_id = c.id
        LEFT JOIN evento e ON p.evento_id = e.id
        WHERE 1=1`;
    const params = [];

    if (evento_id) {
        sql += " AND evento_id = ?";
        params.push(evento_id);
    }

    if (cliente_id) {
        sql += " AND cliente_id = ?";
        params.push(cliente_id);
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                erro: "Erro ao buscar pedidos"
            });
        }

        res.json(result);
    });
});

app.get("/meu-pedido/:clienteId", (req, res) => {

    const clienteId = req.params.clienteId;

    const sql = `
        SELECT
            p.id,
            p.status,
            p.total,
            e.tipo,
            e.data,
            e.local,
            e.convidados
        FROM pedidos p
        INNER JOIN evento e ON p.evento_id = e.id
        WHERE e.cliente_id = ?
        ORDER BY p.id DESC
        LIMIT 1
    `;

    db.query(sql, [clienteId], (err, result) => {

        if(err){
            return res.status(500).json(err);
        }

        res.json(result[0]);
    });
});

// ATUALIZAR STATUS PEDIDO (SEM GERAR ORÇAMENTO)
app.put("/pedidos/:id/status", (req, res) => {

    const { status } = req.body;
    const { id } = req.params;

    db.query(
        "UPDATE pedidos SET status = ? WHERE id = ?",
        [status, id],
        (err, result) => {

            if (err) {
                console.log("Erro ao atualizar status:", err);

                return res.status(500).json({
                    erro: "Erro ao atualizar status"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });
            }

            // SINCRONIZAR COM A TABELA DE ORÇAMENTOS PARA O CLIENTE VER NA TIMELINE
            db.query("SELECT evento_id FROM pedidos WHERE id = ?", [id], (err2, rows) => {
                if (!err2 && rows.length > 0) {
                    const evId = rows[0].evento_id;
                    let statusOrcamento = 'pendente';
                    
                    // Mapeamento para o status do orçamento (usado na timeline do cliente)
                    if (status === 'Confirmado') statusOrcamento = 'aprovado';
                    if (status === 'Preparando') statusOrcamento = 'preparando';
                    if (status === 'Cancelado') statusOrcamento = 'recusado';
                    if (status === 'Finalizado') statusOrcamento = 'aprovado';

                    db.query("UPDATE orcamento SET status = ? WHERE evento_id = ?", [statusOrcamento, evId], (err3) => {
                        if (err3) console.error("Erro ao sincronizar orçamento:", err3);
                    });
                }
            });

            res.json({
                mensagem: "Status atualizado com sucesso"
            });
        }
    );
});

// ✅ CONFIRMAR PEDIDO E GERAR ORÇAMENTO (ENDPOINT CORRIGIDO)
app.put("/pedidos/:id/confirmar", (req, res) => {
    const { id } = req.params;
    
    console.log("=== CONFIRMANDO PEDIDO E GERANDO ORÇAMENTO ===");
    console.log("Pedido ID:", id);
    
    // 1. Buscar dados do pedido
    db.query(
        `SELECT p.*, e.admin_id 
         FROM pedidos p
         JOIN evento e ON e.id = p.evento_id
         WHERE p.id = ?`,
        [id],
        (err, pedidos) => {
            if (err) {
                console.log("❌ Erro ao buscar pedido:", err);
                return res.status(500).json({ erro: "Erro ao buscar pedido" });
            }
            
            if (!pedidos.length) {
                return res.status(404).json({ erro: "Pedido não encontrado" });
            }
            
            const pedido = pedidos[0];
            
            // Converter itens JSON se necessário
            let itensJSON = pedido.itens;
            if (typeof itensJSON === 'string') {
                try {
                    itensJSON = JSON.parse(itensJSON);
                } catch (e) {
                    console.log("❌ Erro ao fazer parse de itens:", e);
                    return res.status(400).json({ erro: "Formato de itens inválido" });
                }
            }
            
            if (!Array.isArray(itensJSON) || itensJSON.length === 0) {
                return res.status(400).json({ erro: "Pedido sem itens" });
            }
            
            console.log("✓ Pedido encontrado:", pedido.id);
            console.log("✓ Itens:", JSON.stringify(itensJSON, null, 2));
            
            // 2. Atualizar status do pedido para "Confirmado"
            db.query(
                `UPDATE pedidos SET status = 'Confirmado' WHERE id = ?`,
                [id],
                (err) => {
                    if (err) {
                        console.log("❌ Erro ao atualizar status do pedido:", err);
                        return res.status(500).json({ erro: "Erro ao atualizar pedido" });
                    }
                    
                    console.log("✓ Pedido marcado como 'Confirmado'");
                    
                    // 3. Calcular total do pedido
                    const total = itensJSON.reduce((acc, item) => {
                        return acc + ((Number(item.valor) || 0) * (Number(item.quantidade) || 0));
                    }, 0);
                    
                    console.log("✓ Total calculado:", total);
                    
                    // 4. Criar ORÇAMENTO a partir do pedido confirmado
                    db.query(
                        `INSERT INTO orcamento (evento_id, admin_id, valor_total, status, status_pagamento)
                         VALUES (?, ?, ?, 'pendente', 'pendente')`,
                        [pedido.evento_id, pedido.admin_id || 1, total],
                        (err2, resultOrcamento) => {
                            if (err2) {
                                console.log("❌ Erro ao criar orçamento:", err2);
                                return res.status(500).json({ erro: "Erro ao criar orçamento" });
                            }
                            
                            const orcamentoId = resultOrcamento.insertId;
                            console.log("✓ Orçamento criado - ID:", orcamentoId);
                            
                            // 5. Processar cada item e buscar seu ID correto
                            let processados = 0;
                            let errosItens = [];
                            const itensInseridos = [];
                            
                            itensJSON.forEach((item) => {
                                // IMPORTANTE: Buscar o item_servico_id pelo nome
                                db.query(
                                    `SELECT id, valor FROM item_servico WHERE nome LIKE ? LIMIT 1`,
                                    [`%${item.nome}%`], // Usar LIKE para flexibilidade
                                    (err3, servicos) => {
                                        if (err3) {
                                            console.log(`❌ Erro ao buscar item "${item.nome}":`, err3);
                                            errosItens.push(`Erro ao buscar ${item.nome}`);
                                            processados++;
                                        } else if (!servicos || servicos.length === 0) {
                                            console.log(`⚠ Item "${item.nome}" não encontrado em item_servico`);
                                            errosItens.push(`Item "${item.nome}" não existe no cardápio`);
                                            processados++;
                                        } else {
                                            const servico = servicos[0];
                                            const quantidade = Number(item.quantidade) || 1;
                                            const valor = Number(item.valor) || Number(servico.valor) || 0;
                                            
                                            // VERIFICAÇÃO CRÍTICA: ID válido?
                                            if (!servico.id || servico.id <= 0) {
                                                console.log(`❌ ID inválido para "${item.nome}": ${servico.id}`);
                                                errosItens.push(`ID inválido para ${item.nome}`);
                                                processados++;
                                                return;
                                            }
                                            
                                            console.log(`✓ Item "${item.nome}" encontrado com ID: ${servico.id}`);
                                            
                                            // Inserir item no orçamento
                                            db.query(
                                                `INSERT INTO item_orcamento 
                                                (orcamento_id, item_servico_id, quantidade, valor)
                                                VALUES (?, ?, ?, ?)`,
                                                [orcamentoId, servico.id, quantidade, valor],
                                                (err4) => {
                                                    if (err4) {
                                                        console.log(`❌ Erro ao inserir item "${item.nome}":`, err4.message);
                                                        errosItens.push(`Erro ao adicionar ${item.nome}`);
                                                    } else {
                                                        console.log(`✓ Item "${item.nome}" (ID: ${servico.id}) inserido com sucesso`);
                                                        itensInseridos.push({
                                                            nome: item.nome,
                                                            id: servico.id,
                                                            quantidade: quantidade,
                                                            valor: valor
                                                        });
                                                    }
                                                    
                                                    processados++;
                                                    
                                                    // Quando todos os itens foram processados
                                                    if (processados === itensJSON.length) {
                                                        if (errosItens.length === 0) {
                                                            console.log("=== ✅ PEDIDO CONFIRMADO + ORÇAMENTO GERADO COM SUCESSO ===");
                                                            res.json({
                                                                sucesso: true,
                                                                mensagem: "Pedido confirmado e orçamento gerado com sucesso!",
                                                                pedidoId: id,
                                                                orcamentoId: orcamentoId,
                                                                status: "Confirmado",
                                                                itens: itensInseridos,
                                                                total: total
                                                            });
                                                        } else {
                                                            console.log("=== ⚠ PEDIDO CONFIRMADO COM ERROS NO ORÇAMENTO ===");
                                                            res.status(206).json({
                                                                sucesso: true,
                                                                mensagem: "Pedido confirmado, mas houve problemas ao gerar alguns itens do orçamento",
                                                                pedidoId: id,
                                                                orcamentoId: orcamentoId,
                                                                status: "Confirmado",
                                                                itens: itensInseridos,
                                                                erros: errosItens,
                                                                total: total
                                                            });
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            });
                        }
                    );
                }
            );
        }
    );
});

// DELETAR PEDIDO
app.delete("/pedidos/:id", (req, res) => {

    const { id } = req.params;

    db.query(
        "DELETE FROM pedidos WHERE id = ?",
        [id],
        (err, result) => {

            if (err) {
                console.log("Erro ao deletar pedido:", err);

                return res.status(500).json({
                    erro: "Erro ao deletar pedido"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Pedido não encontrado"
                });
            }

            res.json({
                mensagem: "Pedido removido com sucesso"
            });
        }
    );
});

// ===============================
// ORÇAMENTOS
// ===============================

// CRIAR ORÇAMENTO MANUALMENTE
app.post("/orcamentos", (req, res) => {
    console.log("=== CRIANDO ORÇAMENTO ===");
    console.log("Body recebido:", JSON.stringify(req.body, null, 2));

    const { evento_id, admin_id, itens, status, status_pagamento, valor_total } = req.body;

    if (!evento_id || !itens?.length) {
        console.log("❌ ERRO: Dados inválidos", { evento_id, itensLength: itens?.length });
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    db.query(
        "SELECT admin_id FROM evento WHERE id = ?",
        [evento_id],
        (err, eventos) => {
            if (err) {
                console.log("❌ Erro ao buscar evento:", err);
                return res.status(500).json({ erro: "Erro ao criar orçamento" });
            }

            if (!eventos.length) {
                console.log("❌ ERRO: Evento não encontrado", { evento_id });
                return res.status(400).json({ erro: "Evento não encontrado" });
            }

            const adminFinal = admin_id || eventos[0].admin_id || 1;

            console.log("✓ Itens recebidos:", JSON.stringify(itens, null, 2));

            const total = valor_total || itens.reduce(
                (acc, i) => acc + (Number(i.valor || 0) * Number(i.quantidade || 0)),
                0
            );

            console.log("✓ Total calculado:", total);
            console.log("✓ Admin final:", adminFinal);

            db.query(
                `INSERT INTO orcamento (evento_id, admin_id, valor_total, status, status_pagamento)
                 VALUES (?, ?, ?, ?, ?)`,
                [evento_id, adminFinal, total, status || "pendente", status_pagamento || "pendente"],
                (err2, resultOrcamento) => {
                    if (err2) {
                        console.log("❌ Erro ao inserir orçamento:", err2);
                        return res.status(500).json({ erro: "Erro ao criar orçamento" });
                    }

                    const orcamentoId = resultOrcamento.insertId;
                    console.log("✓ Orçamento criado - ID:", orcamentoId);

                    // Processar itens um por um
                    let processados = 0;
                    let errosItens = [];

                    if (itens.length === 0) {
                        finalizarCriacao();
                        return;
                    }

                    itens.forEach((item) => {
                        // Se vem com item_servico_id, usar diretamente
                        if (item.item_servico_id) {
                            // VERIFICAR se o ID existe
                            db.query(
                                `SELECT id FROM item_servico WHERE id = ?`,
                                [item.item_servico_id],
                                (errCheck, check) => {
                                    if (errCheck || !check || check.length === 0) {
                                        console.log(`❌ Item ID ${item.item_servico_id} não existe em item_servico`);
                                        errosItens.push(`Item ID ${item.item_servico_id} não existe`);
                                        processados++;
                                        
                                        if (processados === itens.length) {
                                            finalizarCriacao();
                                        }
                                    } else {
                                        // ID válido, inserir
                                        db.query(
                                            `INSERT INTO item_orcamento 
                                            (orcamento_id, item_servico_id, quantidade, valor)
                                            VALUES (?, ?, ?, ?)`,
                                            [orcamentoId, item.item_servico_id, Number(item.quantidade) || 1, Number(item.valor) || 0],
                                            (err3) => {
                                                if (err3) {
                                                    console.log(`❌ Erro ao inserir item ID ${item.item_servico_id}:`, err3.message);
                                                    errosItens.push(`Erro ao adicionar item`);
                                                } else {
                                                    console.log(`✓ Item ID ${item.item_servico_id} adicionado`);
                                                }
                                                processados++;

                                                if (processados === itens.length) {
                                                    finalizarCriacao();
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        } else if (item.nome) {
                            // Buscar pelo nome
                            db.query(
                                `SELECT id FROM item_servico WHERE nome LIKE ? LIMIT 1`,
                                [`%${item.nome}%`],
                                (err3, servicos) => {
                                    if (err3 || !servicos || servicos.length === 0) {
                                        console.log(`⚠ Item "${item.nome}" não encontrado`);
                                        errosItens.push(`Item "${item.nome}" não existe`);
                                        processados++;
                                        
                                        if (processados === itens.length) {
                                            finalizarCriacao();
                                        }
                                    } else {
                                        const itemId = servicos[0].id;
                                        
                                        // Validar ID
                                        if (!itemId || itemId <= 0) {
                                            console.log(`⚠ ID inválido para "${item.nome}"`);
                                            errosItens.push(`ID inválido para ${item.nome}`);
                                            processados++;
                                            
                                            if (processados === itens.length) {
                                                finalizarCriacao();
                                            }
                                            return;
                                        }
                                        
                                        db.query(
                                            `INSERT INTO item_orcamento 
                                            (orcamento_id, item_servico_id, quantidade, valor)
                                            VALUES (?, ?, ?, ?)`,
                                            [orcamentoId, itemId, Number(item.quantidade) || 1, Number(item.valor) || 0],
                                            (err4) => {
                                                if (err4) {
                                                    console.log(`❌ Erro ao inserir item "${item.nome}":`, err4.message);
                                                    errosItens.push(`Erro ao adicionar ${item.nome}`);
                                                } else {
                                                    console.log(`✓ Item "${item.nome}" adicionado`);
                                                }
                                                processados++;

                                                if (processados === itens.length) {
                                                    finalizarCriacao();
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        } else {
                            console.log("⚠ Item sem ID nem nome");
                            errosItens.push("Item sem identificação");
                            processados++;

                            if (processados === itens.length) {
                                finalizarCriacao();
                            }
                        }
                    });

                    function finalizarCriacao() {
                        if (errosItens.length === 0) {
                            console.log("=== ✅ ORÇAMENTO CRIADO COM SUCESSO ===");
                            res.json({
                                mensagem: "Orçamento criado com sucesso",
                                id: orcamentoId,
                                total: total,
                                totalItens: itens.length
                            });
                        } else {
                            console.log("=== ⚠ ORÇAMENTO CRIADO COM ERROS ===");
                            res.status(206).json({
                                mensagem: "Orçamento criado, mas com erros ao adicionar itens",
                                id: orcamentoId,
                                total: total,
                                erros: errosItens
                            });
                        }
                    }
                }
            );
        }
    );
});

// ATUALIZAR ORÇAMENTO
app.put("/orcamentos/:id", (req, res) => {
    const { id } = req.params;
    const { status, itens, evento_id, valor_total } = req.body;
    
    console.log("=== ATUALIZANDO ORÇAMENTO ID:", id);

    // Se não enviou itens, atualizamos apenas o status (preserva o total e itens atuais)
    if (!itens || itens.length === 0) {
        db.query(
            "UPDATE orcamento SET status = ? WHERE id = ?",
            [status, id],
            (err) => {
                if (err) return res.status(500).json({ erro: "Erro ao atualizar status" });

                // SINCRONIZAR COM TABELA DE PEDIDOS
                db.query("SELECT evento_id FROM orcamento WHERE id = ?", [id], (err2, rows) => {
                    if (!err2 && rows.length > 0) {
                        const evId = rows[0].evento_id;
                        let statusPedido = 'Pendente';
                        // Mapeamento correto para a tabela de pedidos
                        if (status === 'aprovado') statusPedido = 'Confirmado'; 
                        if (status === 'recusado') statusPedido = 'Cancelado';
                        if (status === 'preparando') statusPedido = 'Preparando';
                        
                        db.query("UPDATE pedidos SET status = ? WHERE evento_id = ?", [statusPedido, evId]);
                        console.log(`✓ Sincronizado Pedido (Evento: ${evId}) para: ${statusPedido}`);
                    }
                });

                res.json({ mensagem: "Status atualizado com sucesso" });
            }
        );
        return;
    }

    // Se enviou itens
    const total = valor_total || itens.reduce((acc, i) => acc + ((Number(i.valor) || 0) * (Number(i.quantidade) || 0)), 0);

    db.query(
        `UPDATE orcamento 
         SET evento_id=?, valor_total=?, status=?
         WHERE id=?`,
        [evento_id || null, total, status, id],
        (err) => {
            if (err) {
                console.log("❌ Erro ao atualizar orçamento:", err);
                return res.status(500).json({ erro: "Erro ao atualizar orçamento" });
            }

            // SINCRONIZAR COM PEDIDOS (Caso o admin envie itens novos também)
            db.query("SELECT evento_id FROM orcamento WHERE id = ?", [id], (err2, rows) => {
                if (!err2 && rows.length > 0) {
                    const evId = rows[0].evento_id;
                    let statusPedido = 'Pendente';
                    if (status === 'aprovado') statusPedido = 'Confirmado';
                    if (status === 'recusado') statusPedido = 'Cancelado';
                    if (status === 'preparando') statusPedido = 'Preparando';
                    
                    db.query("UPDATE pedidos SET status = ? WHERE evento_id = ?", [statusPedido, evId]);
                    console.log(`✓ Sincronizado Pedido (Evento: ${evId}) para: ${statusPedido}`);
                }
            });

            // Deletar itens antigos
            db.query(`DELETE FROM item_orcamento WHERE orcamento_id=?`, [id], (errDel) => {
                if (errDel) {
                    console.log("⚠ Erro ao deletar itens antigos:", errDel);
                }
                
                console.log("✓ Itens antigos deletados. Inserindo novos...");

                let processados = 0;
                let errosItens = [];

                if (itens.length === 0) {
                    finalizarAtualizacao();
                    return;
                }

                itens.forEach((item) => {
                    if (item.item_servico_id) {
                        // Verificar se ID existe
                        db.query(
                            `SELECT id FROM item_servico WHERE id = ?`,
                            [item.item_servico_id],
                            (errCheck, check) => {
                                if (errCheck || !check || check.length === 0) {
                                    console.log(`❌ Item ID ${item.item_servico_id} não existe`);
                                    errosItens.push(`Item ID ${item.item_servico_id} não existe`);
                                    processados++;
                                    
                                    if (processados === itens.length) {
                                        finalizarAtualizacao();
                                    }
                                } else {
                                    db.query(
                                        `INSERT INTO item_orcamento 
                                        (orcamento_id, item_servico_id, quantidade, valor)
                                        VALUES (?, ?, ?, ?)`,
                                        [id, item.item_servico_id, Number(item.quantidade) || 1, Number(item.valor) || 0],
                                        (err3) => {
                                            if (err3) {
                                                console.log(`❌ Erro ao inserir item:`, err3.message);
                                                errosItens.push(`Erro ao adicionar item`);
                                            } else {
                                                console.log(`✓ Item adicionado`);
                                            }
                                            processados++;

                                            if (processados === itens.length) {
                                                finalizarAtualizacao();
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    } else if (item.nome) {
                        db.query(
                            `SELECT id FROM item_servico WHERE nome LIKE ? LIMIT 1`,
                            [`%${item.nome}%`],
                            (err3, servicos) => {
                                if (err3 || !servicos || servicos.length === 0) {
                                    console.log(`⚠ Item "${item.nome}" não encontrado`);
                                    errosItens.push(`Item "${item.nome}" não existe`);
                                    processados++;
                                    
                                    if (processados === itens.length) {
                                        finalizarAtualizacao();
                                    }
                                } else {
                                    const itemId = servicos[0].id;
                                    
                                    if (!itemId || itemId <= 0) {
                                        console.log(`⚠ ID inválido para "${item.nome}"`);
                                        errosItens.push(`ID inválido para ${item.nome}`);
                                        processados++;
                                        
                                        if (processados === itens.length) {
                                            finalizarAtualizacao();
                                        }
                                        return;
                                    }
                                    
                                    db.query(
                                        `INSERT INTO item_orcamento 
                                        (orcamento_id, item_servico_id, quantidade, valor)
                                        VALUES (?, ?, ?, ?)`,
                                        [id, itemId, Number(item.quantidade) || 1, Number(item.valor) || 0],
                                        (err4) => {
                                            if (err4) {
                                                console.log(`❌ Erro ao inserir:`, err4.message);
                                                errosItens.push(`Erro ao adicionar ${item.nome}`);
                                            } else {
                                                console.log(`✓ Item adicionado`);
                                            }
                                            processados++;

                                            if (processados === itens.length) {
                                                finalizarAtualizacao();
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    } else {
                        console.log("⚠ Item sem identificação");
                        errosItens.push("Item sem ID ou nome");
                        processados++;

                        if (processados === itens.length) {
                            finalizarAtualizacao();
                        }
                    }
                });

                function finalizarAtualizacao() {
                    if (errosItens.length === 0) {
                        console.log("=== ✅ ORÇAMENTO ATUALIZADO ===");
                        res.json({ 
                            mensagem: "Orçamento atualizado com sucesso",
                            id: id,
                            total: total
                        });
                    } else {
                        console.log("=== ⚠ ORÇAMENTO ATUALIZADO COM ERROS ===");
                        res.status(206).json({
                            mensagem: "Orçamento atualizado, mas com erros",
                            id: id,
                            total: total,
                            erros: errosItens
                        });
                    }
                }
            });
        }
    );
});

// LISTAR ORÇAMENTOS
app.get("/orcamentos", (req, res) => {

    const { admin_id } = req.query;

    let sql = `
        SELECT 
            o.*,
            e.tipo,
            e.data,
            c.nome AS cliente
        FROM orcamento o
        JOIN evento e ON e.id = o.evento_id
        JOIN cliente c ON c.id = e.cliente_id
        WHERE 1=1
    `;

    const params = [];

    if (admin_id) {
        sql += " AND o.admin_id = ?";
        params.push(admin_id);
    }

    sql += " ORDER BY o.id DESC";

    db.query(sql, params, (err, result) => {

        if (err) {
            console.log("❌ Erro ao buscar orçamentos:", err);
            return res.status(500).json({ erro: "Erro ao buscar orçamentos" });
        }

        res.json(result);
    });
});

// LISTAR ITENS DE UM ORÇAMENTO (COM DADOS COMPLETOS)
app.get("/orcamentos/:id", (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT 
            io.id,
            io.orcamento_id,
            io.item_servico_id,
            io.quantidade,
            io.valor,
            (io.quantidade * io.valor) AS subtotal,
            i.nome,
            i.categoria
        FROM item_orcamento io
        JOIN item_servico i ON i.id = io.item_servico_id
        WHERE io.orcamento_id = ?
        ORDER BY io.id ASC
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            console.log("❌ Erro ao buscar itens do orçamento:", err);
            return res.status(500).json({ erro: "Erro ao buscar itens" });
        }

        res.json(result);
    });
});

// ===============================
// CLIENTE VISUALIZAR ORÇAMENTO (ENDPOINT OTIMIZADO)
// ===============================

// ✅ NOVO ENDPOINT: Buscar orçamento + itens + cliente em uma única chamada
app.get("/cliente/orcamento-completo/:clienteId", (req, res) => {
    const clienteId = req.params.clienteId;
    
    console.log("=== BUSCANDO ORÇAMENTO COMPLETO PARA CLIENTE:", clienteId);
    
    // Query que retorna TUDO em uma única resposta
    const sql = `
        SELECT 
            o.id AS orcamento_id,
            o.status,
            o.valor_total,
            o.status_pagamento,
            o.created_at,
            e.tipo AS evento_tipo,
            e.data AS evento_data,
            e.local AS evento_local,
            e.convidados,
            c.nome AS cliente_nome,
            c.email AS cliente_email,
            c.telefone AS cliente_telefone,
            io.id AS item_id,
            io.item_servico_id,
            io.quantidade,
            io.valor AS valor_unitario,
            (io.quantidade * io.valor) AS subtotal,
            i.nome AS item_nome,
            i.categoria
        FROM orcamento o
        JOIN evento e ON e.id = o.evento_id
        JOIN cliente c ON c.id = e.cliente_id
        LEFT JOIN item_orcamento io ON io.orcamento_id = o.id
        LEFT JOIN item_servico i ON i.id = io.item_servico_id
        WHERE c.id = ?
        ORDER BY o.id DESC, io.id ASC
        LIMIT 100
    `;
    
    db.query(sql, [clienteId], (err, result) => {
        if (err) {
            console.log("❌ Erro ao buscar orçamento completo:", err);
            return res.status(500).json({ erro: "Erro ao buscar orçamento" });
        }
        
        if (!result || result.length === 0) {
            console.log("⚠ Nenhum orçamento encontrado para cliente:", clienteId);
            return res.json({ existe: false });
        }
        
        // Agrupar dados - o primeiro resultado contém os dados do orçamento
        const primeiroResultado = result[0];
        
        const orcamento = {
            id: primeiroResultado.orcamento_id,
            status: primeiroResultado.status,
            valor_total: primeiroResultado.valor_total,
            status_pagamento: primeiroResultado.status_pagamento,
            created_at: primeiroResultado.created_at,
            evento: {
                tipo: primeiroResultado.evento_tipo,
                data: primeiroResultado.evento_data,
                local: primeiroResultado.evento_local,
                convidados: primeiroResultado.convidados
            },
            cliente: {
                nome: primeiroResultado.cliente_nome,
                email: primeiroResultado.cliente_email,
                telefone: primeiroResultado.cliente_telefone
            },
            itens: result
                .filter(row => row.item_id !== null) // Filtrar itens nulos
                .map(row => ({
                    id: row.item_id,
                    nome: row.item_nome,
                    categoria: row.categoria,
                    quantidade: row.quantidade,
                    valor_unitario: row.valor_unitario,
                    subtotal: row.subtotal,
                    item_servico_id: row.item_servico_id
                }))
        };
        
        console.log("✓ Orçamento completo retornado com", orcamento.itens.length, "itens");
        res.json(orcamento);
    });
});

// Buscar orçamento do cliente logado (mais recente) - LEGADO
app.get("/cliente/orcamento/:clienteId", (req, res) => {
    const clienteId = req.params.clienteId;
    
    const sql = `
        SELECT 
            o.id,
            o.status,
            o.valor_total,
            o.status_pagamento,
            o.created_at,
            e.tipo AS evento_tipo,
            e.data AS evento_data,
            e.local AS evento_local,
            e.convidados,
            c.nome AS cliente_nome
        FROM orcamento o
        JOIN evento e ON e.id = o.evento_id
        JOIN cliente c ON c.id = e.cliente_id
        WHERE c.id = ?
        ORDER BY o.id DESC
        LIMIT 1
    `;
    
    db.query(sql, [clienteId], (err, result) => {
        if (err) {
            console.log("❌ Erro ao buscar orçamento:", err);
            return res.status(500).json({ erro: "Erro ao buscar orçamento" });
        }
        
        if (result.length === 0) {
            return res.json({ existe: false });
        }
        
        res.json(result[0]);
    });
});

// Buscar itens do orçamento do cliente
app.get("/cliente/orcamento/:orcamentoId/itens", (req, res) => {
    const orcamentoId = req.params.orcamentoId;
    
    const sql = `
        SELECT 
            io.id,
            io.orcamento_id,
            io.item_servico_id,
            io.quantidade,
            io.valor,
            (io.quantidade * io.valor) AS subtotal,
            i.nome,
            i.categoria
        FROM item_orcamento io
        JOIN item_servico i ON i.id = io.item_servico_id
        WHERE io.orcamento_id = ?
        ORDER BY io.id ASC
    `;
    
    db.query(sql, [orcamentoId], (err, result) => {
        if (err) {
            console.log("❌ Erro ao buscar itens:", err);
            return res.status(500).json({ erro: "Erro ao buscar itens" });
        }
        res.json(result);
    });
});

// ===============================
// DEBUG - VERIFICAR ORÇAMENTO
// ===============================

app.get("/debug/orcamento/:id", (req, res) => {
    const { id } = req.params;
    
    // Verificar orçamento
    db.query("SELECT * FROM orcamento WHERE id = ?", [id], (err, orcamento) => {
        if (err) return res.status(500).json({ erro: err });
        
        // Verificar itens
        db.query("SELECT * FROM item_orcamento WHERE orcamento_id = ?", [id], (err2, itens) => {
            if (err2) return res.status(500).json({ erro: err2 });
            
            res.json({
                orcamento: orcamento,
                itens: itens,
                totalItens: itens.length
            });
        });
    });
});

// ===============================
// START SERVER
// ===============================

app.listen(3000, () => {
    console.log("🚀 Servidor rodando em http://localhost:3000");
    console.log("📋 Banco de dados: buffet_db");
});