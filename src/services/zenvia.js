const { default: axios } = require("axios");
const logger = require("../libs/logger");

exports.getContact = async (db, execution, from) => {
  const sql = 'SELECT * FROM contacts WHERE wa_id = ?'
  const result = await new Promise((resolve, reject) => {
      db.query(sql, from, function(err,results){
        if(err) {
          logger.error('[zenvia][getContact]['+execution+'] Erro ao capturar contato :: query ' + sql + ' :: parametros ' + from +' :: erro ' + JSON.stringify(err))
          return reject(err)
        }
        return resolve(results);
      })
  });
  return result.length == 1 ? result[0] : result
}

exports.saveContact = async (db, execution, from, name) => {
  logger.info('[zenvia][saveContact]['+execution+'] Salvando contato ' + from + ' de '+ name)
  const result = await this.getContact(db, execution, from)

  if(Object.keys(result).length > 0){
    logger.info('[zenvia][saveContact]['+execution+'] Contato ' + from + ' de '+ name + ' ja existe no banco de dados')
    return result
  }

  const sqlInsert = 'INSERT INTO contacts(wa_id,name) VALUES(?,?)'
  const resultInsert = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [from, name], function(err,resultsInsert){
      if(err) {
        logger.error('[zenvia][saveContact]['+execution+'] Erro ao criar contato :: query ' + sqlInsert + ' :: parametros ' + JSON.stringify({from, name}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(resultsInsert);
    });
  });

  if(resultInsert.affectedRows > 0){
    const contact = await this.getContact(db, execution, from)
    logger.info('[zenvia][saveContact]['+execution+'] Retornando contato ' + JSON.stringify(contact))
    return contact
  }
}

// exports.getMessage = async (db, from) => {
//   const sql = 'SELECT * FROM messages WHERE from_wa_id = ? ORDER BY created_at DESC'
//   const result = await new Promise((resolve, reject) => {
//     db.query(sql, from, function(err,results){
//       if(err) {
//         logger.error('[zenvia][getMessage] Erro ao criar atendimento :: query ' + sqlInsert + ' :: parametros ' + JSON.stringify({clientPhone, roboPhone, emailAtendente, transferBy}) +' :: erro ' + JSON.stringify(err))
//         return reject(err)
//       }
//       return resolve(results);
//     })
//   });
//   return result
// }

exports.createAtendimento = async (db, execution, clientPhone, roboPhone, emailAtendente = null, transferBy = null)=>{
  const sqlInsert = 'INSERT INTO atendimento(cliente_wa_id, atendente_wa_id, status, user_email, transfer_by) VALUES(?,?,"EM_ESPERA",? ,?)'
  const resultInsert = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [clientPhone, roboPhone, emailAtendente, transferBy], function(err,resultsInsert){
      if(err) {
        logger.error('[zenvia][createAtendimento]['+execution+'] Erro ao criar atendimento :: query ' + sqlInsert + ' :: parametros ' + JSON.stringify({clientPhone, roboPhone, emailAtendente, transferBy}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(resultsInsert);
    });
  });

  if(resultInsert.affectedRows > 0){
    const atendimento = await this.getAtendimento(db, execution, clientPhone, roboPhone)
    return atendimento
  }
}

exports.transferAtendimento = async (db, execution, atendimentoId,
  emailAtendenteFromTransfer,
  emailAtendenteToTransfer,
  phoneClient,
  phoneRobo) => {

  // Atualiza o status do atendimento atual para 'TRANSFERIDO'
  this.updateAtendimento(db, execution, emailAtendenteFromTransfer, atendimentoId, 'TRANSFERIDO')

  // Cria novo atendimento
  const atendimento = this.createAtendimento(db, execution, phoneClient, phoneRobo, emailAtendenteToTransfer, emailAtendenteFromTransfer)
  if (atendimento && atendimento.id){
    logger.info('[transferAtendimento]['+execution+'] Atendimento transferido ' + JSON.stringify(atendimento))
  }
}

