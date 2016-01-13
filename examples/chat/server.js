var ecstatic = require('ecstatic')
var server = require('http').createServer(
  ecstatic({ root: __dirname, handleError: false })
)
var p2pserver = require('socket.io-p2p-server').Server
var io = require('socket.io')(server)

server.listen(3030, function () {
  console.log('Listening on 3030')
})

io.use(p2pserver)

io.on('connection', function (socket) {
  socket.on('peer-msg', function (data) {
    console.log('Message from peer: %s', data)
    socket.broadcast.emit('peer-msg', data)
  })

  socket.on('peer-file', function (data) {
    console.log('File from peer: %s', data)
    socket.broadcast.emit('peer-file', data)
  })

  socket.on('go-private', function (data) {
    socket.broadcast.emit('go-private', data)
  })
})
