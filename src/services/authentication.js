const logger = require("../libs/logger");

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
                objResponse.name = results[0].fullName
                return resolve(objResponse);
            }else{
                objResponse.loginErr = true
                return resolve(objResponse);
            }
        })
    });
    return result
}

exports.userPermission = async (db, execution, email) => {
    const sql = 'SELECT * FROM users WHERE email = ? ';
    const panelAgent = '/painel-agente'
    const panelSupervisor = '/painel-supervisor'

    const result = await new Promise((resolve, reject) => {
        db.query(sql, [email], function (err, result) {
            if(err) {
                logger.error('[authentication][userPermission]['+execution+'] Erro a selecionar usuario :: query ' + sql + ' :: parametros ' + email + ' :: erro ' + JSON.stringify(err))
                return reject(err)
            }
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
