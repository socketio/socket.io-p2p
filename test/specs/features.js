var test = require('tape')
var P2P = require('../../index')
var Emitter = require('component-emitter')
var p2p1, p2p2, p2p3
createPeers(runTests)

function runTests () {
  test('it should support multi-way communication', function (t) {
    t.plan(2)
    var jsonObj = {ping: 'pong', ding: {dong: 'song'}}
    p2p2.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p3.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p1.emit('peer-obj', jsonObj)
  })

  test.skip('Socket inter-operability', function (t) {
    t.plan(2)
    var jsonObj = {ping: 'pong', ding: {dong: 'song'}}
    p2p1.useSockets = true
    p2p2.useSockets = true

    // Mock socket behaviour
    p2p1.socket.on('socket-obj', function (data) {
      p2p2.emit('socket-obj', data)
    })

    // over peer connect webrtc
    p2p1.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p2.once('socket-obj', function (data) {
      // over socket
      t.deepEqual(data, jsonObj)
      p2p1.upgrade()
      p2p2.upgrade()
      p2p2.emit('peer-obj', jsonObj)
    })
    p2p1.emit('socket-obj', jsonObj)
  })

  test('it calls an optional callback on upgrade', function (t) {
    t.plan(1)
    var sock = {}
    Emitter(sock)
    var p2p = new P2P(sock, {}, function () {
      t.pass('Callback was called')
    })

    // Emit ready event
    p2p.emit('upgrade')
  })

  test('it should send and receive binary data', function (t) {
    t.plan(1)
    var binaryPacket = {data: new Uint8Array(16)}

    p2p1.once('binary-packet', function (data) {
      t.deepEqual(data, binaryPacket)
    })

    p2p2.emit('binary-packet', binaryPacket)
  })

  test('it should receive utf8 multibyte characters', function (t) {
    t.plan(3)
    var correct = [
      'てすと',
      'Я Б Г Д Ж Й',
      'Ä ä Ü ü ß'
    ]

    p2p1.once('japanese', function (data) {
      t.deepEqual(data, correct[0])
    })
    p2p1.once('ukranian', function (data) {
      t.deepEqual(data, correct[1])
    })
    p2p1.once('german', function (data) {
      t.deepEqual(data, correct[2])
    })

    p2p2.emit('japanese', 'てすと')
    p2p2.emit('ukranian', 'Я Б Г Д Ж Й')
    p2p2.emit('german', 'Ä ä Ü ü ß')
  })
}

function createPeers (cb) {
  var twillioConfig = require('../ice_servers.json')
  var peerOpts = {trickle: false, config: {iceServers: twillioConfig}}

  // Stub socket.io conection
  var sockets = {}
  for (var i = 0; i < 3; i++) {
    sockets['sio' + i] = {}
    Emitter(sockets['sio' + i])
    sockets['sio' + i].io = {engine: {id: i}}
  }

  p2p1 = new P2P(sockets.sio0, {numClients: 2, peerOpts: peerOpts})
  p2p2 = new P2P(sockets.sio1, {numClients: 1, peerOpts: peerOpts})
  p2p3 = new P2P(sockets.sio2, {numClients: 1, peerOpts: peerOpts}, cb)

  p2p1.on('offers', function (data) {
    for (var i = 1; i < 3; i++) {
      var socket = sockets['sio' + i]
      socket.on('peer-signal', function (data) {
        p2p1.socket.emit('peer-signal', data)
      })
      var offerObj = data.offers[i - 1]
      var emittedOffer = {fromPeerId: 0, offerId: offerObj.offerId, offer: offerObj.offer}
      socket.emit('offer', emittedOffer)
    }
  })
  p2p1.emit('numClients', 0)
  p2p2.emit('numClients', 0)
  p2p3.emit('numClients', 0)
}
