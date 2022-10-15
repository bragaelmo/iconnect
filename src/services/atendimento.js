const logger = require("../libs/logger")
const { saveContact, createAtendimento, saveMessage, getAtendimento } = require("./zenvia")

// Verificar se existe contato, se nao existir cria o contato, registra a mensagem e cria/atualiza o atendimento
// A regra de criacao de atendimento está assim:
// Se a ultima mensagem do cliente for mais antigo que ontem, entao geramos um novo atendimento
// Se for entre ontem e hoje entao apenas atualizamos o atendimento
exports.atendimento = async (db, execution, hook) => {
  const from = hook.message.from
  const contact =  await saveContact(db, execution, from, hook.message.visitor.name)
  logger.info('[atendimento]['+execution+'] Contact ' + JSON.stringify(contact))

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  var atendimento = await getAtendimento(db, execution, hook.message.from, hook.message.to)
  logger.info('[atendimento]['+execution+'] Atendimento encontrado: ' + JSON.stringify(atendimento))
  if(
    !atendimento ||
    atendimento.length < 1 ||
    atendimento.updated_at < yesterday
  ){
    atendimento = await createAtendimento(db, execution, contact.wa_id, hook.message.to)
    logger.info('[atendimento]['+execution+'] Atendimento criado ' + JSON.stringify(atendimento))
  }

  await saveMessage(db, execution, hook.message, atendimento.id)
  logger.info('[atendimento]['+execution+'] Mensagem salva ' + JSON.stringify(hook.message) + ' no atendimento ' + atendimento.id)

  return atendimento.id
}
