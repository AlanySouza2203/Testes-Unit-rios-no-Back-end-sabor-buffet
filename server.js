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



// 🔹 TESTE
app.get("/", (req, res) => {
  res.send("Servidor funcionando ");
});

// ===============================
//  ITENS
// ===============================

app.get("/itens", (req, res) => {
  const categoria = req.query.categoria;

  let sql = "SELECT * FROM item_servico";
  let params = [];

  if (categoria && categoria !== "todos") {
    sql += " WHERE categoria = ?";
    params.push(categoria);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar itens" });
    res.json(result);
  });
});

app.post("/itens", (req, res) => {
  const { nome, categoria, valor, imagem } = req.body;

  if (!nome || !categoria || !valor) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  const sql = `
    INSERT INTO item_servico (nome, categoria, valor, imagem)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [nome, categoria, valor, imagem], (err, result) => {
    if (err) return res.status(500).json({ erro: "Erro ao cadastrar item" });

    res.json({
      mensagem: "Item cadastrado com sucesso",
      id: result.insertId
    });
  });
});

app.put("/itens/:id", (req, res) => {
  const { nome, categoria, valor } = req.body;

  db.query(
    "UPDATE item_servico SET nome=?, categoria=?, valor=? WHERE id=?",
    [nome, categoria, valor, req.params.id],
    err => {
      if (err) return res.status(500).json({ erro: "Erro ao atualizar item" });
      res.json({ mensagem: "Item atualizado" });
    }
  );
});

app.delete("/itens/:id", (req, res) => {
  db.query("DELETE FROM item_servico WHERE id=?", [req.params.id], err => {
    if (err) return res.status(500).json({ erro: "Erro ao deletar item" });
    res.json({ mensagem: "Item removido" });
  });
});


// ===============================
//  CLIENTES
// ===============================

app.post("/clientes", (req, res) => {
  const { nome, telefone, email } = req.body;

  if (!nome || !telefone || !email) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  db.query(
    "INSERT INTO cliente (nome, telefone, email) VALUES (?, ?, ?)",
    [nome, telefone, email],
    (err, result) => {
      if (err) return res.status(500).json({ erro: "Erro ao cadastrar cliente" });

      res.json({ id: result.insertId });
    }
  );
});

app.get("/clientes", (req, res) => {
  db.query("SELECT * FROM cliente", (err, result) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar clientes" });
    res.json(result);
  });
});
app.delete("/clientes/:id", (req, res) => {

  const { id } = req.params;

  // 1. verificar eventos
  db.query("SELECT id FROM evento WHERE cliente_id = ?", [id], (err, eventos) => {

    if (err) return res.status(500).json({ erro: "Erro interno" });

    if (eventos.length > 0) {
      return res.status(400).json({
        erro: "Cliente possui eventos e não pode ser removido"
      });
    }

    // 2. deletar cliente
    db.query("DELETE FROM cliente WHERE id = ?", [id], (err2) => {

      if (err2) {
        console.log(err2);
        return res.status(500).json({ erro: "Erro ao deletar cliente" });
      }

      res.json({ sucesso: true });
    });

  });

});

// ===============================
//  EVENTOS (VERSÃO FINAL)
// ===============================

//  CRIAR EVENTO
function criarEventos(req, res) {
  const { cliente_id, tipo, data, convidados, local } = req.body;

  if (!cliente_id || !tipo || !data || !local) {
    return res.status(400).json({ erro: "Campos obrigatórios" });
  }

  db.query(
    "SELECT id FROM cliente WHERE id = ?",
    [cliente_id],
    (err, cliente) => {

      if (err) {
        console.log("Erro ao verificar cliente:", err);
        return res.status(500).json({ erro: "Erro ao verificar cliente" });
      }

      if (cliente.length === 0) {
        return res.status(400).json({ erro: "Cliente não existe" });
      }

      db.query(
        `INSERT INTO evento (cliente_id, tipo, data, convidados, local)
         VALUES (?, ?, ?, ?, ?)`,
        [cliente_id, tipo, data, convidados || 0, local],
        (err, result) => {

          if (err) {
            console.log("Erro ao criar evento:", err);
            return res.status(500).json({ erro: "Erro ao criar evento" });
          }

          res.json({
            mensagem: "Evento criado com sucesso",
            id: result.insertId
          });
        }
      );
    }
  );
}


//  LISTAR EVENTOS
function listarEventos(req, res) {

  const { admin_id } = req.query;

  let sql = `
    SELECT e.*, c.nome AS cliente
    FROM evento e
    JOIN cliente c ON e.cliente_id = c.id
    WHERE 1=1
  `;

  let params = [];

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

    res.json(result);

  });
}

//  REMOVER EVENTO (100% FUNCIONAL)
app.delete("/eventos/:id", (req, res) => {
  const { id } = req.params;

  console.log("🗑️ Deletando evento ID:", id);

  //  1. DELETA PEDIDOS RELACIONADOS
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

      //  2. AGORA DELETA O EVENTO
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

          console.log("Evento removido:", id);

          res.json({
            mensagem: "Evento removido com sucesso"
          });
        }
      );

    }
  );
});


//  ROTAS
app.post("/eventos", criarEventos);
app.get("/eventos", listarEventos);

// ===============================
//  ORÇAMENTOS
// ===============================


// LISTAR ORÇAMENTOS
app.get("/orcamentos", (req, res) => {

  const { admin_id } = req.query;

  let sql = `
    SELECT 
      o.*,
      e.tipo,
      c.nome AS cliente
    FROM orcamento o
    JOIN evento e ON e.id = o.evento_id
    JOIN cliente c ON c.id = e.cliente_id
    WHERE o.status_pagamento = 'pago'
  `;

  const valores = [];

  if (admin_id) {
    sql += ` AND e.admin_id = ? `;
    valores.push(admin_id);
  }

  sql += ` ORDER BY o.id DESC `;

  db.query(sql, valores, (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ erro: "Erro ao buscar orçamentos" });
    }

    res.json(result);

  });

});
// CRIAR ORÇAMENTO
app.post("/orcamentos", (req, res) => {

  const { evento_id, total, status, itens } = req.body;

  // validações
  if (!evento_id || !itens || itens.length === 0) {
    return res.status(400).json({
      erro: "Dados inválidos"
    });
  }

  // verificar se evento já possui orçamento
  db.query(
    "SELECT id FROM orcamento WHERE evento_id = ?",
    [evento_id],
    (err, existe) => {

      if (err) {
        console.log(err);
        return res.status(500).json({
          erro: "Erro ao verificar orçamento"
        });
      }

      if (existe.length > 0) {
        return res.status(400).json({
          erro: "Evento já possui orçamento"
        });
      }

      // criar orçamento
      const sql = `
        INSERT INTO orcamento (evento_id, valor_total, status)
        VALUES (?, ?, ?)
      `;

      db.query(
        sql,
        [evento_id, total, status],
        (err2, result) => {

          if (err2) {
            console.log(err2);
            return res.status(500).json({
              erro: "Erro ao criar orçamento"
            });
          }

          const orcamentoId = result.insertId;

          // salvar itens
          const promises = itens.map(item => {

            return new Promise((resolve, reject) => {

              db.query(
                `
                INSERT INTO item_orcamento
                (orcamento_id, item_servico_id, quantidade, valor)
                VALUES (?, ?, ?, ?)
                `,
                [
                  orcamentoId,
                  item.item_servico_id,
                  item.quantidade,
                  item.valor
                ],
                (err3) => {

                  if (err3) {
                    reject(err3);
                  } else {
                    resolve();
                  }
                }
              );

            });

          });

          Promise.all(promises)
            .then(() => {

              res.json({
                mensagem: "Orçamento criado com sucesso",
                id: orcamentoId
              });

            })
            .catch(err4 => {

              console.log(err4);

              res.status(500).json({
                erro: "Erro ao salvar itens"
              });

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
    SELECT u.*, c.id AS clienteId
    FROM usuario u
    LEFT JOIN cliente c ON c.usuario_id = u.id
    WHERE u.email = ?
  `;

  db.query(sql, [email], (err, result) => {

    if (err) {
      console.log("Erro no login:", err);
      return res.json({ success: false });
    }

    if (result.length === 0) {
      return res.json({ success: false });
    }

    const usuario = result[0];

    if (usuario.senha !== senha) {
      return res.json({ success: false });
    }

    //  resposta FINAL correta
    res.json({
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo
      },
      clienteId: usuario.clienteId // pode ser null se não existir
    });
  });
});
// ===============================
//  CADASTRO DE USUÁRIO
// ===============================

