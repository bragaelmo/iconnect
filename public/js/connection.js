var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user:  "root",
    password: "",
    database: "iconnect",
    port : '3306',
});

con.connect(function(err) {
    if (err) throw err;
    console.warn('Conectado')
    con.query("SELECT * FROM agentes", function (err, result, fields) {
        console.log(result)
    });
});

export {con};