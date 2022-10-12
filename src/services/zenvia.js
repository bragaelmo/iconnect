const { default: axios } = require("axios");
const { DateUtil } = require("../libs/date");

exports.getMessageByFront = async (from) => {
  const { dbConnect } = require("./repositories/mysql");
  const db = dbConnect();
  return messageOfClient(db, from)
}

exports.getContact = async (db, from) => {
  const sql = 'SELECT * FROM contacts WHERE wa_id = ?'
  const result = await new Promise((resolve, reject) => {
      db.query(sql, from, function(err,results){
        if(err) {throw err};
        return resolve(results);
      })
  });
  return result.length == 1 ? result[0] : result
}

exports.saveContact = async (db, from, name) => {
  const result = await this.getContact(db, from)
  if(Object.keys(result).length > 0){
    return result
  }

  const sqlInsert = 'INSERT INTO contacts(wa_id,name) VALUES(?,?)'
  const resultInsert = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [from, name], function(err,resultsInsert){
      if (err) { throw err};
      return resolve(resultsInsert);
    });
  });

  if(resultInsert.affectedRows > 0){
    return await this.getContact(db, from)
  }
}

exports.getMessage = async (db, from) => {
  const sql = 'SELECT * FROM messages WHERE from_wa_id = ? ORDER BY created_at DESC'
  const result = await new Promise((resolve, reject) => {
    db.query(sql, from, function(err,results){
      if(err) {throw err};
      return resolve(results);
    })
  });
  return result
}

exports.createAtendimento = async (db, clientPhone, roboPhone, emailAtendente = null, transferBy = null)=>{
  const sqlInsert = 'INSERT INTO atendimento(cliente_wa_id, atendente_wa_id, status, user_email, transfer_by) VALUES(?,?,"EM_ESPERA",? ,?)'
  const resultInsert = await new Promise((resolve, reject) => {
    db.query(sqlInsert, [clientPhone, roboPhone, emailAtendente, transferBy], function(err,resultsInsert){
      if (err) { throw err};
      return resolve(resultsInsert);
    });
  });

  if(resultInsert.affectedRows > 0){
    return await this.getAtendimento(db, clientPhone, roboPhone)
  }
}

exports.transferAtendimento = async (db, atendimentoId,
  emailAtendenteFromTransfer,
  emailAtendenteToTransfer,
  phoneClient,
  phoneRobo) => {

  // Atualiza o status do atendimento atual para 'TRANSFERIDO'
  this.updateAtendimento(db, emailAtendenteFromTransfer, atendimentoId, 'TRANSFERIDO')

  // Cria novo atendimento
  const atendimento = this.createAtendimento(db, phoneClient, phoneRobo, emailAtendenteToTransfer, emailAtendenteFromTransfer)
  if (atendimento && atendimento.id){
    console.log('[transferAtendimento] Atendimento transferido ' + JSON.stringify(atendimento))
  }
}

exports.updateAtendimento = async (db, userEmail, id, status, transferBy = null) => {
  const sqlUpdate = 'UPDATE atendimento SET status = ?, user_email = ?, transfer_by = ? WHERE id = ?'
  const result = await new Promise((resolve, reject) => {
    db.query(sqlUpdate, [status, userEmail, transferBy, id], (error, results, fields) => {
      if (error){
        return console.error(error.message);
      }
      return resolve(results)
    })
  })
  return result
}

exports.getAtendimento = async (db, from, to) => {
  const sql = 'SELECT * FROM atendimento WHERE cliente_wa_id = ? AND atendente_wa_id = ? ORDER BY created_at DESC'
  const result = await new Promise((resolve, reject) => {
    db.query(sql, [from, to], function(err,results){
      if(err) {throw err};
      return resolve(results);
    })
  });
  return result.length > 0 ? result[0] : result
}

exports.saveMessage = async (db, message, atendimento) => {
    const sqlInsert = 'INSERT INTO messages (from_wa_id, to_wa, type, body, atendimento_id) VALUES(?,?,?,?,?)'
    db.query(sqlInsert,
    [message.from, message.to, message.contents[0].type, message.contents[0].text, atendimento]);
}

exports.updateStatusMessage = async (db, number) => {
  const sqlUpdate = 'UPDATE contacts SET status = "EM_ATENDIMENTO" WHERE wa_id = ?'
  const result = await new Promise((resolve, reject) => {
    db.query(sqlUpdate, [number], (error, results, fields) => {
      if (error){
        return console.error(error.message);
      }
      return resolve(results)
    })
  })
  return result
}

exports.lastMessageAll = async (db, status, userEmail = '') => {

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
        if(err) throw err;
        return resolve(results)
    })
  });
  console.log('RESULT ::: ' + JSON.stringify(result))
  return result
}

exports.lastMessage = async (db, status, userEmail = '') => {

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
        if(err) throw err;
        return resolve(results)
    })
  });
  console.log('RESULT ::: ' + JSON.stringify(result))
  return result
}

exports.messageClient = async (db, from) => {
  const sql = "SELECT contacts.name, messages.from_wa_id, messages.body, messages.type, messages.to_wa, contacts.status, messages.created_at FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.from_wa_id = ?"

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [from], function(err,results) {
        if(err) throw err;
        return resolve(results)
    })
  });
  return result
}

exports.messageOfClient = async (db, atendimento ) => {
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
      if(err) throw err;
      return resolve(results)
    })
  });
  return result
}

exports.clientData = async (db, clientNumber ) => {
  const sql = 'SELECT * FROM contacts WHERE contacts.wa_id = ?'

  const result = await new Promise((resolve, reject) => {
    db.query(sql,[clientNumber], function(err,results){
      if(err) throw err;
      return resolve(results)
    })
  });
  return result
}

exports.sendMessageToClient = async (db, clientNumber, message, chatAtendimentoId, roboNumber) => {
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

  await axios.post(endpoint, body, headers)

  const sql = 'INSERT INTO messages (from_wa_id, to_wa, type, body, atendimento_id) VALUES(?,?,?,?,?)'
    db.query(sql, [fromNumber, clientNumber, 'text', message, chatAtendimentoId]);
}

exports.saveusers = async (db,email,senha,user) => {
  const sqlInsert = 'INSERT INTO `users`(`email`, `password`, `fullName`, `status`,`permission`) VALUES (?,?,?,?,0)'
    db.query(sqlInsert,
      [email,senha,user,'pendente']);
}

exports.listAtendentes = async (db) => {
  const sql = "SELECT email, fullName, perfil, setor FROM users"

  const result = await new Promise((resolve, reject) => {
    db.query(sql, function(err,results) {
        if(err) throw err;
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
