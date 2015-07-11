// this is a test server to support tests which make requests
var p2pserver = require('socket.io-p2p-server').Server
var io = require('socket.io')
var server = io(process.env.ZUUL_PORT)

server.of('/inter')
.use(p2pserver)
.on('connection', function (socket) {
  socket.on('socket-obj', function (data) {
    socket.broadcast.emit('socket-obj', data)
  })
})

server.of('/array')
.use(p2pserver)

server.of('/multi')
.use(p2pserver)

server.of('/blob')
.use(p2pserver)

server.of('/cb')
.use(p2pserver)
