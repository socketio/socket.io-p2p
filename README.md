Socket.io-p2p
=============

This module provides a simple way to setup a WebRTC connection between peers and communicate using the [socket.io-protocol](https://github.com/Automattic/socket.io-protocol). It's build on top of [simple-peer](https://github.com/feross/simple-peer) and uses socket.io to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling) in the background - you do not have to handle the process. Socket.io is used as the default transport and the connection can be upgraded to use PeerConnection in clients that support WebRTC by setting `useSockets` to `false`.

## How to use

Create a socket connection, pass it to Socketiop2p. On the Client:

```
var Socketiop2p = require('socket.io-p2p')
var io = require('socket.io-client')
var connectionPath = '/'
var peerOpts = {}

var manager = io.Manager();
var socket = manager.socket(connectionUrl)
var p2psocket = new Socketiop2p(peerOpts, socket)

p2psocket.on('ready', function() {
  console.log("socketp2p ready")
  p2psocket.emit('peer-obj', 'Hello there. I am ' + p2psocket.peerId)
})

// This event will be triggered over socket transport until `useSockets` is set to `false`
p2psocket.on('peer-msg', function(data) {
  console.log(data)
})

// Send a signal to peers to and set useSocket to false to switch to WebRTC transport
p2psocket.on('go-private', function() {
  p2psocket.useSockets = false
})

```

On server, use the [socket.io-p2p-server](https://github.com/tomcartwrightuk/socket.io-p2p-server) to take care of all your signalling needs.

```
var server = require('http').createServer()
var io = require('socket.io')(server)
var p2pserver = require('socket.io-p2p-server').Server
io.use(p2pserver)

server.listen(3030, function() {
  console.log("Listening on 3030");
});

io.on('connection', function(socket) {
  // You could add an event to tell all clients to switch to a WebRTC peer connection.

  socket.on('go-private', function(data) {
    socket.broadcast.emit('go-private', data)
  })
})

```

## Roadmap of development

- Support for packets containing multiple binary blobs - packets can only contain one blob in this version
- Allow a peer to act as a relay between peers that don't support PeerConnection and those that do.

## Completed roadmap tasks

- Add socketio protocol API, packets etc
- Support and testing for sending binary data
- Fallback connection to socket.io if PeerConnection is not available