app.post("/usuarios", (req, res) => {
  const { nome, telefone, email, senha } = req.body;

  if (!nome || !telefone || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  // CRIAR USUÁRIO
  const sqlUsuario = `
    INSERT INTO usuario (nome, email, senha, tipo)
    VALUES (?, ?, ?, 'cliente')
  `;

  db.query(sqlUsuario, [nome, email, senha], (err, resultUsuario) => {

    if (err) {
      console.log("Erro usuário:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ erro: "E-mail já cadastrado" });
      }

      return res.status(500).json({ erro: "Erro ao criar usuário" });
    }

    const usuarioId = resultUsuario.insertId;

    // CRIAR CLIENTE
    const sqlCliente = `
      INSERT INTO cliente (nome, telefone, email, usuario_id)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      sqlCliente,
      [nome, telefone, email, usuarioId],
      (err2, resultCliente) => {

        if (err2) {
          console.log("Erro cliente:", err2);

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
  });
});

// ===============================
//  PEDIDOS (CORRIGIDO)
// ===============================

//  CRIAR PEDIDO
app.post("/pedidos", (req, res) => {
  const { cliente, itens, total, status, evento_id, admin_id } = req.body;

  //  validação básica
  if (!cliente || !itens || !total || !admin_id) {
    return res.status(400).json({ erro: "Dados incompletos" });
  }

  const sql = `
    INSERT INTO pedidos (cliente, itens, total, status, evento_id, admin_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      cliente,
      JSON.stringify(itens),
      total,
      status || "pendente",
      evento_id || null,
      admin_id
    ],
    (err, result) => {
      if (err) {
        console.log("Erro ao criar pedido:", err);
        return res.status(500).json({ erro: "Erro ao criar pedido" });
      }

      res.json({
        mensagem: "Pedido criado com sucesso",
        id: result.insertId
      });
    }
  );
});


app.get("/pedidos", (req, res) => {
  const { evento_id } = req.query;

  let sql = "SELECT * FROM pedidos WHERE 1=1";
  let params = [];

  if (evento_id) {
    sql += " AND evento_id = ?";
    params.push(evento_id);
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ erro: "Erro ao buscar pedidos" });
    }

    res.json(result);
  });
});


//  ATUALIZAR STATUS
app.put("/pedidos/:id/status", (req, res) => {
  const { status } = req.body;

  db.query(
    "UPDATE pedidos SET status=? WHERE id=?",
    [status, req.params.id],
    (err) => {
      if (err) {
        console.log("Erro ao atualizar status:", err);
        return res.status(500).json({ erro: "Erro ao atualizar status" });
      }

      res.json({ mensagem: "Status atualizado" });
    }
  );
});


//  REMOVER PEDIDO
app.delete("/pedidos/:id", (req, res) => {
  db.query("DELETE FROM pedidos WHERE id=?", [req.params.id], (err) => {
    if (err) {
      console.log("Erro ao deletar pedido:", err);
      return res.status(500).json({ erro: "Erro ao deletar pedido" });
    }

    res.json({ mensagem: "Pedido removido" });
  });
});





// ===============================
//  START SERVER
// ===============================

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});