Socket.io-p2p
=============

This module provides a simple way to setup a WebRTC connection between peers and communicate using the [socket.io-protocol](https://github.com/Automattic/socket.io-protocol). It's uses socket.io to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling) in the background - connections are easy to establish. Socket.io is used as the default transport and the connection can be upgraded to use PeerConnection in clients that support WebRTC by setting `useSockets` to `false`.

## How to use

Create a socket connection, pass it to Socketiop2p. On the Client:

```
var Socketiop2p = require('socket.io-p2p')
var io = require('socket.io-client')
var socket = io()

var p2psocket = new Socketiop2p({}, socket)

p2psocket.on('ready', function() {
  p2psocket.useSockets = false
  p2psocket.emit('peer-obj', {peerId: peerId})
})

// This event will be triggered over socket transport until `useSockets` is set to `false`
p2psocket.on('peer-msg', function(data) {
  console.log(data)
})

```

On server, use the [socket.io-p2p-server](https://github.com/tomcartwrightuk/socket.io-p2p-server) to take care of signalling. All clients who support WebRTC data connections will exchange signalling data via the default `/` namespace.

```
var server = require('http').createServer()
var io = require('socket.io')(server)
var p2pserver = require('socket.io-p2p-server').Server
io.use(p2pserver)

server.listen(3030)

```

WebRTC Peer connections can also be established by exchanging signalling data witin a socket.io room. Do this by calling the `p2pserver` within the `connection` callback:

```

var server = require('http').createServer()
var io = require('socket.io')(server)
var p2pserver = require('socket.io-p2p-server').Server

server.listen(3030)

io.on('connection', function(socket) {
  clients[socket.id] = socket
  socket.join(roomName)
  p2pserver(socket, null, room)
})


```

## Roadmap of development

- Support for packets containing multiple binary blobs - packets can only contain one blob in this version
- Allow a peer to act as a relay between peers that don't support PeerConnection and those that do.

PRs and issue reports are most welcome.
