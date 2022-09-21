const { dbConnect } = require("./repositories/mysql");
const db = dbConnect();

const { login, userPermission } = require("./services/authentication");
const router = require('express').Router(); //express
const socketIO = require('../socket');             //socket
const { saveContact, saveMessage, lastMessage, messageOfClient, clientData, sendMessageToClient } = require('./services/zenvia');


socketIO.on('db', (socket) => {
    console.log('socket conectado:', socket.id);
})

// AJUSTAR LOGIN
router.get('/', (req,res) => {
    console.log( 'LOGIN ??? / ' + req.session.login)
    if (req.session.login){
        res.redirect('/painel-agente');
    }
    res.render('login', {
        message: req.session.loginErr,
        email: req.session.email
    });
    req.session.destroy();
});


router.get('/logout', (req, res) => {
    if(req.session.login){
        req.session.destroy();
    }
    res.redirect('/')
});


//ROTAS DE LOGIN E PERMISSÃO ============================================

function errorLogin(req, res){
    console.log("Usuário não identificado!")
    res.redirect('/');
}
//método post do login
router.post('/login', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    req.session.email = email

    if (!email || !password){
        req.session.loginErr = true;
        res.redirect('/');
        return
    }

    const session = await login(db, email, password)
    req.session.loginErr = session.loginErr;

    if (req.session && req.session.loginErr == false){
        req.session.name = session.name;
        req.session.login = session.login;
        res.redirect('/userPermission');
        return
    }
    res.redirect('/');
});

//pega as informações do atendente conectado
router.get("/userPermission", async (req, res) => {
    if(!req.session.login){
        res.redirect('/');
        return
    }
    var userEmail = req.session.login;
    //var userName = req.session.name;

    const {panel, permission} = await userPermission(db, userEmail)

    if(panel){
        req.session.permission = permission
        res.redirect(panel)
        return
    }
    res.redirect('/');
})

//FIM ROTAS DE LOGIN E PERMISSÃO ========================================


// ROTAS DO PAINEL DE AGENTE ============================================
router.get('/painel-agente', (req,res) => {
    // ------------- VER ESSA PARTE

    if(!req.session.login){
        res.redirect('/');
        return
    }

    var sidebarHome = "active";
    var container = false;
    res.render('./paineis/painel-agente/chat',
    {
        title:'Agente Home - iConect',
        container:container,
        sidebarHome: sidebarHome
    });

});


//FIM ROTAS DO PAINEL DE AGENTE ============================================




//webhook
router.post("/webhook", async (req,res) => {
    const hook = req.body;
    try {
        //if it's client message
        if(hook.message){
            const from = hook.message.from
            await saveContact(db, from, hook.message.visitor.name)
            await saveMessage(db, from, hook.message)

            socketIO.emit('receivedMessage', hook)

            res.status(200).send({message: "enviado"});
        }

        // Testar melhor
        if(hook.statuses){
            console.log(hook.statuses);

            await saveMessage(db, '557481305345', hook.message)

            console.log(hook.statuses[0].message);

            res.status(200).send({message: "enviado"});
        }

    } catch (err) {
        return res.status(400).send({ message: "erro json invalido", error: err.message })
    }
});


router.get("/wpp/last-message-client", async (req, res) => {
    //render messages of db in messages visualizer
    try{
        const response = await lastMessage(db)
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.post("/wpp/message-chat-client", async (req,res) => {
    const {wa_id} = req.body;
    try{
        const response = await messageOfClient(db, wa_id)
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
});

router.post('/wpp/client-data', async (req,res) => {
    const {clientNumber} = req.body;
    try{
        const response = await clientData(db, clientNumber)
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.post('/wpp/send-message', async (req,res) => {
    const {clientNumber,  message} = req.body;

    try {
        await sendMessageToClient(db, clientNumber, message)
        res.status(200).json({ok: 'ok'});
    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

module.exports = router;