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


//FIM ROTAS DO PAINEL DE AGENTE ============================================




//webhook
router.post("/webhook", (req,res) => {
    const userInfo = req.body; 

   //console.log(userInfo);

    //if it's client message 
    if(userInfo["contacts"]){
        //verifing if client exist for register
        let userExists = connection.query(
            `SELECT name FROM contacts WHERE wa_id = ?`
        , userInfo.messages[0].from
        , function(err,results,fields){
            if(err) throw err;
            console.log('xd');
                
            //if not, register
            if(Object.keys(results).length == 0){
                connection.query(`INSERT INTO contacts(wa_id,name) VALUES('${userInfo.messages[0].from}','${userInfo.contacts[0].profile.name}')`);
            };
            return results;
        })
        
        //save message
        connection.query('INSERT INTO messages (from_wa_id, type, body) VALUES(?,?,?)', 
        [userInfo.messages[0].from,userInfo.messages[0].type, userInfo.messages[0].text.body]);

        //sent contact that sent message
        io.emit('receivedMessage', userInfo)

        res.status(200)
    }

    //if it's attendant message
    if(userInfo["statuses"]){
        
        console.log(userInfo["statuses"]);
        //save message
/*
        connection.query('INSERT INTO messages (from_wa_id, type, body,to_wa) VALUES(?,?,?,?)', 
        ['557481305345',userInfo.statuses[0].type, userInfo.statuses[0].type,userInfo.statuses[0].type]);
        
        console.log(userInfo.statuses[0].message);*/

        res.status(200);
    } 
})


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



module.exports = router;
