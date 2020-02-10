// "Use `const` whenever possible. It is always possible."
// - Simon Peyton Jones
const socket = io() 

// Listen for message box submissions:
document.querySelector('form').addEventListener('submit', function(e){
	e.preventDefault();    // Stop form from "actually" submitting
	msg = document.querySelector('#m').value
	
	// Either do command stuff on the clientside before doing whatever is needed from the command,
	// *or* just send a `chat` event to the server
	if (msg.startsWith('!')){
		parseCommand(msg)
	} else {
		socket.emit('chat', msg)
		console.log('chat:', msg)   
	}

	clearMbox()
})
// Clear the message box. (That is, the field where you type a message to send.)
function clearMbox() {
	document.querySelector('#m').value = '' // There may be a bug here.
}

/**
 * Parse a command message and call the appropriate command function.
 * @param  {String} msg - A command message, starting with an exclamation point.
 */
function parseCommand(msg) {
	// #region Commands that are later referenced in `commands` object:
	
	function renick(args) {
		newNick = args.join(' ') // we gotta send a string, not an array
		console.log('renicking to', newNick)
		socket.emit('new-nick', newNick)
	}
	
	// #endregion

	const commands = {
		'nick': renick,
		'renick': renick, // aliases, eh
	}
	let args = msg.slice(1).split(' ')
	console.log(args[0], args[0] in commands)
	if (args[0] in commands){
		commands[args[0]](args.slice(1))
	}
}

// #region CHAT STUFF

// TODO: possibly rename this function
/**
 * Generic chat display function. 
 * This *displays* information from the server in the messagebox, it does not send chat messages.
 * @param  {String} nick - the nick sending this message
 * @param  {String} msg - the message
 * @param  {Boolean} isSuper - whether the message should be rendered with the 'superchat' CSS class
 */
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
	textNode.classList.add('msg')
	textNode.innerText = msg
	
	if (isSuper)
		textNode.classList.add('superchat')
	
	msgNode.appendChild(textNode)
	
	// check if we're scrolled to the bottom
	if (mBox.scrollHeight - mBox.clientHeight <= mBox.scrollTop + 1)
		shouldScroll = true
	
	mBox.appendChild(msgNode)
	
	if (shouldScroll)
		msgNode.scrollIntoView()
}


// serverChat uses an empty nick, the server is eternal & has no name
const serverChat = (msg) => { console.log('sChat:', msg); genericChat('', msg, true) }
// userChat uses the nick of the recipient
const userChat = (nick, msg) => { console.log('uChat:', msg); genericChat(nick, msg, false) }

// A chat message arrives
socket.on('chat', userChat)
// A chat message from the server arrives (visible to everyone OR to just us)
socket.on('serverchat', serverChat)

// #endregion CHAT STUFF

// We make a connection.
socket.on('connection', (connect) => {
	console.log(connect)
});

// Someone's nick updates. If oldNick is '' (i.e. falsy), it's a new user joining
socket.on('new-nick', (oldNick, newNick) => {
	console.log('new-nick')
	console.log(oldNick, 'renicked to', newNick)
	if (oldNick) {
		serverChat(`${oldNick} has renicked to ${newNick}.`)
	} else {
		serverChat(`${newNick} has joined the chat!`)
	}
})

// Server asks us to provide a nickname. 
// Happens on first join and possibly on admin discretion.
socket.on('nick-please', () => {
	console.log('asked for nick')
	let newNick = ''
	while (!newNick) {
		newNick = prompt('Please enter a new nickname!', 'Somebody')
	}
	
	socket.emit('new-nick', newNick)
	console.log('sent new nick', newNick)
})