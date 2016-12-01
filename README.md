![](https://cldup.com/95U80xyuHq.svg)

This module provides an **easy** and **reliable** way to setup a WebRTC connection between peers and communicate using events (the [socket.io-protocol](https://github.com/Automattic/socket.io-protocol)).

Socket.IO is used to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling) and as a fallback for clients where WebRTC `PeerConnection` is not supported.

## How to use

Create a socket connection, pass it to `P2P`. On the Client:

```js
var P2P = require('socket.io-p2p');
var io = require('socket.io-client');
var socket = io();

var p2p = new P2P(socket);

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

If you're not using browserify, then use the included standalone file `socketiop2p.min.js`. This exports a `P2P` constructor on `window`.

On the server, use the [socket.io-p2p-server](https://github.com/tomcartwrightuk/socket.io-p2p-server) to take care of signalling. All clients who support WebRTC data connections will exchange signalling data via the default `/` namespace.

```js
var server = require('http').createServer();
var io = require('socket.io')(server);
var p2p = require('socket.io-p2p-server').Server;
io.use(p2p);
server.listen(3030);
```

WebRTC Peer connections can also be established by exchanging signalling data within a socket.io room. Do this by calling the `p2p` server within the `connection` callback:

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

See [chat app](https://github.com/socketio/socket.io-p2p/tree/master/examples/chat) for full example.

## API

### `p2psocket = new P2P(socket, opts, cb)`

Create a new socket.io-p2p connection.

The `opts` object can include options for setup of the overall socket.io-p2p connection as well as options for the individual peers - specified using `peerOpts`.

- `numClients` - max number of peers each client can connect to; `5` by default.
- `autoUpgrade` - upgrade to a p2p connection (from s.io one) when peers are ready; `true` by default
- `peerOpts` - object of options to be passed to underlying peers. See [here](https://github.com/feross/simple-peer/blob/master/README.md#api) for currently supported options. See [here](examples/streaming) for an example.

`cb` is an optional callback. Called when connection is upgraded to a WebRTC connection.

### `p2psocket.on('upgrade', function (data) {})`

Triggered when P2P connection is converted to a WebRTC one.

### `p2psocket.on('peer-error', function (data) {})`

Triggered when a `PeerConnection` object errors during signalling.

## Roadmap of development

- Support for packets containing multiple binary blobs - packets can only contain one blob in this version
- Allow a peer to act as a relay between peers that don't support PeerConnection and those that do.

PRs and issue reports are most welcome.
