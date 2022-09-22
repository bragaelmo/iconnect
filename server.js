const fs = require("fs");
// Carrega o certificado e a key necessários para a configuração do server https.
const key = fs.readFileSync("./openssl/privkey.pem");
const cert = fs.readFileSync("./openssl/cert.pem");
const ca = fs.readFileSync("./openssl/chain.pem");

const dotenv = require("dotenv");
dotenv.config()

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

var hbs = require('hbs');
var helpers = require('./components/hbsHelpers');

const path = require('path');

const server = require('https').createServer({key: key,
                                              cert: cert,
                                              ca: ca
                                            },app);

//for socket
module.exports = server
/*const io = require('./socket')
io.on('end', function (){
  socket.disconnect(0);
});*/

//const io = require('socket.io')(server)

// io.on('connection',(socket)=>{
//   console.log('new connection', socket)
// })

app.use(session({
  name : 'login',
  secret : '@#!iConect123',
  resave :false,
  saveUninitialized: true,
  cookie : {
          maxAge:(1000 * 60 * 100)
  }
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


hbs.registerPartials(path.join(__dirname, 'views/partials'), (err) => {});
for (let helper in helpers) {
  hbs.registerHelper(helper, helpers[helper]);
}



//routes
const routes = require('./src/routes');
const zenviaRoutes = require('./zenvia-routes');
app.use([routes, zenviaRoutes]);

//bot
var banco = {
    user1:{
      stage:0
    },
    user2:{
      stage:0
    }

};

var stages = {
  0:{
    descricao:"Olá",
    obj: ""
  },
  1:{
    descricao:"Boleto",
    obj: ""
  },
  2:{
    descricao:"Planos",
    obj: ""
  },
};

function getStage(user){
  return banco[user].stage;
}

console.log(getStage("user1"))

//inicia o servidor
server.listen(process.env.PORT, function(){
  console.log('Servidor iniciado na porta ' + process.env.PORT);
});
