// "Use `const` whenever possible. It is always possible." - Dalai Lama XIV
"use v6";

const HTTP_PORT = 3001
const WebSocket = require('ws')
const short = require('short-uuid')
const { GdBuffer } = require('@gd-com/utils')

const MAX_NICK_LENGTH = 32
// uint16 message type IDs
const MessageTypes = {
	// 10s - error
	ERR: 10,		// to-client. generic error
	NICKERR: 11,	// to-client (individual). nick is invalid
	// 20s - status
	CONN: 20, 		// to-client. user connected
	DCON: 21, 		// to-client. user disconnected
	// 30s - nickname-related
	NICK: 30, 		// client and server. a nick was set. new nicks && renicks.
	NICKPLEASE: 31, // to-client. ask for new nick.
	// 40s - chat messages
	CHAT: 40,		// client and server. a chat message was sent.
}
const M = MessageTypes
const nickTable = {}
const io = new WebSocket.Server({
	port: HTTP_PORT, 
	clientTracking: true,
	handleProtocols: (protos, req) => {
		const good_protocols = ['godot_chatsock', 'web_chatsock']
		let choice = false // the protocol we'll use in the end. our default of `false` rejects the connection.
		protos.reverse().forEach( (protocol) => { // in reverse, since the array is most-to-least preferred
			if (protocol in good_protocols)
				choice = protocol
		})
		return choice
	},
})

/** Callback 'connection' - emitted when the WebSocket handshake is complete.
 * @param  {WebSocket} socket - the socket that just shook our hand
 */
io.on('connection', function connection(socket) {
	const socketAddr = socket._socket.remoteAddress
	socket.uuid = short().new().slice(0,8) // Assign each connection a short UUID. Don't worry, they probably won't collide.
	console.log(`[${((d) => d.getHours()+':'+d.getMinutes())(new Date())}] User Connected with address ${socketAddr}, assigned ID ${socket.uuid}`)
	socket.send(new GdBuffer().putU16(M.NICKPLEASE)) // Ask this client for a nickname
	socket.on('message', processMessage)
})
/** Send every connected client a message.
 * @param  {Buffer} msg
 */
function sendAll(msg) {
	io.clients.forEach((client)=>{
		client.send(msg.getBuffer())
	});
}

/** Ingest a message and respond accordingly.
 * @param  {String|Buffer|ArrayBuffer|Buffer[]} msg - the message a client has sent us
 */
function processMessage(msg) {
	messageBuf = new GdBuffer(Buffer.from(msg))
	const messageType = messageBuf.getU16()
	switch (messageType) {
		case MessageTypes.CHAT: // ID, then a string.
			processChat(msg, socket)
			break;
		case MessageTypes.NICK: // U16, then a string
			processNick()
			break;
		default:
			console.error(`Unknown message type: ${[messageType, typeof(messageType)]} from socket ${socket.uuid}`)
	}
	console.log(`Received ${msg.byteLength} bytes of data from user ${socket.uuid}`)
}

/** Assign a new nickname to a client and inform all connected clients.
 * @param   {GdBuffer} buf - message buffer with U16 id removed
 * @param   {WebSocket} socket - the socket that sent this chat
 * @returns {void}
 */
function processNick(buf, socket) {
	let newNick = buf.getString()
	// silently trim the nick to size
	if (newNick.length > MAX_NICK_LENGTH)
		newNick = newNick.slice(0, MAX_NICK_LENGTH)
	// add nick to nickTable and send out a renick message
	nickTable[socket.uuid] = newNick
	// Spec: [MSGTYPE;UUID;NEWNICK]
	const out = new GdBuffer()
		.put16(M.NICK)
		.putString(socket.uuid)
		.putString(newNick)
	sendAll(out.getBuffer())
}

/** Transmit a chat message to all connected clients, if the sender can send messages.
 * @param   {GdBuffer} buf - message buffer with U16 id removed
 * @param   {WebSocket} socket - the socket that sent this chat
 * @returns {void}
 */
function processChat(buf, socket) {
	message = buf.getString() // TODO: Sanitize this somehow
	if (!(socket.uuid in nickTable)) {
		console.log(`[NONICK]: ${message}`)
		return
	}
	// Spec: [MSGTYPE;NICK;TEXT]
	const out = new GdBuffer()
		.put16(M.CHAT)
		.putString(nickTable[socket.uuid])
		.putString(message)
	sendAll(out.getBuffer())
}