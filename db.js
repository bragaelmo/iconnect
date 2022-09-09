var mysql = require("mysql");

var connection = mysql.createConnection({
    host: "pag.rexinternet.com.br",
    user: "rex",
    password: "MmM@@885522",
    database: "iconect_atendimento",
    charset: "utf8mb4"
});


module.exports = connection;