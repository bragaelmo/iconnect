const { saveContact, getMessage, createAtendimento, saveMessage, getAtendimento } = require("./zenvia")

// Verificar se existe contato, se nao existir cria o contato, registra a mensagem e cria/atualiza o atendimento
// A regra de criacao de atendimento está assim:
// Se a ultima mensagem do cliente for mais antigo que ontem, entao geramos um novo atendimento
// Se for entre ontem e hoje entao apenas atualizamos o atendimento
exports.atendimento = async (db, hook) => {
  const from = hook.message.from
  const contact =  await saveContact(db, from, hook.message.visitor.name)
  console.log('[atendimento] Contact ' + JSON.stringify(contact))

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  var atendimento = await getAtendimento(db, hook.message.from, hook.message.to)
  console.log('[atendimento] Atendimento encontrado: ' + JSON.stringify(atendimento))
  if(
    !atendimento ||
    atendimento.length < 1 ||
    atendimento.updated_at < yesterday
  ){
    atendimento = await createAtendimento(db, contact, hook.message.to)
    console.log('[atendimento] Atendimento criado ' + JSON.stringify(atendimento))
  }

  await saveMessage(db, hook.message, atendimento.id)
  console.log('[atendimento] Mensagem salva ' + JSON.stringify(hook.message) + ' no atendimento ' + atendimento.id)

  return atendimento.id
}
