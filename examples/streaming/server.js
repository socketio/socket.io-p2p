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
  socket.on('start-stream', function (data) {
    console.log('Stream started')
    socket.broadcast.emit('start-stream', data)
  })
})
