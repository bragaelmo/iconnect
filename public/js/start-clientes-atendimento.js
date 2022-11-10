startListClientsEmAtendimento()
var quantidadeEmAtendimento = 0
function startListClientsEmAtendimento(){
  const email = document.getElementById('my-mail').innerText
  fetch(HOST+'/wpp/message-client-in-service', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({email: email}),
  })
  .then(res => res.json())
  .then(data => {
    if(data.error){
      throw new Error(data.error)
    }
    quantidadeEmAtendimento = data.length
    for(clients of data){
      const client = {
          clientNumber: clients.cliente_wa_id,
          clientName: clients.name,
          timeMsg: clients.messageCreatedAt,
          clientMsg: clients.body,
          atendimentoId: clients.atendimentoId,
          atendimentoStatus: clients.atendimentoStatus,
          atendimentoUserId: clients.atendimentoUserId,
          atendimentoName: clients.nameAtendente,
          atendimentoSetor: clients.setorAtendente,
          roboNumber: clients.atendente_wa_id
      }
      listContactsInService(client);
    }
    if(quantidadeEmEspera > 0){
      document.getElementById('quantidadeEmAtendimento').innerText = quantidadeEmAtendimento + ' Em atendimento'
    }

  })
  .catch(err => {
    showModalError(err.message)
  })
}

function listContactsInService(obj){
  const dateHourBr = new Date(obj.timeMsg)
  obj.timeMsg = dateHourBr.toLocaleString().replace(',', '').slice(0, -3).replace('/', '-').replace('/', '-')

  document.getElementById("msg-vazio").style.display = 'none'

$('#dash-em-atendimento').prepend(`
  <li class="list-group-item">
    <div class="d-flex flex-row-reverse"><small class="msg-time" style="color:#979797; font-size:11px;
    font-weight:600;">${obj.timeMsg}</small></div>
    <div class="d-flex">
      <div class="container text-truncate">
          <div class="row">
              <div class="d-flex col-md-7"><h6 class="mb-2"><i class="icofont-ui-user"></i> ${obj.clientName}</h6></div>
          </div>
          <div class="d-flex mt-2">
              <div class="d-flex col-md-7 align-items-center"><i class="icofont-headphone-alt-2" style="margin-left: 2px;"></i><span style="margin-left: 5px;">${obj.atendimentoName}</span></div>
              <div class="d-flex col-md-5 align-items-center"><i class="icofont-star"></i><span style="margin-left: 5px;">${obj.atendimentoSetor}</span></div>
          </div>
      </div>
    </div>
    ${dropDownMenu(obj)}
  </li>`)
}

function dropDownMenu(obj){
  return `
  <div class="d-flex flex-row-reverse">
      <a style="border: none; font-size: 18px; cursor: pointer;" class="icofont-navigation-menu" data-bs-toggle="dropdown" aria-expanded="false">
      </a>
      <ul class="dropdown-menu border-0 shadow py-3 px-2">
          <li>
              <button type="button" class="dropdown-item py-2 rounded" id="viewerChat" onclick="showModalViewerChatMessages(${obj.atendimentoId})" data-bs-toggle="modal" data-bs-target="#bodyChatSupervisor">
                <i class="icofont-eye-open"></i> Visualizar
              </button>
          </li>
          <li>
              <button type="button" class="dropdown-item py-2 rounded" onclick="listAtendentes('${obj.clientName}::${obj.atendimentoId}::${obj.roboNumber}::${obj.clientNumber}')" id="buttonMoverAtendimento" data-bs-toggle="modal" data-bs-target="#modaltransferir">
                <i class="icofont-external-link"></i> Transferir
              </button>
          </li>
          <li>
              <button type="button" class="dropdown-item py-2 rounded" onclick="preparaEncerrarAtendimento('${obj.clientName}::${obj.atendimentoId}')" data-bs-toggle="modal" data-bs-target="#modalEncerrarAtendimento">
                <i class="icofont-close"></i> Encerrar
              </button>
          </li>
      </ul>
  </div>`
}

function showModalError(message){
  $('#messageToError').text(message)
  $('.frame-error').modal('show');
}
