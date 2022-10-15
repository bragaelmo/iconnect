const { dbConnect } = require("./repositories/mysql");
const { v4: uuid } = require('uuid');
const db = dbConnect();

const { login, userPermission } = require("./services/authentication");
const router = require('express').Router(); //express
const socketIO = require('../socket');             //socket
const { saveMessage, lastMessage, messageOfClient, sendMessageToClient, saveusers, getMessage, updateAtendimento, listAtendentes, transferAtendimento, lastMessageAll } = require('./services/zenvia');
const { route } = require("../zenvia-routes");
const { atendimento } = require("./services/atendimento");
const logger = require("./libs/logger");


socketIO.on('db', (socket) => {
    logger.info('[routes] Socket conectado :: ' + socket.id)
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
    const execution = uuid()
    if(req.session.login){
        logger.info('[routes][' + execution + '] Realizado logout de ' + req.session.login + ' com sucesso')
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
    const execution = uuid()
    const session = await login(db, email, password)
    req.session.loginErr = session.loginErr;

    if (req.session && req.session.loginErr == false){
        //logger.info('[routes][' + execution + '] Realizado login de ' + req.session.login + ' com sucesso')
        req.session.name = session.name;
        req.session.login = session.login;
        res.redirect('/userPermission');
        return
    }
    logger.info('[routes][' + execution + '] Login nao autorizado ' + email)
    res.redirect('/');
});

//pega as informações do atendente conectado
router.get("/userPermission", async (req, res) => {
    if(!req.session.login){
        res.redirect('/');
        return
    }
    var userEmail = req.session.login;
    const execution = uuid()
    const {panel, permission} = await userPermission(db, execution, userEmail)

    if(panel){
        logger.info('[routes][' + execution + '] Realizado login de ' + userEmail + ' no painel ' + panel + ' com permissao ' + permission)
        req.session.permission = permission
        res.redirect(panel)
        return
    }
    res.redirect('/');
})
//FIM ROTAS DE LOGIN E PERMISSÃO ========================================
function getSessionStrings(req){
    var name = req.session.name.split(' ')[0]
    const execution = uuid()
    var session =  {
        sessionName: name,
        sessionFullName: req.session.name,
        sessionEmail: req.session.login,
        sessionHost: process.env.HOST + ':' + process.env.PORT
    }
    logger.info('[routes][' + execution + '] Carregando session com os valores ' + JSON.stringify(session))
    return session
}
// ROTAS DO PAINEL DE AGENTE ============================================
router.get('/painel-agente', (req,res) => {
    // ------------- VER ESSA PARTE

    if(!req.session.login){
        res.redirect('/');
        return
    }
    const execution = uuid()
    var render = './paineis/painel-agente/chat';
    var sidebarHome = "active";
    var container = false;
    logger.info('[routes][' + execution + '] Carregando ' + render + ' para o usuario ' + req.session.login)

    res.render(render,
    {
        title:'Agente Home - iConect',
        container:container,
        sidebarHome: sidebarHome,
        sidebars: 'aget',
        ...getSessionStrings(req)
    });

});
router.get('/painel-supervisor', (req,res) => {
    if(!req.session.login){
        res.redirect('/');
        return
    }
    const execution = uuid()
    var render = './paineis/painel-supervisor/chat';
    var sidebarHome = "active";
    var container = false;
    logger.info('[routes][' + execution + '] Carregando ' + render + ' para o usuario ' + req.session.login)

    res.render(render,
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
    const execution = uuid()
    logger.info('[routes][' + execution + '] Webhook recebido ' + JSON.stringify(hook))
    try {
        //if it's client message
        if(hook.message){
            const fromClient = hook.message.from
            const atendimentoId = await atendimento(db, execution, hook)

            socketIO.emit('receivedMessage', {fromClient, atendimentoId})
            logger.info('[routes][' + execution + '] Webhook registrado com sucesso')
            res.status(200).send({message: "enviado"});
        }

        // Testar melhor
        if(hook.statuses){
            console.log(hook.statuses);

            await saveMessage(db, execution, '557481305345', hook.message)

            console.log(hook.statuses[0].message);

            res.status(200).send({message: "enviado"});
        }

    } catch (err) {
        logger.error('[routes][' + execution + '] Webhook error ' + err.message)
        return res.status(400).send({ error: err.message })
    }
});

router.post("/wpp/last-message-client", async (req, res) => {
    const {email} = req.body
    const execution = uuid()
    const status = 'EM_ESPERA';
    logger.info('[routes][/wpp/last-message-client][' + execution + '] parametros ' + email)

    try{
        const response = await lastMessageAll(db, execution, status, email)
        logger.info('[routes][/wpp/last-message-client][' + execution + '][' + email + '][' + status + '] Retornando mensagens ' + JSON.stringify(response))
        res.status(200).json(response);

    } catch (error){
        logger.error('[routes][/wpp/last-message-client][' + execution + '][' + email + '][' + status + '] erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
})

router.post("/wpp/last-message-client-in-service", async (req, res) => {

    // Gerar token de email para dificultar o acesso a atendimentos nao permitidos
    const {email} = req.body
    const status = 'EM_ATENDIMENTO';
    const execution = uuid()
    logger.info('[routes][/wpp/last-message-client-in-service][' + execution + '][' + status + '] parametros ' + email)
    try{
        const response = await lastMessage(db, execution, status, email)
        logger.info('[routes][/wpp/last-message-client-in-service][' + execution + '][' + email + '][' + status + '] Retornando mensagens ' + JSON.stringify(response))
        res.status(200).json(response);

    } catch (error){
        logger.error('[routes][/wpp/last-message-client-in-service][' + execution + '][' + email + '][' + status + '] erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
})

router.get('/painel-agente/config', (req,res) => {
    var name = req.session.name.split(' ')[0]
    const execution = uuid()
    logger.info('[routes][/painel-agente/config][' + execution + '] parametros ' + name)
    res.render('./paineis/painel-agente/config', {
        ...getSessionStrings(req)
    })
});

//cadastro de agente
router.get('/cadastro', (req,res) => {
    var name = req.session.name.split(' ')[0]
    const execution = uuid()
    logger.info('[routes][/cadastro][' + execution + '] parametros ' + name)
    res.render('./paineis/painel-agente/cadastro', {
        ...getSessionStrings(req)
    })
});
//cadastro
router.post('/cadastro-usuario', async (req,res) =>{
    const {email, senha, nome} = req.body
    const execution = uuid()
    logger.info('[routes][/cadastro-usuario][' + execution + '] parametros ' + JSON.stringify({email, nome}))
    try {
        await saveusers(db, execution, email, senha, nome)
        logger.info('[routes][/cadastro-usuario][' + execution + '] Cadastro realizado com sucesso ' + JSON.stringify({email, nome}))
        res.send(" <script>alert('Cadastro feito com sucesso'); window.location.href = '/'; </script>");
    } catch (error){
        logger.error('[routes][/cadastro-usuario][' + execution + '] parametros ' + JSON.stringify({email, nome}) + ' :: erro ' + error.message)
        res.status(400).json({erro: error.message});
    }

});

router.post("/wpp/message-chat-client", async (req,res) => {
    const {atendimento_id} = req.body;
    const execution = uuid()
    logger.info('[routes][/wpp/message-chat-client][' + execution + '] parametros ' + atendimento_id)
    try{
        const response = await messageOfClient(db, execution, atendimento_id)
        logger.info('[routes][/wpp/message-chat-client][' + execution + '] Retornando mensagens do atendimento ' + atendimento_id + ' :: mensagens ' + JSON.stringify(response))
        res.status(200).json(response);

    } catch (error){
        logger.error('[routes][/wpp/message-chat-client][' + execution + '] parametros ' + atendimento_id + ' :: erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
});

// router.post('/wpp/client-data', async (req,res) => {
//     const {clientNumber} = req.body;
//     logger.info('[routes][/wpp/client-data] parametros ' + clientNumber)
//     try{
//         const response = await clientData(db, clientNumber)
//         res.json(response);
//         res.status(200);

//     } catch (error){
//         res.status(400).json({erro: error.message});
//     }
// })

router.post('/wpp/send-message', async (req,res) => {
    // Adicionar token de atendimento para permitir o envio somente se o atendente assumir o atendimento
    const {clientNumber, message, chatAtendimentoId, roboNumber} = req.body;
    const execution = uuid()
    logger.info('[routes][/wpp/send-message][' + execution + '] parametros ' + JSON.stringify({clientNumber, message, chatAtendimentoId, roboNumber}))
    try {
        await sendMessageToClient(db, execution, clientNumber, message, chatAtendimentoId, roboNumber)
        logger.info(`[routes][/wpp/send-message][${execution}] Mensagem [${message}] enviada com sucesso para o cliente [${clientNumber}] do robo [${roboNumber}] e atendimento [${chatAtendimentoId}]`)
        res.status(200).json({ok: 'ok'});

    } catch (error){
        logger.error('[routes][/wpp/send-message][' + execution + '] Erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
})

router.post('/wpp/updatestatus', async (req,res) => {
    const {atendimentoId, userEmail} = req.body;
    const status = 'EM_ATENDIMENTO';
    const execution = uuid()
    logger.info('[routes][/wpp/updatestatus][' + execution + '] parametros ' + JSON.stringify({atendimentoId, userEmail}))
    try {
        await updateAtendimento(db, execution, userEmail, atendimentoId, status)
        logger.info('[routes][/wpp/updatestatus][' + execution + '] Atendimento atualizado com sucesso ' + JSON.stringify({userEmail, atendimentoId, status}))
        res.status(200).json({status: 'ok'});

    } catch (error){
        logger.error('[routes][/wpp/updatestatus][' + execution + '] parametros ' + JSON.stringify({atendimentoId, userEmail}) + ' :: erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
})

router.get('/list-atendentes', async (req,res) => {
    const execution = uuid()
    logger.info('[routes][/list-atendentes][' + execution + '] Listando atendentes')
    try {
        const response = await listAtendentes(db, execution)
        logger.info('[routes][/list-atendentes][' + execution + '] Atendentes encontrados ' + JSON.stringify(response))
        res.status(200).json(response);
    } catch (error){
        logger.error('[routes][/list-atendentes][' + execution + '] Erro ' + error.message)
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
    const execution = uuid()
    logger.info('[routes][/transfer-service][' + execution + '] Transferindo atendimento ' + JSON.stringify({ atendimentoId,
        emailAtendenteFromTransfer,
        emailAtendenteToTransfer,
        phoneClient,
        phoneRobo
    }))
    try {
        await transferAtendimento(db, execution, atendimentoId,
            emailAtendenteFromTransfer,
            emailAtendenteToTransfer,
            phoneClient,
            phoneRobo)
        logger.info('[routes][/transfer-service][' + execution + '] Atendimento transferido com sucesso ')
        res.status(200).json('ok');
    } catch (error){
        logger.error('[routes][/transfer-service][' + execution + '] Erro ao transferir atendimento :: erro ' + error.message)
        res.status(400).json({erro: error.message});
    }
})


module.exports = router;
