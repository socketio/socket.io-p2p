// this is a test server to support tests which make requests
var io = require('socket.io');
var server = io(process.env.ZUUL_PORT);
var chatClients = [];
var interClients = [];

var chat = server
.of('/chat')
.on('connection', function(socket) {

  // Tell the new client how many other clients there are
  socket.emit('numClients', Object.keys(chatClients).length)
  socket.broadcast.emit('connected_peer', socket.id)

  // Add new client to client list
  chatClients[socket.id] = socket;
  socket.on('disconnect', function() {
    delete chatClients[socket.id]
  });

  socket.on('offers', function(data) {
    Object.keys(chatClients).forEach(function(clientId, i) {
      var client = chatClients[clientId];
      if (client !== socket) {
        var offerObj = data.offers[i];
        client.emit('offer', {fromPeerId: socket.id, offerId: offerObj.offerId, offer: offerObj.offer});
      }
    });
  })

  socket.on('peer-signal', function(data) {
    var toPeerId = data.toPeerId;
    var client = chatClients[toPeerId];
    client.emit('peer-signal', data)
  });

  socket.on('socket-obj', function(data) {
    socket.broadcast.emit('socket-obj', data)
  })
});

var rootSpace = server
.of('/inter')
.on('connection', function(socket) {
  // Tell the new client how many other clients there are
  socket.emit('numClients', Object.keys(interClients).length)

  // Add new client to client list
  interClients[socket.id] = socket;
  socket.on('disconnect', function() {
    delete interClients[socket.id]
  });

  socket.on('offers', function(data) {
    Object.keys(interClients).forEach(function(clientId, i) {
      var client = interClients[clientId];
      if (client !== socket) {
        var offerObj = data.offers[i];
        client.emit('offer', {fromPeerId: socket.id, offerId: offerObj.offerId, offer: offerObj.offer});
      }
    });
  })

  socket.on('peer-signal', function(data) {
    var toPeerId = data.toPeerId;
    var client = interClients[toPeerId];
    client.emit('peer-signal', data)
  });

  socket.on('socket-obj', function(data) {
    socket.broadcast.emit('socket-obj', data)
  })
});
