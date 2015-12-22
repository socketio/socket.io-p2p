var test = require('tape')
var P2P = require('../../index')
var io = require('socket.io-client')
var manager1 = io.Manager()
var manager2 = io.Manager()
var manager3 = io.Manager()

var Emitter = require('component-emitter')
var sock = {}
Emitter(sock)

var serverSock = {}
Emitter(serverSock)
var p2pserver = require('socket.io-p2p-server').Server
p2pserver(serverSock)

var config = { "iceServers": [
                {
                  "url": "stun:23.21.150.121",
                  "urls": "stun:23.21.150.121"
                },
                {
                  "url": process.env.TURN_URL,
                  "username": process.env.TURN_USER,
                  "credential": process.env.TURN_CREDENTIAL,
                  "urls": process.env.TURN_URL
                }
              ]
            }
console.log(process.env.TURN_URL);
var peerOpts = {trickle: false, config: config}

test('it should support multi-way communication', function (t) {
  var peerOpts = {trickle: false, config: config}
  t.plan(2)

  var sockets = {}
  for (var i = 0; i < 3; i++) {
    sockets['sio'+i] = {}
    Emitter(sockets['sio'+i])
    sockets['sio'+i].io = {engine: {id: i}}
  }

  var p2p1 = new P2P(sockets.sio0, {numClients: 2, peerOpts: peerOpts})
  var p2p2 = new P2P(sockets.sio1, {numClients: 1, peerOpts: peerOpts})
  var p2p3 = new P2P(sockets.sio2, {numClients: 1, peerOpts: peerOpts}, runTest1)

  p2p1.on('offers', function (data) {
    for (var i = 1; i < 3; i++) {
      var socket = sockets['sio'+i]
      socket.on('peer-signal', function(data) {
        p2p1.socket.emit('peer-signal', data)
      })
      var offerObj = data.offers[i-1]
      var emittedOffer = {fromPeerId: 0, offerId: offerObj.offerId, offer: offerObj.offer}
      socket.emit('offer', emittedOffer)
    }
  })
  p2p1.emit('numClients', 0)
  p2p2.emit('numClients', 0)
  p2p3.emit('numClients', 0)

  var readyPeers = {}
  var jsonObj = {ping: 'pong', ding: {dong: 'song'}}

  function runTest1 () {
    p2p2.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p3.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p1.emit('peer-obj', jsonObj)
  }
})

test.skip('Socket inter-operability', function (t) {
  t.plan(2)
  var namespace = '/inter'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts}, runTest2)

  function runTest2 () {
    var jsonObj = {ping: 'pong', ding: {dong: 'song'}}

    // over peer connect webrtc
    p2p1.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
      p2p1.disconnect()
      p2p2.disconnect()
    })

    p2p2.once('socket-obj', function (data) {
      // over socket
      t.deepEqual(data, jsonObj)
      p2p1.useSockets = false
      p2p2.useSockets = false
      p2p2.emit('peer-obj', jsonObj)
    })
    p2p1.emit('socket-obj', jsonObj)
  }
})

test('Optional callback is called on upgrade', function (t) {
  t.plan(1)
  t.deepEqual("d", "d")
  // var p2p2 = new P2P(sock, {peerOpts: peerOpts}, function () {
    // t.pass('Callback was called')
  // })

  // Emit ready event
  // p2p2.emit('upgrade')
})

test.skip('it should send and receive binary data', function (t) {
  t.plan(1)
  var namespace = '/blob'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts}, runTest3)

  var binaryPacket = {data: new Uint8Array(16)}

  function runTest3 () {
    p2p1.usePeerConnection = true
    p2p2.usePeerConnection = true
    p2p1.once('binary-packet', function (data) {
      t.deepEqual(data, binaryPacket)
      p2p1.disconnect()
    })

    p2p2.emit('binary-packet', binaryPacket)
  }
})

test.skip('it should receive utf8 multibyte characters', function (t) {
  t.plan(3)
  var namespace = '/array'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts}, runTest)

  function runTest () {
    p2p1.usePeerConnection = true
    p2p2.usePeerConnection = true

    var correct = [
      'てすと',
      'Я Б Г Д Ж Й',
      'Ä ä Ü ü ß'
    ]

    p2p1.once('japanese', function (data) {
      t.deepEqual(data, correct[0])
      tryFinish()
    })

    p2p1.once('ukranian', function (data) {
      t.deepEqual(data, correct[1])
      tryFinish()
    })

    p2p1.once('german', function (data) {
      t.deepEqual(data, correct[2])
      tryFinish()
    })

    p2p2.emit('japanese', 'てすと')
    p2p2.emit('ukranian', 'Я Б Г Д Ж Й')
    p2p2.emit('german', 'Ä ä Ü ü ß')

    var finishedPeers = 0
    function tryFinish (peer) {
      finishedPeers++
      if (finishedPeers === 3) {
        p2p1.disconnect()
        p2p2.disconnect()
      }
    }
  }
})
