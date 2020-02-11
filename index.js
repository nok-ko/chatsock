let express = require('express')
let app = express()
let http = require('http').createServer(app)
let io = require('socket.io')(http)
// let vorpal = require('vorpal')()

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/index.html')
})

app.use(express.static('assets')) // Scripts, Stylesheets & Such.

nicks = {} // id -> nick
// technically this is bad because really it's socket->nick... gonna be using cookies!

io.on('connection', function(socket){
    socket.short = socket.id.slice(0,5) // short socket IDs, used in.. places.

    console.log(`[CONN] user ${socket.short} connected with IP: (${socket.handshake.address}) id: ${socket.id}`)
    
    // add an empty entry to the nick table
    nicks[socket.id] = ''
    
    // ask for nick
    socket.emit('nick-please')
    socket.emit('serverchat', 'Change nicknames like so: !nick <new nickname>')
    
    // Call a function on the client if the nick is gucci
    socket.on('new-nick', (newNick, callback) => {
        let oldNick = nicks[socket.id]
        
        let empty = '' ? newNick : '(to empty string)'

        if (oldNick){
            console.log(`[INFO] ${socket.short} tries to re-nick from ${oldNick} to ${newNick}`, empty)
        } else {
            console.log(`[INFO] user ${socket.short} tries to nick to ${newNick}`)
        }

        if (newNick) { // not empty; TODO: validate all the things
            nicks[socket.id] = newNick
            callback(true) // your nick is okay
            io.emit('new-nick', oldNick, newNick)
            console.log(`[INFO] ${socket.short} successfully (re)nicked`)
        } else {
            console.log(`[INFO] ${socket.short} (re)nick rejected: empty string`)
            callback('Do not use empty nicks.') // bad nick
            socket.emit('nick-please')
        }
    })
    
    socket.on('disconnect', function() {
        console.log(`[DCON] user id ${socket.id.slice(0,5)} disconnected`)
        delete nicks[socket.id] // cleanup nicks
    })

    socket.on('chat', function(msg){
        // only send messages that come from nicked users
        nick = nicks[socket.id]
        if (nick) {
            console.log(`[CHAT] ${nick}: ${msg}`)
            io.emit('chat', nick, msg) // re-emit, to everyone including sender
        
        // ask unnicked users for a nickname, log their crying
        } else {
            console.log(`[NONICK]: ${socket.short} ${msg}`)
            socket.emit('nick-please')
        }
    })
})

http.listen(3001, () => {
    console.log('listening on port 3001')
})

function sendGlobalServerChat(msg) {
    console.log(`[CHAT]: op: ${msg}`)
    io.emit('serverchat', msg)
}

// TODO: Replace vorpal with commander.js

// vorpal
//     .delimiter('op$')
//     .show()

// vorpal
//     .command('say <message>', 'Sends a `serverchat` to the connected clients.')
//     .action(function(args, callback) {
//         this.log(args)
//         io.emit('serverchat', args.message)
//         callback()
//     })

// vorpal
//     .mode('chat')
//     .description('Enters the user into a server op chat session.')
//     .delimiter('opchat:')
//     .action(function(command, callback) {
//         sendGlobalServerChat(command)
//         callback()
//     });
