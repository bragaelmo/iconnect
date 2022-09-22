exports.login = async (db, email, password) => {
    const sql = 'SELECT * FROM users WHERE password = ? AND email LIKE ?';
    const objResponse = {
        loginErr: false,
        login: email,
        name: ''
    }
    const result = await new Promise((resolve, reject) => {
        db.query(sql, [password, email], function (err, results){
            if (results && results.length > 0){
                console.log("Login feito com sucesso!");
                console.log("Usuário "+email+" identificado!")
                objResponse.name = results[0].fullName
                return resolve(objResponse);
            }else{
                console.log("Usuário não identificado!")
                objResponse.loginErr = true
                return resolve(objResponse);
            }
        })
    });
    return result
}

exports.userPermission = async (db, email) => {
    const sql = 'SELECT * FROM users WHERE email = ? ';
    const panelAgent = '/painel-agente'
    const panelSupervisor = '/painel-supervisor'

    const result = await new Promise((resolve, reject) => {
        db.query(sql, [email], function (err, result) {
            //PERMISSÃO 0 = AGENTE
            if(result[0].permission == 0){
                return resolve({panel: panelAgent, permission: 0})
            }
            //PERMISSÃO 1 = SUPERVISOR
            if(result[0].permission == 1){
                return resolve({panel: panelSupervisor, permission: 1})
            }
        });
    });
    return result
}

exports.userPermission = async (db, email) => {
    const sql = 'SELECT * FROM users WHERE email = ? ';
    const panelAgent = '/painel-agente'
    const panelSupervisor = '/painel-supervisor'

    const result = await new Promise((resolve, reject) => {
        db.query(sql, [email], function (err, result) {
            //PERMISSÃO 0 = AGENTE
            if(result[0].permission == 0){
                return resolve({panel: panelAgent, permission: 0})
            }
            //PERMISSÃO 1 = SUPERVISOR
            if(result[0].permission == 1){
                return resolve({panel: panelSupervisor, permission: 1})
            }
        });
    });
    return result
}
