function listAtendentes(objAtendimento){
  document.getElementById("listAtendentes").innerText = ''
  document.getElementById("listAtendentesSupervisor").innerText = ''

  document.getElementById("transfer-client-name").innerText = objAtendimento.split('::')[0]
  document.getElementById("transfer-atendimentoId").innerText = objAtendimento.split('::')[1]
  document.getElementById("transfer-roboNumber").innerText = objAtendimento.split('::')[2]
  document.getElementById("transfer-clientNumber").innerText = objAtendimento.split('::')[3]

  fetch(HOST+'/list-atendentes')
  .then(res => res.json())
  .then(atendentes => {
    if(atendentes.error){
      throw new Error(atendentes.error)
    }

    if (atendentes.length > 0){
      for (var atendente of atendentes){
        renderListAtendentesForTransfer(atendente, objAtendimento);
      }
    }
  })
  .catch(err => {
    showModalError(err.message)
  })
}

function renderListAtendentesForTransfer(atendente, objAtendimento){
  var list = $('#listAtendentes')
  if(atendente.perfil === 'Supervisor'){
    list = $('#listAtendentesSupervisor')
  }
  console.log('VEM TUDOOOO objAtendimento ' + JSON.stringify(objAtendimento))
  list.prepend(
    `<div class="py-2 d-flex align-items-center border-bottom flex-wrap">
      <a onclick="preparaTransferencia('${atendente.email}::${atendente.fullName}::${atendente.perfil}::${objAtendimento.atendimentoId}')" >
        <div class="d-flex align-items-center flex-fill">
            <img class="avatar lg rounded-circle img-thumbnail" style="border: 1px solid silver; text-align: center;" src="https://ui-avatars.com/api/?name=${atendente.fullName}&background=random&color=ff0000&bold=true">
            <div class="d-flex flex-column ps-3">
                <h6 class="fw-bold mb-0 small-14">${atendente.fullName}</h6>
                <span class="text-muted">${atendente.email}</span>
                <div class="text-muted"><i class="icofont-engineer"></i> ${atendente.perfil} | ${atendente.setor} </div>
            </div>
        </div>
        </a>
    </div>`
  )
}

function preparaTransferencia(atendente){
  console.log('VEM TUDOOOO ' + JSON.stringify(atendente))
  var emailAtendenteFromTransfer = document.getElementById('my-mail').innerText
  var emailAtendenteToTransfer = atendente.split('::')[0]
  var nameAtendente = atendente.split('::')[1]
  var perfilAtendente = atendente.split('::')[2].toLowerCase()

  var nameClient = document.getElementById("transfer-client-name").innerText
  var atendimentoId = document.getElementById("transfer-atendimentoId").innerText
  var phoneRobo = document.getElementById("transfer-roboNumber").innerText
  var phoneClient = document.getElementById("transfer-clientNumber").innerText

  console.log('emailAtendenteFromTransfer -> ' + emailAtendenteFromTransfer)
  console.log('emailAtendenteToTransfer -> ' + emailAtendenteToTransfer)
  console.log('nameAtendente -> ' + nameAtendente)
  console.log('perfilAtendente -> ' + perfilAtendente)
  console.log('atendimentoId -> ' + atendimentoId)
  console.log('phoneRobo -> ' + phoneRobo)
  console.log('phoneClient -> ' + phoneClient)

  var response = confirm(`Transferir o atendimento de ${nameClient} para o ${perfilAtendente} ${nameAtendente}?`);

  if (response){
    fetch(HOST+'/transfer-service', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        atendimentoId,
        emailAtendenteFromTransfer,
        emailAtendenteToTransfer,
        phoneClient,
        phoneRobo
        }),
    })
    .then(res => res.json())
    .then(data => {
      if(data.error){
        throw new Error(data.error)
      }
    })
    .catch(err => {
      showModalError(err.message)
    })
    location.reload()
  }
}

function showModalError(message){
  $('#messageToError').text(message)
  $('.frame-error').modal('show');
}
