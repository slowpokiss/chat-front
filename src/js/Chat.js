import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.websocket = null;
  }

  init() {
    //this.bindToDOM();
    this.user = undefined;
    this.container.innerHTML = '';
    this.openModal();
  }

  bindToDOM() {
    this.chatContainer = document.createElement('div');
    this.chatContainer.classList.add('container');
    this.chatContainer.innerHTML = `<div class="chat__header">Добро пожаловать в чат</div>
    <button type="button" class="chat__connect">Выйти</button>
    <div class="chat__container">
    <div class="chat__userlist"></div>
      <div class="chat__area">
        <div class="chat__messages-container">

          <div class="message__container">
            <div class="message__container-yourself">
              <div class="message__header">some header_1</div>
              Hello from me
            </div>
          </div>

          <div class="message__container">
            <div class="message__container-interlocutor">
              <div class="message__header">some header_2</div>
              Answer from interlocutor
            </div>
          </div>

          <div class="message__container">
          <div class="message__container-interlocutor">
            <div class="message__header">some header_2</div>
            Answer from interlocutor
          </div>
          </div>

          <div class="message__container">
            <div class="message__container-yourself">
              <div class="message__header">some header_1</div>
              Hello from me
            </div>
          </div>
        </div>

        <form class="form">
          <input class="form__input" placeholder="type your messages here">
        </form>
      </div>
    </div>`;

    this.container.append(this.chatContainer);


    this.modalForm = document.querySelector('.form')
    this.outChat = document.querySelector('.chat__connect')
    this.userList = document.querySelector('.chat__userlist')

    this.modalForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      console.log(this.modalForm.checkValidity())
      this.sendMessage(document.querySelector('.form__input').value)
      document.querySelector('.form__input').value = '';
    })

    this.outChat.addEventListener('click',(ev) => {
      ev.preventDefault();
      this.websocket.send(JSON.stringify({type: 'exit', user: {name: this.user}}))
      this.user = undefined;
      this.websocket.close();
      this.init();
    })
  }

  openModal() {
    this.modal = document.createElement('div');
    this.modal.classList.add('modal__background');
    this.modal.insertAdjacentHTML('beforeend', `
    <div class="modal__content">
      <h2 class="modal__header">Выберите псевдоним</h2>
      <div class="modal__body">
        <form class="form__group">
          <input class="form__input">
            <button type="submit" class="modal__ok">Отправить</button>
        </form>
      </div>
    </div>`)

    this.container.append(this.modal);
    this.modalForm = root.querySelector('.form__group');
    this.modalFormInput = this.modal.querySelector('.form__input');
    
    this.modalForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      this.onEnterChatHandler();
    })
  }

  closeModal() {
    this.modalFormInput.value = ''
    this.modal.remove();
  }

  msgTemplate(data, userType) {
    const iso = data.message.time;
    const date = new Date(iso)
    const formattedTime = `${(date.getHours() < 10 ? '0' : '')}${date.getHours()}:${(date.getMinutes() < 10 ? '0' : '')}${date.getMinutes()}`;
    const formattedDate = `${date.getFullYear()}.${(date.getMonth() + 1 < 10 ? '0' : '')}${date.getMonth() + 1}.${(date.getDate() < 10 ? '0' : '')}${date.getDate()}`
    const formatted = `${formattedTime} ${formattedDate}`

    if (userType === 'you') {
      return `
      <div class="message__container">
        <div class="message__container-yourself">
          <div class="message__header">${formatted}</div>
          ${data.message.text}
        </div>
      </div>`
    } if (userType === 'locutor') {
      return `
      <div class="message__container">
        <div class="message__container-interlocutor">
        <div class="message__header">${formatted}</div>
        ${data.message.text}
        </div>
      </div>
      `
    }
  }

  registerEvents() {}

  subscribeOnEvents() {
    this.websocket = new WebSocket('ws://localhost:3000/ws')

    this.websocket.addEventListener('open', (ev) => {
      console.log(ev)
    })

    this.websocket.addEventListener('close', (ev) => {
      console.log(ev)
    })

    this.websocket.addEventListener('error', (ev) => {
      console.log(ev)
    })

    this.websocket.addEventListener('message', (ev) => {
      const receivedMSG = JSON.parse(ev.data);

      if (receivedMSG.type === 'send') {
        this.renderMessage(receivedMSG);
      }

      console.log(JSON.parse(ev.data))
      if (receivedMSG.length > 0) {
        this.userList.innerHTML = ''
        receivedMSG.forEach(el => {
          if (this.user && el.name !== this.user.name) {
            this.userList.insertAdjacentHTML('beforeend', `<div class="chat__user">${el.name}</div>`)
          } else {
            this.userList.insertAdjacentHTML('beforeend', `<div class="chat__user">YOU</div>`)
          }
        });
      }
    })
  }

  onEnterChatHandler() {
    if (!this.modalFormInput.value.trim()) {
      return
    }

    const userName = {name: this.modalFormInput.value.trim()}
    fetch(`http://localhost:3000/new-user`,{
      method: 'POST',
      body: JSON.stringify(userName),
    })
    .then((response) => {
      if (response.status === 200) {
        this.bindToDOM();
        this.closeModal();
        this.subscribeOnEvents();
        this.user = userName;
      }
      if (response.status === 400 || response.status === 409) {
        alert('please take another username')
      }
    })
  }

  sendMessage(text) {
    this.websocket.send(JSON.stringify({ 
      type: 'send',
      message: { text: text, time: new Date()},
      name: this.user,
    }))
  }

  renderMessage(data) {
    document.querySelector('.chat__messages-container').insertAdjacentHTML('beforeend' ,this.msgTemplate(data, 'you'));
  }
}