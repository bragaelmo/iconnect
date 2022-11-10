startListClients()
var quantidadeEmEspera = 0
function startListClients(){
  const HOST = document.getElementById('my-host').innerText
  //$('.msg').fadeOut(600, function(){ $(this).remove();});
  const email = document.getElementById('my-mail').innerText
  fetch(HOST+'/wpp/message-client', {
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
    quantidadeEmEspera = data.length
    for(clients of data){
      const client = {
        clientNumber: clients.cliente_wa_id,
        clientName: clients.name,
        timeMsg: clients.messageCreatedAt,
        clientMsg: clients.body,
        atendimentoId: clients.atendimentoId,
        atendimentoStatus: clients.atendimentoStatus,
        atendimentoUserId: clients.atendimentoUserId,
        transferBy: clients.transfer_by,
        roboNumber: clients.atendente_wa_id
      }
      listContactsWaiting(client);
    }

    if(quantidadeEmEspera === 1){
    document.getElementById('quantidadeEmEspera').innerText = quantidadeEmEspera + ' Atendimento em espera'
    }
    if(quantidadeEmEspera > 1){
      document.getElementById('quantidadeEmEspera').innerText = quantidadeEmEspera + ' Atendimentos em espera'
    }
  })
  .catch(err => {
    showModalError(err.message)
  })
}

function listContactsWaiting(obj){
  const dateHourBr = new Date(obj.timeMsg)
  obj.timeMsg = dateHourBr.toLocaleString().replace(',', '').slice(0, -3).replace('/', '-').replace('/', '-')

  $('#dash-em-espera').prepend(`
  <li class="list-group-item">
      <div class="d-flex flex-row-reverse"><small class="msg-time" style="color:#979797; font-size:11px;
      font-weight:600;">${obj.timeMsg}</small></div>
          <div class="d-flex">
            <img class="avatar lg rounded-circle img-thumbnail" style="border: 1px solid silver; text-align: center;"
            src="https://ui-avatars.com/api/?name=${obj.clientName}&background=random&color=ff0000&bold=true">
            <div class="container text-truncate">
                <div class="row">
                    <div class="d-flex col-md-7"><h6 class="mb-2">${obj.clientName}</h6></div>
                </div>
                <div class="d-flex">
                    <span class="text-muted"><i class="icofont-swoosh-right fs-5"></i></span> ${obj.clientMsg}
                </div>
            </div>
          </div>
          ${dropDownMenu(obj)}
  </li>`)
}
// "preparaTransferencia('${atendente.email}::${atendente.fullName}::${atendente.perfil}::${atendimentoId}')"
function dropDownMenu(obj){
  return `
  <div class="d-flex flex-row-reverse">
      <a style="border: none; font-size: 18px; cursor: pointer;" class="icofont-navigation-menu" data-bs-toggle="dropdown" aria-expanded="false">
      </a>
      <ul class="dropdown-menu border-0 shadow py-3 px-2">
          <li>
              <button type="button" class="dropdown-item py-2 rounded" id="viewerChat" onclick="showModalViewerChatMessages(${obj.atendimentoId})" data-bs-toggle="modal" data-bs-target="#modaltransferir">
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
