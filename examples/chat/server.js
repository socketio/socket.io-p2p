var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3030, function() {
  console.log("Listening on 3030");
});
var clients = [];

app.use(express.static(__dirname));

io.on('connection', function(socket) {

  // Tell the new client how many other clients there are
  socket.emit('numClients', Object.keys(clients).length)
  socket.broadcast.emit('connected_peer', socket.id)

  // Add new client to client list
  clients[socket.id] = socket;
  socket.on('disconnect', function() {
    delete clients[socket.id]
    console.info('Client gone (id=' + socket.id + ').');
  });

  socket.on('offers', function(data) {
    Object.keys(clients).forEach(function(clientId, i) {
      var client = clients[clientId];
      if (client !== socket) {
        var offerObj = data.offers[i];
        client.emit('offer', {fromPeerId: socket.id, offerId: offerObj.offerId, offer: offerObj.offer});
      }
    });
  })

  socket.on('peer-signal', function(data) {
    var toPeerId = data.toPeerId;
    var client = clients[toPeerId];
    client.emit('peer-signal', data)
  });

  socket.on('peer-msg', function(data) {
    console.log("peer msg");
    socket.broadcast.emit('peer-msg', data);
  })

  socket.on('go-private', function(data) {
    socket.broadcast.emit('go-private', data);
  })
});
