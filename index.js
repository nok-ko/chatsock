// "Use `const` whenever possible. It is always possible." - Dalai Lama XIV

const HTTP_PORT = 3001
const WebSocket = require('ws')
const { GdBuffer } = require('@gd-com/utils')

const MessageTypes = {
	CHAT: 40,
}

const io = new WebSocket.Server({ 
	port: HTTP_PORT, 
	clientTracking: true,
	handleProtocols: (protos, req) => {
		const good_protocols = ['godot_chatsock', 'web_chatsock']
		let choice = false // the protocol we'll use in the end. our default of `false` rejects the connection.
		protos.reverse().forEach( (protocol) => { // go in reverse, since the array is supposed to be most-to-least liked
			if (protocol in good_protocols) {
				choice = protocol
			}
		})
		// choice should be the first good protocol given, or `false`
		// if we were given no good (accepted protocols)
		return choice
	},

})

/** Callback 'connection' - emitted when the WebSocket handshake is complete.
 * @param  {WebSocket} socket - the socket that just shook our hand
 */
io.on('connection', function connection(socket) {
	const socketAddr = socket._socket.remoteAddress.replace("::ffff:","")
	console.log('User Connected: ' + socketAddr + " - " + new Date())
	socket.on('message', (message) => {
		messageBuf = new GdBuffer(Buffer.from(message))

		

		const messageType = messageBuf.getU16()

		switch (messageType) {
			case MessageTypes.CHAT: // U16, and then a string.
				const text = messageBuf.getString()
				console.log(`User ${socketAddr} -> CHAT: ${text}`)
				handleChat(text)
				break;
			default:
				console.error(`Unknown message type: ${[messageType, typeof(messageType)]} from socket ${socketAddr}`)
		}
		console.log(`Received ${message.byteLength} bytes of data from user ${socketAddr}`)
	})
})

/**
 * @param  {String} message - the chat message just sent
 */
function handleChat(message) {
	// Validation bullshit goes here

	// Validation bullshit ends here

	// Message from the server = CHAT;NICK;TEXT
	const buffer = new GdBuffer()
	buffer.put16(MessageTypes.CHAT)
	buffer.putString('nokko') // FIXME hardcoded nick
	buffer.putString(message)

	io.clients.forEach((client)=>{
		client.send(buffer.getBuffer())
	});
}

// // Constants and all that junk.


// let express = require('express')
// const app = express()
// const http = require('http').createServer(app)
// // const io = require('socket.io')(http)
// const websocket = require('websocket').server
// const fs = require('fs')
// const crypto = require('crypto')
// // let vorpal = require('vorpal')()

// let webpage = '<strong>This page left unintentionally blank. Please yell at nokko.</strong>'

// app.get('/', (req, res) => {
//     res.send(webpage)
// })

// app.use(express.static('assets')) // Scripts, Stylesheets & Such.

// nicks = {} // id -> nick
// // technically this is bad because really it's socket->nick... gonna be using cookies!

// // io.on('connection', function(socket){
// //     socket.short = socket.id.slice(0,5) // short socket IDs, used in.. places.

// //     console.log(`[CONN] user ${socket.short} connected with IP: (${socket.handshake.address}) id: ${socket.id}`)
	
// //     // add an empty entry to the nick table
// //     nicks[socket.id] = ''
	
// //     // ask for nick
// //     socket.emit('nick-please')
// //     socket.emit('serverchat', 'Change nicknames like so: !nick <new nickname>')
	
// //     // Call a function on the client if the nick is gucci
// //     socket.on('new-nick', (newNick, callback) => {
// //         console.log(callback)
// //         let oldNick = nicks[socket.id]
		
// //         let empty = '' ? !newNick : '(to empty string)'

// //         if (oldNick){
// //             console.log(`[INFO] ${socket.short} tries to re-nick from ${oldNick} to ${newNick}`, empty)
// //         } else {
// //             console.log(`[INFO] user ${socket.short} tries to nick to ${newNick}`)
// //         }

// //         if (newNick) { // not empty; more validation in the future
// //             nicks[socket.id] = newNick
// //             // TODO: find a better way to make sure client has this function
// //             // TODO: ask client for script checksum?? prevent caching somehow
// //             if (callback !== undefined) {
// //                 callback(true) // your nick is okay
// //             }
// //             io.emit('new-nick', oldNick, newNick)
// //             console.log(`[INFO] ${socket.short} successfully (re)nicked`)
// //         } else {
// //             console.log(`[INFO] ${socket.short} (re)nick rejected: empty string`)
// //             if (callback !== undefined) {
// //                 callback('Do not use empty nicks.') // bad nick
// //             }
// //             socket.emit('nick-please')
// //         }
// //     })
	
// //     socket.on('disconnect', function() {
// //         console.log(`[DCON] user id ${socket.id.slice(0,5)} disconnected`)
// //         delete nicks[socket.id] // cleanup nicks
// //     })

// //     socket.on('chat', function(msg){
// //         // only send messages that come from nicked users
// //         nick = nicks[socket.id]
// //         if (nick) {
// //             console.log(`[CHAT] ${nick}: ${msg}`)
// //             io.emit('chat', nick, msg) // re-emit, to everyone including sender
		
// //         // ask unnicked users for a nickname, log their crying
// //         } else {
// //             console.log(`[NONICK]: ${socket.short} ${msg}`)
// //             socket.emit('nick-please')
// //         }
// //     })

// //     socket.on('checksum', (checksum, callback) => {
// //         if (checksum == script_checksum) { // Does the checksum match?
// //             callback(true) // All good!
// //         } else {
// //             callback(false) // Wah! (Reloads the client)
// //         }
// //     } )

// // })

// http.listen(HTTP_PORT, () => {
//     console.log('listening on port', HTTP_PORT)

//     function getChecksum(str, algorithm, encoding) {
//         return crypto
//             .createHash(algorithm || 'md5')
//             .update(str, 'utf8')
//             .digest(encoding || 'hex')
//     }

//     // Send the webpage, but attach the script's checksum to the script reference in the page.
//     // This makes the client load the script anew when we release an update.
//     // (Of course, already-connected clients don't get this benefit.)
//     // TODO: verify that reconnecting clients have the same client script version

//     webpage = String(fs.readFileSync(__dirname + '/assets/index.html'))
//     script_checksum = getChecksum(fs.readFileSync(__dirname + '/assets/script.js'))
//     webpage = webpage.replace(/{{checksum}}/g, () => script_checksum)
// })

// const io = new websocket({
//     httpServer: http,
//     autoAcceptConnections: false
// });

// function originIsAllowed(origin) {
//     // put logic here to detect whether the specified origin is allowed.
//     return true;
// }

// io.on('request', function(request) {
//     if (!originIsAllowed(request.origin)) {
//       // Make sure we only accept requests from an allowed origin
//       request.reject();
//       console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
//       return;
//     }
	
//     var connection = request.accept('echo-protocol', request.origin);
//     console.log((new Date()) + ' Connection accepted.');
//     connection.on('message', function(message) {
//         if (message.type === 'utf8') {
//             console.log('Received Message: ' + message.utf8Data);
//             connection.sendUTF(message.utf8Data);
//         }
//         else if (message.type === 'binary') {
//             console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
//             connection.sendBytes(message.binaryData);
//         }
//     });
//     connection.on('close', function(reasonCode, description) {
//         console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
//     });
// });