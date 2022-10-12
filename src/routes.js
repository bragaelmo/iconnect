const { dbConnect } = require("./repositories/mysql");
const db = dbConnect();

const { login, userPermission } = require("./services/authentication");
const router = require('express').Router(); //express
const socketIO = require('../socket');             //socket
const { saveContact, saveMessage, lastMessage, messageOfClient, clientData, sendMessageToClient, saveusers, updateStatusMessage, getMessage, updateAtendimento, listAtendentes, createAtendimento, transferAtendimento, lastMessageAll } = require('./services/zenvia');
const { route } = require("../zenvia-routes");
const { atendimento } = require("./services/atendimento");


socketIO.on('db', (socket) => {
    console.log('socket conectado:', socket.id);
})

// AJUSTAR LOGIN
router.get('/', (req,res) => {
    if (req.session.login){
        res.redirect('/painel-agente');
        return
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
function getSessionStrings(req){
    var name = req.session.name.split(' ')[0]
    return {
        sessionName: name,
        sessionFullName: req.session.name,
        sessionEmail: req.session.login,
        sessionHost: process.env.HOST + ':' + process.env.PORT
    }
}
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
        sidebarHome: sidebarHome,
        sidebars: 'aget',
        ...getSessionStrings(req)
    });

});
router.get('/painel-supervisor', (req,res) => {
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
//gerenciamento de novos agentes
router.get('/painel-supervisor/gerenciamento', (req,res) => {
    res.render('./paineis/painel-supervisor/gerenciamento')

});


//FIM ROTAS DO PAINEL DE AGENTE ============================================

//webhook
router.post("/webhook", async (req,res) => {
    const hook = req.body;
    console.log('ZENVIA :: ' + JSON.stringify(hook))
    try {
        //if it's client message
        if(hook.message){
            const fromClient = hook.message.from
            const atendimentoId = await atendimento(db, hook)

            socketIO.emit('receivedMessage', {fromClient, atendimentoId})
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

router.post("/wpp/last-message-client", async (req, res) => {
    const {email} = req.body
    try{
        const response = await lastMessageAll(db, 'EM_ESPERA', email)
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.post("/wpp/last-message-client-in-service", async (req, res) => {

    // Gerar token de email para dificultar o acesso a atendimentos nao permitidos
    const {email} = req.body

    try{
        const response = await lastMessage(db, 'EM_ATENDIMENTO', email)
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.get('/painel-agente/config', (req,res) => {
    var name = req.session.name.split(' ')[0]
    res.render('./paineis/painel-agente/config', {
        ...getSessionStrings(req)
    })
});

//cadastro de agente
router.get('/cadastro', (req,res) => {
    var name = req.session.name.split(' ')[0]
    res.render('./paineis/painel-agente/cadastro', {
        ...getSessionStrings(req)
    })
});
//cadastro
router.post('/cadastro-usuario', async (req,res) =>{
    try {
        await saveusers(db,req.body.email,req.body.senha,req.body.nome)
        res.send(" <script>alert('Cadastro feito com sucesso'); window.location.href = '/'; </script>");
    } catch (error){
        res.status(400).json({erro: error.message});
    }

});

router.post("/wpp/message-chat-client", async (req,res) => {
    const {atendimento_id} = req.body;

    try{
        const response = await messageOfClient(db, atendimento_id)
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
    // Adicionar token de atendimento para permitir o envio somente se o atendente assumir o atendimento
    const {clientNumber, message, chatAtendimentoId, roboNumber} = req.body;
    console.log(`Enviando mensagem [${message}] para o cliente [${clientNumber}] do robo [${roboNumber}] e atendimento [${chatAtendimentoId}]`)
    try {
        await sendMessageToClient(db, clientNumber, message, chatAtendimentoId, roboNumber)
        res.status(200).json({ok: 'ok'});
        console.log(`Mensagem [${message}] enviada com sucesso para o cliente [${clientNumber}] do robo [${roboNumber}] e atendimento [${chatAtendimentoId}]`)
    } catch (error){
        res.status(400).json({erro: error.message});
        console.log('naoenviado');
    }
})

router.post('/wpp/updatestatus', async (req,res) => {
    const {atendimentoId, userEmail} = req.body;

    try {
        //await updateStatusMessage(db, String(from_wa_id))

        await updateAtendimento(db, userEmail, atendimentoId, 'EM_ATENDIMENTO')

        res.status(200).json({ok: 'ok'});
        console.log('ok ???')
    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.get('/list-atendentes', async (req,res) => {
    try {
        const response = await listAtendentes(db)
        res.status(200).json(response);
    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.post('/transfer-service', async (req,res) => {
    const { atendimentoId,
            emailAtendenteFromTransfer,
            emailAtendenteToTransfer,
            phoneClient,
            phoneRobo
        } = req.body
    try {
        await transferAtendimento(db, atendimentoId,
            emailAtendenteFromTransfer,
            emailAtendenteToTransfer,
            phoneClient,
            phoneRobo)
        res.status(200).json('ok');
    } catch (error){
        res.status(400).json({erro: error.message});
    }
})


module.exports = router;
