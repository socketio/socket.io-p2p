var Socketiop2p = require('../socket.io-p2p');
var test = require('tape');
var extend = require('extend.js');
var EventEmitter = require('events').EventEmitter;

var peerOpts = {
  initiator: false,
  stream: false,
  config: { iceServers: [] },
  constraints: {},
  channelName: 'simple-peer',
  trickle: false
};

test('signal function gets called when peer_signal is received on socket or peer is initiator', function (t) {
  var peer1 = new Socketiop2p(extend(peerOpts, {initiator: true}), new EventEmitter)
  var peer2 = new Socketiop2p(peerOpts, new EventEmitter)
  peer1.startSignalling();
  peer2.startSignalling();

  peer1.on('signal', function () {
    t.pass('Signal event triggered because I am initiator')
    peer1.destroy()
  })

  peer2.on('signal', function() {
    t.pass('Signal event triggered because I got some data over the socket')
    peer2.destroy()
    t.end()
  })
});

test('error event is emitted when a PeerConnection error occurs', function(t) {
  console.log("TODO");
});
