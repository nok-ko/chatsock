let express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')
const crypto = require('crypto')
// let vorpal = require('vorpal')()

let webpage = '<strong>yell at nokko if you see this!</strong>'

app.get('/', (req, res) => {
    res.send(webpage)
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
        console.log(callback)
        let oldNick = nicks[socket.id]
        
        let empty = '' ? !newNick : '(to empty string)'

        if (oldNick){
            console.log(`[INFO] ${socket.short} tries to re-nick from ${oldNick} to ${newNick}`, empty)
        } else {
            console.log(`[INFO] user ${socket.short} tries to nick to ${newNick}`)
        }

        if (newNick) { // not empty; more validation in the future
            nicks[socket.id] = newNick
            // TODO: find a better way to make sure client has this function
            // TODO: ask client for script checksum?? prevent caching somehow
            if (callback !== undefined) {
                callback(true) // your nick is okay
            }
            io.emit('new-nick', oldNick, newNick)
            console.log(`[INFO] ${socket.short} successfully (re)nicked`)
        } else {
            console.log(`[INFO] ${socket.short} (re)nick rejected: empty string`)
            if (callback !== undefined) {
                callback('Do not use empty nicks.') // bad nick
            }
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

    socket.on('checksum', (checksum, callback) => {
        if (checksum == script_checksum) { // Does the checksum match?
            callback(true) // All good!
        } else {
            callback(false) // Wah! (Reloads the client)
        }
    } )

})

http.listen(3001, () => {
    console.log('listening on port 3001')

    function getChecksum(str, algorithm, encoding) {
        return crypto
            .createHash(algorithm || 'md5')
            .update(str, 'utf8')
            .digest(encoding || 'hex')
    }

    // Send the webpage, but attach the script's checksum to the script reference in the page.
    // This makes the client load the script anew when we release an update.
    // (Of course, already-connected clients don't get this benefit.)
    // TODO: verify that reconnecting clients have the same client script version

    webpage = String(fs.readFileSync(__dirname + '/assets/index.html'))
    script_checksum = getChecksum(fs.readFileSync(__dirname + '/assets/script.js'))
    webpage = webpage.replace(/{{checksum}}/g, () => script_checksum)
})

// function sendGlobalServerChat(msg) {
//     console.log(`[CHAT]: op: ${msg}`)
//     io.emit('serverchat', msg)
// }

// TODO: Replace vorpal with commander.js