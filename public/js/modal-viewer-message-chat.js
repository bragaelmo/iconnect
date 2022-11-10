const chatBodySupervisor = document.getElementById('chatBodySupervisor');

function showModalViewerChatMessages(atendimentoId){
  document.getElementById('chatBodySupervisor').innerHTML = ''
  if(!atendimentoId || atendimentoId == ''){
    return
  }

  fetch(HOST+'/wpp/message-chat-client', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({atendimento_id: atendimentoId}),
  })
  .then(res => res.json())
  .then(data => {
    if(data.error){
      throw new Error(data.error)
    }
    console.log(JSON.stringify(data))
    renderMessagesInChat(data);
  })
  .catch(err => {
    showModalError(err.message)
  })

  // Scroll to message more recent after 500ms
  setTimeout(()=>{
    console.log('SCROLLLLL ??? ' + chatBodySupervisor.scrollHeight)
    chatBodySupervisor.scrollTop = chatBodySupervisor.scrollHeight;
  }, 2000)
}

function renderMessagesInChat(arr){
  // Apaga as mensagens em aberto do chat

  var nameClient = ''
  var phoneClient = ''
  var statusClient = ''
  var atendimentoId = ''
  var roboNumber = ''

  for(item of arr){
    const dateHourBr = new Date(item.created_at)
    item.timeMsg  = dateHourBr.toLocaleString().replace(',', '').slice(0, -3).replace('/', '-').replace('/', '-')

    if(item.perfil == 'CLIENTE'){
      messageClient(item)
      nameClient = item.name
      statusClient = item.status
      phoneClient = item.from_wa_id
      roboNumber= item.to_wa
      document.getElementById('view-messages-chat').innerText = nameClient
    }

    if(item.perfil == 'ATENDENTE'){
      messageAtendente(item)
    }
  }
}

function messageClient(obj){
  chatBodySupervisor.insertAdjacentHTML("beforeend",`
       <li class="mb-3 d-flex flex-row align-items-end" id="messageOpen">
           <div class="mw-70">
               <div class="user-info mb-1">
                   <span class="text-muted small">
                       <br> ${obj.name}:
                   </span>
               </div>
               <div class="card p-3" style="max-width: 250px;">
                   <div class="message"><p>${obj.body}</p> <p class="dateHourChat"> ${obj.timeMsg} </p></div>
               </div>
           </div>
       </li>`
   )
}

function messageAtendente(obj){
  chatBodySupervisor.insertAdjacentHTML("beforeend",`
     <li class="mb-3 d-flex flex-row justify-content-end" id="messageOpen">
         <div class="max-width-70">
             <div class="user-info mb-1">
                 <span class="text-muted small">
                 <br>Robo Zenvia:</span>
             </div>
             <div class="card p-3" style="max-width: 250px;">
                 <div class="message"><p>${obj.body}</p> <p class="dateHourChat"> ${obj.timeMsg} </p></div>
             </div>
         </div>
   </li>`)
}

function showModalError(message){
  $('#messageToError').text(message)
  $('.frame-error').modal('show');
}
