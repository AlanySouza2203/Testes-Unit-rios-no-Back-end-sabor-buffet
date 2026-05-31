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

    const { nome, categoria, valor, imagem } = req.body;

    if (!nome || !categoria || !valor) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    const sql = `
        INSERT INTO item_servico
        (nome, categoria, valor, imagem)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [nome, categoria, valor, imagem || null],
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

    const { nome, categoria, valor, imagem } = req.body;
    const { id } = req.params;

    if (!nome || !categoria || !valor) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    db.query(
        `
        UPDATE item_servico
        SET nome = ?, categoria = ?, valor = ?, imagem = ?
        WHERE id = ?
        `,
        [nome, categoria, valor, imagem || null, id],
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

// CRIAR CLIENTE
app.post("/clientes", (req, res) => {

    const { nome, telefone, email } = req.body;

    if (!nome || !telefone || !email) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    db.query(
        `
        INSERT INTO cliente
        (nome, telefone, email)
        VALUES (?, ?, ?)
        `,
        [nome, telefone, email],
        (err, result) => {

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

            res.json({
                mensagem: "Cliente cadastrado com sucesso",
                id: result.insertId
            });
        }
    );
});

// LISTAR CLIENTES
app.get("/clientes", (req, res) => {

    db.query(
        "SELECT * FROM cliente ORDER BY id DESC",
        (err, result) => {

            if (err) {
                console.log("Erro ao buscar clientes:", err);

                return res.status(500).json({
                    erro: "Erro ao buscar clientes"
                });
            }

            res.json(result);
        }
    );
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

    const { admin_id, cliente_id } = req.query;

    let sql = `
        SELECT
            e.*,
            c.nome AS cliente
        FROM evento e
        JOIN cliente c ON c.id = e.cliente_id
        WHERE 1 = 1
    `;

    const params = [];

    // FILTRAR POR ADMIN
    if (admin_id) {
        sql += " AND e.admin_id = ?";
        params.push(admin_id);
    }

    // FILTRAR POR CLIENTE LOGADO
    if (cliente_id) {
        sql += " AND e.cliente_id = ?";
        params.push(cliente_id);
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
                (nome, telefone, email, usuario_id)
                VALUES (?, ?, ?, ?)
                `,
                [nome, telefone, email, usuarioId],
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
        cliente,
        itens,
        total,
        status,
        evento_id,
        admin_id
    } = req.body;

    if (!cliente || !itens || !total || !admin_id) {
        return res.status(400).json({
            erro: "Dados incompletos"
        });
    }

    db.query(
  `
  INSERT INTO orcamento
  (evento_id, admin_id, valor_total, status, status_pagamento)
  VALUES (?, ?, ?, ?, ?)
  `,
  [
    evento_id,
    admin_id,
    total,
    "pendente",
    "pendente"
  ],
  (err2, resultOrcamento) => {

      if (err2) {
          console.log(err2);
      }

      res.json({
    mensagem: "Pedido criado com sucesso",
    id: resultOrcamento.insertId
});

  }
);
});

// LISTAR PEDIDOS
app.get("/pedidos", (req, res) => {

    const { evento_id, cliente_id } = req.query;

    let sql = "SELECT * FROM pedidos WHERE 1=1";
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
            e.data_evento,
            e.local_evento,
            e.qtd_convidados
        FROM pedidos p
        INNER JOIN eventos e ON p.evento_id = e.id
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

// ATUALIZAR STATUS PEDIDO
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

            res.json({
                mensagem: "Status atualizado com sucesso"
            });
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
// Orcamentos
// ===============================

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
        sql += " AND e.admin_id = ?";
        params.push(admin_id);
    }

    sql += " ORDER BY o.id DESC";

    db.query(sql, params, (err, result) => {

        if (err) {
            console.log(err);
            return res.status(500).json({ erro: "Erro ao buscar orçamentos" });
        }

        res.json(result);
    });
});
app.get("/orcamentos/:id", (req, res) => {

    const { id } = req.params;

    const sql = `
        SELECT 
            io.*,
            i.nome
        FROM item_orcamento io
        JOIN item_servico i ON i.id = io.item_servico_id
        WHERE io.orcamento_id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {
            return res.status(500).json({ erro: "Erro ao buscar itens" });
        }

        res.json(result);
    });
});
app.post("/orcamentos", (req, res) => {

    const { evento_id, admin_id, itens, status, status_pagamento } = req.body;

    if (!evento_id || !admin_id || !itens?.length) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    const total = itens.reduce((acc, i) => acc + (i.valor * i.quantidade), 0);

    db.query(
        `INSERT INTO orcamento (evento_id, admin_id, valor_total, status, status_pagamento)
         VALUES (?, ?, ?, ?, ?)`,
        [evento_id, admin_id, total, status || "pendente", status_pagamento || "pendente"],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ erro: "Erro ao criar orçamento" });
            }

            const orcamentoId = result.insertId;

            const values = itens.map(i => [
                orcamentoId,
                i.item_servico_id,
                i.quantidade,
                i.valor
            ]);

            db.query(
                `INSERT INTO item_orcamento 
                (orcamento_id, item_servico_id, quantidade, valor)
                VALUES ?`,
                [values],
                (err2) => {

                    if (err2) {
                        return res.status(500).json({ erro: "Erro ao salvar itens" });
                    }

                    res.json({
                        mensagem: "Orçamento criado com sucesso",
                        id: orcamentoId
                    });
                }
            );
        }
    );
});
app.put("/orcamentos/:id", (req, res) => {

    const { id } = req.params;
    const { evento_id, itens, status } = req.body;

    const total = itens.reduce((acc, i) => acc + (i.valor * i.quantidade), 0);

    db.query(
        `UPDATE orcamento 
         SET evento_id=?, valor_total=?, status=?
         WHERE id=?`,
        [evento_id, total, status, id],
        (err) => {

            if (err) {
                return res.status(500).json({ erro: "Erro ao atualizar orçamento" });
            }

            db.query(`DELETE FROM item_orcamento WHERE orcamento_id=?`, [id], () => {

                const values = itens.map(i => [
                    id,
                    i.item_servico_id,
                    i.quantidade,
                    i.valor
                ]);

                db.query(
                    `INSERT INTO item_orcamento 
                    (orcamento_id, item_servico_id, quantidade, valor)
                    VALUES ?`,
                    [values],
                    () => {
                        res.json({ mensagem: "Orçamento atualizado" });
                    }
                );
            });
        }
    );
});
app.delete("/orcamentos/:id", (req, res) => {

    const { id } = req.params;

    db.query("DELETE FROM orcamento WHERE id=?", [id], (err) => {

        if (err) {
            return res.status(500).json({ erro: "Erro ao deletar" });
        }

        res.json({ mensagem: "Orçamento removido" });
    });
});

// ===============================
// START SERVER
// ===============================

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});
