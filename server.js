const express = require("express")
const mysql = require("mysql2")
const cors = require("cors")

const app = express()

// 🔥 MIDDLEWARES
app.use(cors())
app.use(express.json())

// 🔥 CONEXÃO COM MYSQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senac",
  database: "buffet_db",
  port: 3307
})

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err)
  } else {
    console.log("Conectado ao MySQL ✅")
  }
})

// 🔥 ROTA TESTE
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀")
})


// 🔥 ROTA DE ITENS COM FILTRO POR CATEGORIA
app.get("/itens", (req, res) => {

  const categoria = req.query.categoria

  let sql = "SELECT * FROM itens"
  let params = []

  if (categoria && categoria !== "todos") {
    sql += " WHERE categoria = ?"
    params.push(categoria)
  }

  db.query(sql, params, (err, result) => {

    if (err) {
      console.error(err)
      return res.status(500).json({ erro: "Erro ao buscar itens" })
    }

    res.json(result)
  })
})


// 🔥 INICIAR SERVIDOR
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000 🚀")
})