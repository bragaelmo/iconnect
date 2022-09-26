const { dbConnect } = require("./repositories/mysql");
const db = dbConnect();

const { login, userPermission } = require("./services/authentication");
const router = require('express').Router(); //express
const socketIO = require('../socket');             //socket
const { saveContact, saveMessage, lastMessage, messageOfClient, clientData, sendMessageToClient, saveusers, updateStatusMessage } = require('./services/zenvia');
const { route } = require("../zenvia-routes");


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
    try {
        //if it's client message
        if(hook.message){
            const from = hook.message.from
            await saveContact(db, from, hook.message.visitor.name)
            await saveMessage(db, from, hook.message)

            const response = await messageOfClient(db, from)

            socketIO.emit('receivedMessage', {from})

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
        const response = await lastMessage(db, 'EM_ESPERA')
        res.json(response);
        res.status(200);

    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

router.get("/wpp/last-message-client-all", async (req, res) => {
    //render messages of db in messages visualizer
    try{
        const response = await lastMessage(db, ['EM_ATENDIMENTO'])
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
         console.log('enviado');
    } catch (error){
        res.status(400).json({erro: error.message});
        console.log('naoenviado');
    }
})

router.post('/wpp/updatestatus', async (req,res) => {
    const {from_wa_id} = req.body;
    console.log(from_wa_id);
    try {
        await updateStatusMessage(db, String(from_wa_id))
        res.status(200).json({ok: 'ok'});
        console.log('ok ???')
    } catch (error){
        res.status(400).json({erro: error.message});
    }
})

module.exports = router;
