// this is a test server to support tests which make requests
var io = require('socket.io');
var server = io(process.env.ZUUL_PORT);
var chatClients = [];
var interClients = [];

console.log(process.env.ZUUL_PORT);

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
    console.info('Client gone (id=' + socket.id + ').');
    console.log(Object.keys(chatClients).length);
  });

  socket.on('offers', function(data) {
    console.log('chatClients '+Object.keys(chatClients).length);
    console.log('offers '+data.offers.length);
    Object.keys(chatClients).forEach(function(clientId, i) {
      var client = chatClients[clientId];
      if (client !== socket) {
        var offerObj = data.offers[i];
        client.emit('offer', {fromPeerId: socket.id, offerId: offerObj.offerId, offer: offerObj.offer});
      }
    });
  })

  // TODO rename this peer_signal
  socket.on('signal', function(data) {
    var toPeerId = data.toPeerId;
    var client = chatClients[toPeerId];
    client.emit('signal', data)
  });

  // Old Events. TODO: REMOVE
  // WebRTC setup
  socket.on('peer_signal', function(signallingData) {
    socket.broadcast.emit('peer_signal', signallingData); // send signalling to all but sender
  })

  socket.on('socket-obj', function(data) {
    socket.broadcast.emit('socket-obj', data)
  })

  // Distribute the peer ids among the other clients
  socket.on('new_peer', function(data) {
    socket.broadcast.emit('new_peer', data);
  })
});

var rootSpace = server
.of('/inter')
.on('connection', function(socket) { 
  console.log("Connected client");
  // Tell the new client how many other clients there are
  console.log('Num clinets '+Object.keys(interClients).length);
  socket.emit('numClients', Object.keys(interClients).length)

  // Add new client to client list
  interClients[socket.id] = socket;
  socket.on('disconnect', function() {
    delete interClients[socket.id]
    console.info('Client gone (id=' + socket.id + ').');
    console.log(Object.keys(interClients).length);
  });

  socket.on('offers', function(data) {
    console.log('interClients '+Object.keys(interClients).length);
    console.log('offers '+data.offers.length);
    Object.keys(interClients).forEach(function(clientId, i) {
      var client = interClients[clientId];
      if (client !== socket) {
        var offerObj = data.offers[i];
        client.emit('offer', {fromPeerId: socket.id, offerId: offerObj.offerId, offer: offerObj.offer});
      }
    });
  })

  // TODO rename this peer_signal
  socket.on('signal', function(data) {
    var toPeerId = data.toPeerId;
    var client = interClients[toPeerId];
    client.emit('signal', data)
  });

  // Old Events. TODO: REMOVE

  // WebRTC setup
  socket.on('peer_signal', function(signallingData) {
    socket.broadcast.emit('peer_signal', signallingData); // send signalling to all but sender
  })

  socket.on('socket-obj', function(data) {
    socket.broadcast.emit('socket-obj', data)
  })

  // Distribute the peer ids among the other clients
  socket.on('new_peer', function(data) {
    socket.broadcast.emit('new_peer', data);
  })
});
