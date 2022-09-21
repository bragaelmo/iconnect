//VERIFICAR COMO INTRODUZIR ESSE CODIGO NO ARQUIVO db.js OU ADAPTAR AS LINHAS QUE USAM O 
//A FUNCTION CONECTIONDB()
//require do mysql
const mysql2 = require("mysql"); 
const { resolveSoa } = require('dns');

//conexão com banco mysql
function conectiondb(){
    var con = mysql2.createConnection({
        host: "pag.rexinternet.com.br",
        user: "rex",
        password: "MmM@@885522",
        database: "iconect_atendimento",
        charset: "utf8mb4",
        debug: false
    });

    //verifica conexao com o banco
    con.connect((err) => {
        if (err) {
            console.log('Erro connecting to database...', err)
            return
        }
        console.log('Connection established!')
    });

    return con;
}
// FIM CONEXÃO DB2

const router = require('express').Router(); //express
const connection = require('./db');         //db
const io = require('./socket');             //socket
const { route } = require("./zenvia-routes");


//conexão com banco de dados
const con = conectiondb();

io.on('connection', (socket) => {
    console.log('socket conectado:', socket.id);
})

router.get('/', (req,res) => {
    var message = false;
    var email = "";
    if(req.session.login){
        res.redirect('/painel-agente');
    }else{
        email = req.session.email;
        message = req.session.loginErro;
        res.render('login', {message:message, email:email});
        req.session.destroy();
    }
    
});


router.get('/logout', (req, res) => {
    if(req.session.login){
        req.session.destroy((err) => {
            res.redirect('/') // will always fire after session is destroyed
            
        });
    }else{
        res.redirect('/')
    }
});


//ROTAS DE LOGIN E PERMISSÃO ============================================

//método post do login
router.post('/login', function (req, res){
    //pega os valores digitados pelo usuário
    var email = req.body.email;
    var password = req.body.password;
    
    //query de execução
    var query = 'SELECT * FROM users WHERE password = ? AND email LIKE ?';
    
    //execução da query
    con.query(query, [password, email], function (err, results){
        if (results.length > 0){
            req.session.login = email; //seção de identificação            
            console.log("Login feito com sucesso!");
            res.redirect('/userPermission');
            console.log("Usuário "+req.session.login+" identificado!")
        }else{
            console.log("Usuário não identificado!")
            req.session.loginErro = true;  
            req.session.email = email;        
            res.redirect('/');
        }
    });
});

//pega as informações do atendente conectado
router.get("/userPermission", (req, res) => {
    if(req.session.login){
        var userEmail = req.session.login;
        //var userEmail = 'kevin@gmail.com';
        var sql = 'SELECT * FROM users WHERE email = ? ';
        con.query(sql, [userEmail], function (err, result) {
            if (err) throw err;
            req.session.permission = result[0].permission;

            //PERMISSÃO 0 = AGENTE
            if(req.session.permission == 0){
                res.redirect('/painel-agente');
            }

            //PERMISSÃO 1 = SUPERVISOR
            if(req.session.permission == 1){
                res.redirect('/painel-supervisor');
            }
        });
    }else{
        res.redirect('/');
    }
})

//FIM ROTAS DE LOGIN E PERMISSÃO ========================================


// ROTAS DO PAINEL DE AGENTE ============================================
router.get('/painel-agente', (req,res) => {
    // ------------- VER ESSA PARTE

    if(req.session.login){
        var sidebarHome = "active";
        var container = false;
        res.render('./paineis/painel-agente/chat', 
        {
            title:'Agente Home - iConect', 
            container:container, 
            sidebarHome: sidebarHome
        });
    }else{
        res.redirect('/');
    }
});

router.get('/painel-agente/config', (req,res) => {
    res.render('./paineis/painel-agente/config')
});

//cadastro de agente
router.get('/cadastro', (req,res) =>{
    res.render('./paineis/painel-agente/cadastro')
});

//FIM ROTAS DO PAINEL DE AGENTE ============================================




