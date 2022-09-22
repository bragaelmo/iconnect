const mysql = require("mysql");

exports.dbConnect = () => {
  const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      charset: "utf8mb4",
      debug: false
  });

  db.connect((err) => {
      if (err) {
          console.log('Erro ao conectar no banco de dados... ', err.message)
          return
      }
      console.log('Conexao estabelecida!')
  });

  return db;
}
