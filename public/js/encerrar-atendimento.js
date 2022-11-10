function preparaEncerrarAtendimento(dataAtendimento){
  var clientName = dataAtendimento.split('::')[0]
  var atendimentoId = dataAtendimento.split('::')[1]

  document.getElementById('client-name').innerText = clientName
  document.getElementById('client-atendimento-id').innerText = atendimentoId
  $('#p-modal-encerrar-atendimento').text("Deseja encerrar o atendimento de " + clientName + "?")
}

function encerrarAtendimento(){
  const atendimentoId = document.getElementById("client-atendimento-id").innerText

  fetch(HOST+'/finish-atendimento', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ atendimentoId  }),
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

function showModalError(message){
  $('#messageToError').text(message)
  $('.frame-error').modal('show');
}
