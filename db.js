const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,           
  user: 'root',
  password: '',         
  database: 'buffet_db' 
});

connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar:', err);
  } else {
    console.log('Conectado ao MySQL');
  }
});

module.exports = connection;