startListClients()
var quantidadeEmEspera = 0
function startListClients(){
  const HOST = document.getElementById('my-host').innerText
  //$('.msg').fadeOut(600, function(){ $(this).remove();});
  const email = document.getElementById('my-mail').innerText
  fetch(HOST+'/monitor-atendimentos', {
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
    console.log( ' MONITORANDODDODODODODO ' + JSON.stringify(data))
  })
  .catch(err => {
    showModalError(err.message)
  })
}


function showModalError(message){
  $('#messageToError').text(message)
  $('.frame-error').modal('show');
}
