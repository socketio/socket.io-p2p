# socketio-p2p

This module provides a simple way to setup a WebRTC connection between peers and communicate using the [socket.io-protocol](https://github.com/Automattic/socket.io-protocol). It's build on top of [simple-peer](https://github.com/feross/simple-peer) and uses socket.io to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling) in the background - you do not have to handle the process. Socket.io is used as the default transport and the connection can be upgraded to use PeerConnection in clients that support WebRTC by setting `useSockets` to `false`.

## How to use

Create a socket connection, pass it to Socketiop2p. On the Client: 

```
var Socketiop2p = require('socket.io-p2p');
var io = require('socket.io-client');
var connectionUrl = '/chat';
var peerOpts = {};

var manager = io.Manager();
var socket = manager.socket(connectionUrl)
var p2psocket = new Socketiop2p(peerOpts, socket);

p2psocket.on('ready', function() {
  console.log("socketp2p ready");
  p2psocket.emit('peer-obj', 'Hello there. I am ' + p2psocket.peerId)
});

// This event will be triggered over socket transport until `useSockets` is set to `false`
p2psocket.on('peer-msg', function(data) {
  console.log(data);
});

// Send a signal to peers to and set useSocket to false to switch to WebRTC transport
p2psocket.on('go-private', function() {
  p2psocket.useSockets = false;
});

```

And on the server

```
var server = require('http').createServer());
var io = require('socket.io')(server);

server.listen(3030, function() {
  console.log("Listening on 3030");
});

var clients = [];

io.on('connection', function(socket) {

  // Start of signal handling - required to get clients PeerConnected

  // Tell the new client how many other clients there are
  socket.emit('numClients', Object.keys(clients).length)
  socket.broadcast.emit('connected_peer', socket.id)

  // Add the new client to client list
  clients[socket.id] = socket;
  socket.on('disconnect', function() {
    delete clients[socket.id]
    console.info('Client gone (id=' + socket.id + ').');
  });

  // Take signalling offers from a newly connected client and pass to the pool
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
  // End of signal handling

  socket.on('peer-msg', function(data) {
    console.log("peer msg");
    socket.broadcast.emit('peer-msg', data);
  })

  socket.on('go-private', function(data) {
    socket.broadcast.emit('go-private', data);
  })
});

```

## Roadmap of development

- Support for packets contining multiple binary blobs - packets can only contain one blob in this version
- Allow a peer to act as a relay between peers that don't support PeerConnection and those that do.

## Completed roadmap tasks

- Add socketio protocol API, packets etc
- Support and testing for sending binary data
- Fallback connection to socket.io if PeerConnection is not available
