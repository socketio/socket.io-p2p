#### Work in progress - Just a playground for testing out some ideas at the moment

# socketio-p2p

This module provides a simple way to setup a WebRTC connection between peers and communicate using an API similar to socket.io. It's build on top of [simple-peer](https://github.com/feross/simple-peer) and assumes that you are using socketio to transport [signalling data](http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/#what-is-signaling). All you need is some peers initially connected over a socket.io connection and then to call `startSignalling()`. All the signalling data will be transferred and handled for you. Just attach a listener to the `ready` event and away you go. Later versions of this project will include the ability to fall back to server communication if the browser doesn't support PeerConnection.

## How to use

Create a socket connection, pass it to Socketiop2p, start the signalling and you are off.

```
var socket = io();

// Once all peers are connected using socket.io

var peer = new Socketiop2p({initiator: true}, socket); // initiator needs to be set to true on one of the peers only
peer.startSignalling();

peer.on('ready', function() {
  console.log("this peer is ready");
})

peer.on('message', function (data) {
  console.log('Got a message from a peer here: '+data);
})

peer.emit('message', 'This is much easier than rolling your own signalling transport solution')

```

## Roadmap of development

- Add socketio protocol API, packets etc
- Full support and testing for sending binary data
- Basic things: Provide a bundle for non-browserified projects; improve documentation
- Fallback connection to socket.io if PeerConnection is not available
