var test = require('tape')
var P2P = require('../../index')
var io = require('socket.io-client')
var manager1 = io.Manager()
var manager2 = io.Manager()
var manager3 = io.Manager()
var peerOpts = {trickle: false}

test('it should support multi-way communication', function (t) {
  t.plan(2)
  var namespace = '/multi'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts})

  var socket3 = manager3.socket(namespace)
  var p2p3 = new P2P(socket3, {peerOpts: peerOpts}, runTest1)

  var readyPeers = {}
  var jsonObj = {ping: 'pong', ding: {dong: 'song'}}

  function runTest1 () {
    p2p2.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p1.once('peer-obj', function (data) {
      t.deepEqual(data, jsonObj)
    })

    p2p3.emit('peer-obj', jsonObj)
  }
})

test('Socket inter-operability', function (t) {
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
  var namespace = '/cb'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts}, function () {
    t.pass('Callback was called')
  })
})

test('it should send and receive binary data', function (t) {
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
    console.log("Setting up");
    p2p1.once('binary-packet', function (data) {
      console.log("Settingsdfsdfsd");
      t.deepEqual(data, binaryPacket)
      p2p1.disconnect()
    })

    p2p2.emit('binary-packet', binaryPacket)
  }
})

test('it should receive utf8 multibyte characters', function (t) {
  t.plan(3)
  var namespace = '/array'
  var socket1 = manager1.socket(namespace)
  var p2p1 = new P2P(socket1, {peerOpts: peerOpts})

  var socket2 = manager2.socket(namespace)
  var p2p2 = new P2P(socket2, {peerOpts: peerOpts}, runTest)

  function runTest () {
    p2p1.usePeerConnection = true
    p2p2.usePeerConnection = true
    console.log("Running test");

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
