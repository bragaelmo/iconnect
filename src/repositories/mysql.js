const mysql = require("mysql");
const logger = require("../libs/logger");

exports.dbConnect = () => {
  const db = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      charset: "utf8mb4",
      debug: false,
      connectTimeout: 60000
  });

  db.connect((err) => {
      if (err) {
          logger.error('Erro ao conectar no banco de dados... ', err.message)
          return
      }
      logger.info('Banco de dados conectado!')
  });

  return db;
}