exports.updateAtendimento = async (db, execution, userEmail, id, status, transferBy = null) => {
  const sqlUpdate = 'UPDATE atendimento SET status = ?, user_email = ?, transfer_by = ? WHERE id = ?'
  const result = await new Promise((resolve, reject) => {
    db.query(sqlUpdate, [status, userEmail, transferBy, id], (err, results, fields) => {
      if(err) {
        logger.error('[zenvia][updateAtendimento]['+execution+'] Erro ao atualizar atendimento :: query ' + sqlUpdate + ' :: parametros ' + JSON.stringify({status, userEmail, transferBy, id}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  })
  return result
}

exports.getAtendimento = async (db, execution, from, to) => {
  const sql = 'SELECT * FROM atendimento WHERE cliente_wa_id = ? AND atendente_wa_id = ? ORDER BY created_at DESC'
  const result = await new Promise((resolve, reject) => {
    db.query(sql, [from, to], function(err,results){
      if(err) {
        logger.error('[zenvia][getAtendimento]['+execution+'] Erro a selecionar atendimento :: query ' + sql + ' :: parametros ' + JSON.stringify({from, to}) + ' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results);
    })
  });
  logger.info('[zenvia][getAtendimento]['+execution+'] Retornando atendimento ' + JSON.stringify(result))
  return result.length > 0 ? result[0] : result
}

exports.saveMessage = async (db, execution, message, atendimento) => {
  const sqlInsert = 'INSERT INTO messages (from_wa_id, to_wa, type, body, atendimento_id) VALUES(?,?,?,?,?)'
  const result = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [message.from, message.to, message.contents[0].type, message.contents[0].text, atendimento], function(err,results) {
      if(err) {
        logger.error('[zenvia][saveMessage]['+execution+'] Erro ao salvar mensagem :: query ' + sqlInsert + ' :: parametros ' + JSON.stringify({message, atendimento}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  logger.info('[zenvia][saveMessage]['+execution+'] Mensagem salva com sucesso ' + JSON.stringify({message, atendimento}))
  return result
}

// exports.updateStatusMessage = async (db, number) => {
//   const sqlUpdate = 'UPDATE contacts SET status = "EM_ATENDIMENTO" WHERE wa_id = ?'
//   const result = await new Promise((resolve, reject) => {
//     db.query(sqlUpdate, [number], (err, results, fields) => {
//       if(err) {
//         return reject(err)
//       }
//       return resolve(results)
//     })
//   })
//   return result
// }

exports.lastMessageAll = async (db, execution, status, userEmail = '') => {

  var sql = `
    SELECT atendimento.transfer_by, atendimento.cliente_wa_id, atendimento.atendente_wa_id, atendimento.id AS atendimentoId, atendimento.status AS atendimentoStatus, atendimento.user_email AS atendimentoUserEmail,
    messages.id AS message_id, messages.body, messages.created_at AS messageCreatedAt,
    contacts.name, contacts.perfil
    FROM atendimento
    INNER JOIN messages
    ON atendimento.cliente_wa_id = messages.from_wa_id
    INNER JOIN contacts
    ON contacts.wa_id = messages.from_wa_id
    WHERE atendimento.atendente_wa_id = messages.to_wa
    AND atendimento.status = 'EM_ESPERA'
    AND (atendimento.user_email IS NULL OR atendimento.user_email = '${userEmail}')
    AND messages.created_at
    IN (SELECT MAX(messages.created_at) AS created_at FROM messages GROUP BY messages.from_wa_id)
  `

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [status], function(err,results) {
      if(err) {
        logger.error('[zenvia][lastMessageAll]['+execution+'] Erro ao capturar mensagem :: query ' + sql + ' :: parametros ' + JSON.stringify({status, userEmail}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

exports.lastMessage = async (db, execution, status, userEmail = '') => {

  var complement = ''
  if (userEmail != ''){
    complement = `AND atendimento.user_email = "${userEmail}"`
  }

  var sql = `
    SELECT contacts.name, contacts.perfil, messages.from_wa_id, messages.body, messages.type, messages.to_wa, messages.created_at AS messageCreatedAt,
    atendimento.id AS atendimentoId, atendimento.status AS atendimentoStatus, atendimento.user_email AS atendimentoUserEmail
    FROM messages
    INNER JOIN contacts
    ON contacts.wa_id = messages.from_wa_id
    INNER JOIN atendimento
    ON atendimento.id = messages.atendimento_id
    WHERE atendimento.status
    IN (?)
    AND contacts.perfil <> 'ATENDENTE'
    ${complement}
    AND messages.created_at
    IN (SELECT MAX(messages.created_at) AS created_at FROM messages GROUP BY messages.from_wa_id)
  `

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [status], function(err,results) {
      if(err) {
        logger.error('[zenvia][lastMessage]['+execution+'] Erro ao capturar mensagem :: query ' + sql + ' :: parametros ' + JSON.stringify({status, userEmail}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

// exports.messageClient = async (db, from) => {
//   const sql = "SELECT contacts.name, messages.from_wa_id, messages.body, messages.type, messages.to_wa, contacts.status, messages.created_at FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.from_wa_id = ?"

//   const result = await new Promise((resolve, reject) => {
//     db.query(sql, [from], function(err,results) {
//       if(err) {
//         return reject(err)
//       }
//       return resolve(results)
//     })
//   });
//   return result
// }

exports.messageOfClient = async (db, execution, atendimento ) => {
  // const sql = 'SELECT messages.created_at, messages.from_wa_id, messages.to_wa, messages.body, contacts.name, contacts.perfil, contacts.status FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.from_wa_id = ? OR (messages.from_wa_id = 557481305345 and messages.to_wa = ?)'

  const sql = `
    SELECT messages.created_at, messages.from_wa_id, messages.to_wa, messages.body, messages.atendimento_id, contacts.name, contacts.perfil, atendimento.status
    FROM messages
    INNER JOIN contacts
    ON contacts.wa_id = messages.from_wa_id
    INNER JOIN atendimento
    ON messages.atendimento_id = atendimento.id
    WHERE atendimento.id = ?
  `

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [atendimento], (err,results) => {
      if(err) {
        logger.error('[zenvia][messageOfClient]['+execution+'] Erro ao capturar mensagem :: query ' + sql + ' :: parametros ' + atendimento +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

// exports.clientData = async (db, clientNumber ) => {
//   const sql = 'SELECT * FROM contacts WHERE contacts.wa_id = ?'

//   const result = await new Promise((resolve, reject) => {
//     db.query(sql,[clientNumber], function(err,results){
//       if(err) {
//         return reject(err)
//       }
//       return resolve(results)
//     })
//   });
//   return result
// }

exports.sendMessageToClient = async (db, execution, clientNumber, message, chatAtendimentoId, roboNumber) => {
  const fromNumber = roboNumber
  const endpoint = 'https://api.zenvia.com/v2/channels/whatsapp/messages'
  const headers = {
    headers:{
      'X-API-TOKEN': 'p26Q_f6tj6utbkwtHmhzF-4mtvO0QK75ZJDV'
    }
  }
  const body = {
    from: fromNumber,
    to: clientNumber,
    contents: [
      {
        type: 'text',
        text: message
      }
    ]
  }
  logger.info('[zenvia][sendMessageToClient]['+execution+'] Enviando mensagem :: endpoint ' + endpoint + ' :: body ' + JSON.stringify(body))
  await axios.post(endpoint, body, headers)

  const sql = 'INSERT INTO messages (from_wa_id, to_wa, type, body, atendimento_id) VALUES(?,?,?,?,?)'
  const result = await new Promise((resolve, reject) => {
    db.query(sql, [fromNumber, clientNumber, 'text', message, chatAtendimentoId], function(err,results) {
      if(err) {
        logger.error('[zenvia][sendMessageToClient]['+execution+'] Erro ao salvar mensagem enviada :: query ' + sql + ' :: parametros ' + JSON.stringify({fromNumber, clientNumber, message, chatAtendimentoId}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

exports.saveusers = async (db, execution, email, senha, user) => {
  const status = 'pendente'
  const sqlInsert = 'INSERT INTO `users`(`email`, `password`, `fullName`, `status`,`permission`) VALUES (?,?,?,?,0)'
  const result = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [email,senha,user,status], function(err,results) {
      if(err) {
        logger.error('[zenvia][saveusers]['+execution+'] Erro ao criar usuario :: query ' + sqlInsert + ' :: parametros ' + JSON.stringify({email,senha,user,status}) +' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

exports.listAtendentes = async (db, execution) => {
  const sql = "SELECT email, fullName, perfil, setor FROM users"

  const result = await new Promise((resolve, reject) => {
    db.query(sql, function(err,results) {
      if(err) {
        logger.error('[zenvia][listAtendentes]['+execution+'] Erro ao criar usuario :: query ' + sql + ' :: erro ' + JSON.stringify(err))
        return reject(err)
      }
      return resolve(results)
    })
  });
  return result
}

// exports.transferService = async (db) => {
//   const sql = "SELECT email, fullName, perfil, setor FROM users"

//   const result = await new Promise((resolve, reject) => {
//     db.query(sql, function(err,results) {
//         if(err) throw err;
//         return resolve(results)
//     })
//   });
//   return result
// }
