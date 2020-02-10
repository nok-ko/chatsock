let socket = io() 

document.querySelector('form').addEventListener('submit', function(e){
    e.preventDefault();    //stop form from submitting
    msg = document.querySelector('#m').value
    
    if (msg.startsWith('!')){
        parseCommand(msg)
    } else {
        socket.emit('chat', msg)
        console.log('chat:', msg)   
    }
    
    // clear the field (too early?)
    clearMbox()
})

function renick(args) {
    newNick = args.join(' ')
    console.log('renicking to', newNick)
    socket.emit('new-nick', newNick)
}


function parseCommand(msg) {
//    console.log('parsing command', msg)
    const commands = {
        'nick': renick
    }
    let args = msg.slice(1).split(' ')
    console.log(args[0], args[0] in commands)
    if (args[0] in commands){
        
        commands[args[0]](args.slice(1))
    }
    
}

function genericChat(nick, msg, isSuper) {
    let msgNode = document.createElement('li')
    let shouldScroll = false
    const mBox = document.querySelector('#messages')

    if (nick) {
        let nickNode = document.createElement('strong')
        nickNode.innerText = nick
        msgNode.appendChild(nickNode).classList.add('nick')
    }
    
    let textNode = document.createElement('span')
    textNode.innerText = msg
    
    if (isSuper) {
        textNode.classList.add('superchat')
    }
    
    msgNode.appendChild(textNode)
    
    // check if we're scrolled to the bottom
    if (mBox.scrollHeight - mBox.clientHeight <= mBox.scrollTop + 1)
        shouldScroll = true
    
    mBox.appendChild(msgNode)
    
    if (shouldScroll)
        msgNode.scrollIntoView()
}

const serverChat = (msg) => { console.log('sChat:', msg); genericChat('', msg, true) }
const userChat = (nick, msg) => { console.log('uChat:', msg); genericChat(nick, msg, false) }


socket.on('chat', userChat)

socket.on('serverchat', serverChat)


socket.on('connection', (connect) => {
    console.log(connect)
});

socket.on('new-nick', (oldNick, newNick) => {
    console.log('new-nick')
    console.log(oldNick, 'renicked to', newNick)
    if (oldNick) {
        serverChat(`${oldNick} has renicked to ${newNick}.`)
    } else {
        serverChat(`${newNick} has joined the chat!`)
    }
})

socket.on('nick-please', () => {
    console.log('asked for nick')
    let newNick = ''
    while (!newNick) {
        newNick = prompt('Please enter a new nickname!', 'Somebody')
    }
    
    socket.emit('new-nick', newNick)
    console.log('sent new nick', newNick)
})

function clearMbox() {
    document.querySelector('#m').value = '' // There may be a bug here.
}