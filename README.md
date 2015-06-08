![](https://cldup.com/95U80xyuHq.svg)

This module provides an **easy** and **reliable** way to setup a WebRTC connection between peers and communicate using events (the [socket.io-protocol](https://github.com/Automattic/socket.io-protocol)).

Socket.IO is used to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling) and as a fallback for clients where WebRTC `PeerConnection` is not supported.

### How to use

Create a socket connection, pass it to `P2P`. On the Client:

```js
var P2P = require('socket.io-p2p');
var io = require('socket.io-client');
var socket = io();

var p2p = new P2P({}, socket);

p2p.on('ready', function(){
  p2p.usePeerConnection = true;
  p2p.emit('peer-obj', { peerId: peerId });
})

// this event will be triggered over the socket transport 
// until `usePeerConnection` is set to `true`
p2p.on('peer-msg', function(data){
  console.log(data);
});
```

On the server, use the [socket.io-p2p-server](https://github.com/tomcartwrightuk/socket.io-p2p-server) to take care of signalling. All clients who support WebRTC data connections will exchange signalling data via the default `/` namespace.

```js
var server = require('http').createServer();
var io = require('socket.io')(server);
var p2p = require('socket.io-p2p-server').Server;
io.use(p2p);
server.listen(3030);
```

WebRTC Peer connections can also be established by exchanging signalling data witin a socket.io room. Do this by calling the `p2p` server within the `connection` callback:

```js
var server = require('http').createServer();
var io = require('socket.io')(server);
var p2p = require('socket.io-p2p-server').Server;
server.listen(3030);

io.on('connection', function(socket){
  clients[socket.id] = socket;
  socket.join(roomName);
  p2p(socket, null, room);
});
```

### Roadmap of development

- Support for packets containing multiple binary blobs - packets can only contain one blob in this version
- Allow a peer to act as a relay between peers that don't support PeerConnection and those that do.

PRs and issue reports are most welcome.
