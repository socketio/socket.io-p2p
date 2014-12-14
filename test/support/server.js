// this is a test server to support tests which make requests
var io = require('socket.io');
var server = io(process.env.ZUUL_PORT);

server.on('connection', function(socket){
  // WebRTC setup
  socket.on('peer_signal', function(signallingData) {
    socket.broadcast.emit('peer_signal', signallingData); // send signalling to all but sender
  })

  socket.on('socket-obj', function(data) {
    socket.broadcast.emit('socket-obj', data)
  })
});