//webhook
router.post("/webhook", (req,res) => {
    const userInfo = req.body; 
    try {
        //obtive msm numero
        console.log(userInfo.message.from);

        //if it's client message 
            if(userInfo["message"]){
                //console.log(userInfo.message.from);
                //console.log(userInfo.message.visitor.name);
                //verifing if client exist for register
                let userExists = connection.query(
                    `SELECT name FROM contacts WHERE wa_id = ?`
                , userInfo.message.from
                , function(err,results,fields){
                    if(err) {throw err};
                    console.log('xd');
                        
                    //if not, register
                    if(Object.keys(results).length == 0){
                        connection.query(`INSERT INTO contacts(wa_id,name) VALUES('${userInfo.message.from}','${userInfo.message.visitor.name}')`);
                        if (err) { throw err}; 
                        console.log('xd');
                    };
                    return results;
                })
                console.log(userInfo.message.contents[0].type);
          

                //save message
                connection.query('INSERT INTO messages (from_wa_id, type, body) VALUES(?,?,?)', 
                [userInfo.message.from,userInfo.message.contents[0].type, userInfo.message.contents[0].text]);

                //sent contact that sent message
                io.emit('receivedMessage', userInfo)

                res.status(200).send({message: "enviado"});
            }
                

            //if it's attendant message
            if(userInfo["statuses"]){
                
                console.log(userInfo["statuses"]);
                //save message
        
                connection.query('INSERT INTO messages (from_wa_id, type, body,to_wa) VALUES(?,?,?,?)', 
                ['557481305345',userInfo.statuses[0].type, userInfo.statuses[0].type,userInfo.statuses[0].type]);
                
                console.log(userInfo.statuses[0].message);

                res.status(200).send({message: "enviado"});
            } 
        }
         catch (err) {
            return res.status(400).send({ message: "erro json invalido", error: err })
        }
    });


router.get("/wpp/last-message-client", (req, res) => {
    //render messages of db in messages visualizer 
    connection.query(`
    SELECT contacts.name, contacts.status, messages.from_wa_id, messages.body, messages.type, messages.to_wa,messages.created_at FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.created_at IN ( SELECT MAX(messages.created_at) FROM messages GROUP BY messages.from_wa_id)
    `, function(err,result) {
        if(err) throw err;
        res.json(result);
        res.status(200);
    })

})

router.post("/wpp/message-chat-client", (req,res) => {
    const {wa_id} = req.body;

    connection.query(
        'SELECT created_at,from_wa_id,to_wa,body FROM `messages` WHERE messages.from_wa_id = ? OR (messages.from_wa_id = 557481305345 and messages.to_wa = ?)',
        [wa_id, wa_id], (err,result) => {
            if(err){
                res.status(400).json({erro: error});
                throw err;
            }
            res.json(result);
            res.status(200);
        })
    
});

router.post('/wpp/client-data', (req,res) => {
    const {clientNumber} = req.body;

    connection.query('SELECT * FROM contacts WHERE contacts.wa_id = ?',[clientNumber], function(err,result){
        if(err) throw err;

        res.json(result);
        res.status(200);
    })
})

router.post('/teste', (req,res) => {
    res.status(200).json({teste: 'teste'});
})

router.post('/wpp/send-message', (req,res) => {
        const {clientNumber,  message} = req.body;
        const { post } = require('request-promise');
        
        post({  
            uri: 'https://api.zenvia.com/v2/channels/whatsapp/messages',
                headers: {
                    'X-API-TOKEN': 'p26Q_f6tj6utbkwtHmhzF-4mtvO0QK75ZJDV'
                },
            body: {
                from: '557481305345',
                to: '5531986372628',
                contents: [{
                  type: 'text',
                  text: 'testemsg'
                }]
              },
            json: true
        }).then((response) => {
            console.log('Response:', response);
          })
          .catch((error) => {
            console.log('Error:', error);
          });

        
        //save msg
        connection.query('INSERT INTO messages (from_wa_id, to_wa, type, body) VALUES(?,?,?,?)',['557481305345', 'teste', 'text', 'teste']);
        
        res.status(200).json({ok: 'ok'});
    })

module.exports = router;
