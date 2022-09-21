const mysql = require("mysql");

exports.dbConnect = () => {
  const db = mysql.createConnection({
      host: "pag.rexinternet.com.br",
      user: "rex",
      password: "MmM@@885522",
      database: "iconect_atendimento",
      charset: "utf8mb4",
      debug: false
  });

  db.connect((err) => {
      if (err) {
          console.log('Erro connecting to database... ', err.message)
          return
      }
      console.log('Connection established!')
  });

  return db;
}
