var test = require('tape')
var Socketiop2p = require('../../index')
var io = require('socket.io-client')
var manager1 = io.Manager()
var manager2 = io.Manager()
var manager3 = io.Manager()
var peerOpts = {}

test('it should support multi-way communication', function (t) {
  t.plan(2)
  var namespace = '/multi'
  var socket1, socket2, socket3, p2p1, p2p2, p2p3

  setTimeout(function () {
    socket1 = manager1.socket(namespace)
    p2p1 = new Socketiop2p(peerOpts, socket1)
  }, 25)

  setTimeout(function () {
    socket2 = manager2.socket(namespace)
    p2p2 = new Socketiop2p(peerOpts, socket2)
  }, 50)

  setTimeout(function () {
    socket3 = manager3.socket(namespace)
    p2p3 = new Socketiop2p(peerOpts, socket3)
    p2p3.on('ready', function () {
      runTest()
    })
  }, 75)

  var readyPeers = {}
  var jsonObj = {ping: 'pong', ding: {dong: 'song'}}

  function runTest () {
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
  var socket1, socket2, p2p1, p2p2

  setTimeout(function () {
    socket1 = manager1.socket(namespace)
    p2p1 = new Socketiop2p(peerOpts, socket1)
  }, 25)

  setTimeout(function () {
    socket2 = manager2.socket(namespace)
    p2p2 = new Socketiop2p(peerOpts, socket2)
    p2p2.on('ready', function () {
      runTest()
    })
  }, 50)

  function runTest () {
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
