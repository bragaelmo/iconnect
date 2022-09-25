const { default: axios } = require("axios");

exports.getMessageByFront = async (from) => {
  const { dbConnect } = require("./repositories/mysql");
  const db = dbConnect();
  return messageOfClient(db, from)
}

exports.saveContact = async (db, from, name) => {
  const sql = 'SELECT name FROM contacts WHERE wa_id = ?'
  const sqlInsert = 'INSERT INTO contacts(wa_id,name) VALUES(?,?)'

  const result = await new Promise((resolve, reject) => {
      db.query(sql, from, function(err,results){
        if(err) {throw err};

        //if not, register
        if(Object.keys(results).length == 0){
            db.query(sqlInsert, [from, name]);
            if (err) { throw err};
        };
        return resolve(results);
      })
  });
  return result
}

exports.saveMessage = async (db, from, message) => {
    const sqlInsert = 'INSERT INTO messages (from_wa_id, type, body, to_wa, status) VALUES(?,?,?,?, "EM_ESPERA")'
    db.query(sqlInsert,
    [from, message.contents[0].type, message.contents[0].text, message.to]);
}

exports.updateStatusMessage = async (db, number) => {
  const sqlUpdate = 'UPDATE messages SET status = "EM_ATENDIMENTO" WHERE from_wa_id = ?'
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

exports.lastMessage = async (db, status) => {
  const sql = "SELECT contacts.name, contacts.status, messages.from_wa_id, messages.body, messages.type, messages.to_wa, messages.status, messages.created_at FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.status IN (?) AND messages.created_at IN ( SELECT MAX(messages.created_at) FROM messages GROUP BY messages.from_wa_id)"

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [status], function(err,results) {
        if(err) throw err;
        return resolve(results)
    })
  });
  return result
}

exports.messageClient = async (db, from) => {
  const sql = "SELECT contacts.name, messages.from_wa_id, messages.body, messages.type, messages.to_wa, messages.status, messages.created_at FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.from_wa_id = ?"

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [from], function(err,results) {
        if(err) throw err;
        return resolve(results)
    })
  });
  return result
}

exports.messageOfClient = async (db, from ) => {
  const sql = 'SELECT messages.created_at, messages.from_wa_id, messages.to_wa, messages.body, contacts.name FROM messages INNER JOIN contacts ON contacts.wa_id = messages.from_wa_id WHERE messages.from_wa_id = ? OR (messages.from_wa_id = 557481305345 and messages.to_wa = ?)'

  const result = await new Promise((resolve, reject) => {
    db.query(sql, [from, from], (err,results) => {
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

exports.sendMessageToClient = async (db, clientNumber, message ) => {
  const fromNumber = '557481305345'
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

  const sql = 'INSERT INTO messages (from_wa_id, to_wa, type, body) VALUES(?,?,?,?)'
    db.query(sql, [fromNumber, clientNumber, 'text', message]);
}

exports.saveusers = async (db,email,senha,user) => {
  const sqlInsert = 'INSERT INTO `users`(`email`, `password`, `fullName`, `status`,`permission`) VALUES (?,?,?,?,0)'
    db.query(sqlInsert,
      [email,senha,user,'pendente']);
}
