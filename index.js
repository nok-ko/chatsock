let express = require('express')
let app = express()
let http = require('http').createServer(app)
let io = require('socket.io')(http)
let vorpal = require('vorpal')()

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/assets/index.html')
})

app.use(express.static('assets')) // Scripts, Stylesheets & Such.

nicks = {} // id -> nick
// technically this is bad because really it's socket->nick... gonna be using cookies!

io.on('connection', function(socket){
    vorpal.log('[CONN]', 'user connected with IP:', socket.handshake.address, 'id:', socket.id)
    
    // add an entry to the nick table
    nicks[socket.id] = ''
    
    // ask for nick
    socket.emit('nick-please')
    socket.emit('serverchat', 'Change nicknames like so: !nick <new nickname>')
    
    socket.on('new-nick', (newNick) => {
        let oldNick = nicks[socket.id]
        
        vorpal.log('[INFO]', socket.id, 'tries to re-nick from', oldNick, 'to', newNick)
        
        if (newNick) { // not empty; TODO: validate things
            nicks[socket.id] = newNick
            io.emit('new-nick', oldNick, newNick)
            vorpal.log('[INFO]', socket.id, 'successfully renicked')
        } else {
            socket.emit('nick-please')
        }
    })
    

    socket.on('disconnect', function() {
        vorpal.log(`[DCON] user id ${socket.id.slice(0,5)} disconnected`)
        delete nicks[socket.id] // cleanup nicks
    })
    socket.on('chat', function(msg){
        // only send messages that come from nicked users
        nick = nicks[socket.id]
        if (nick) {
            vorpal.log(`[CHAT] ${nick}: ${msg}`)
            io.emit('chat', nick, msg) // re-emit, to everyone including sender
        
        // ask unnicked users for a nickname, log their crying
        } else {
            vorpal.log(`[NONICK]: ${socket.id.slice(0,5)} ${msg}`)
            socket.emit('nick-please')
        }
    })
})

http.listen(3000, () => {
    vorpal.log('listening on port 3000')
})

function sendGlobalServerChat(msg) {
    vorpal.log(`[CHAT]: op: ${msg}`)
    io.emit('serverchat', msg)
}

vorpal
    .delimiter('op$')
    .show()

// vorpal
//     .command('say <message>', 'Sends a `serverchat` to the connected clients.')
//     .action(function(args, callback) {
//         this.log(args)
//         io.emit('serverchat', args.message)
//         callback()
//     })

vorpal
    .mode('chat')
    .description('Enters the user into a server op chat session.')
    .delimiter('opchat:')
    .action(function(command, callback) {
        sendGlobalServerChat(command)
        callback()
    });
