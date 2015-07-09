var test = require('tape')
var P2P = require('../../index')
var io = require('socket.io-client')
var manager1 = io.Manager()
var manager2 = io.Manager()
var peerOpts = {}

test('it should receive utf8 multibyte characters', function (t) {
  t.plan(3)
  var namespace = '/array'
  var socket1, socket2, p2p1, p2p2

  setTimeout(function () {
    socket1 = manager1.socket(namespace)
    p2p1 = new P2P(peerOpts, socket1)
  }, 25)

  setTimeout(function () {
    socket2 = manager2.socket(namespace)
    p2p2 = new P2P(peerOpts, socket2)
    p2p2.on('ready', function () {
      runTest()
    })
  }, 50)

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

test('it should send and receive binary data', function (t) {
  t.plan(1)
  var namespace = '/blob'
  var socket1, socket2, p2p1, p2p2

  setTimeout(function () {
    socket1 = manager1.socket(namespace)
    p2p1 = new P2P(peerOpts, socket1)
  }, 25)

  setTimeout(function () {
    socket2 = manager2.socket(namespace)
    p2p2 = new P2P(peerOpts, socket2)
    p2p2.on('ready', function () {
      runTest()
    })
  }, 50)

  var binaryPacket = {data: new Uint8Array(16)}

  function runTest () {
    p2p1.usePeerConnection = true
    p2p2.usePeerConnection = true
    p2p1.once('binary-packet', function (data) {
      t.deepEqual(data, binaryPacket)
      p2p1.disconnect()
    })

    p2p2.emit('binary-packet', binaryPacket)
  }
})
