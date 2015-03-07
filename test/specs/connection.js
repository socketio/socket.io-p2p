var Socketiop2p = require('../../index');
var io = require('socket.io-client');

var expect = require('expect.js');
var extend = require('extend.js');

var peerOpts = {};

describe('Multi-way communication', function() {
  var connectionUrl = '/chat';
  var manager1 = io.Manager();
  var manager2 = io.Manager();
  var manager3 = io.Manager();

  var socket1 = manager1.socket(connectionUrl)
  var socket2 = manager2.socket(connectionUrl)
  var socket3 = manager3.socket(connectionUrl)

  var p2psocket1 = new Socketiop2p(peerOpts, socket1);
  var p2psocket2 = new Socketiop2p(peerOpts, socket2);
  var p2psocket3 = new Socketiop2p(peerOpts, socket3);

  p2psocket1.useSockets = false;
  p2psocket2.useSockets = false;
  p2psocket3.useSockets = false;

  describe('3-way JSON object transfer', function(done) {
    it('should parse data from peer connection and sockets', function(done) {
      var jsonObj = {ping: 'pong', ding: {dong: 'song'}};
      p2psocket3.on('ready', function() {
        console.log("ready");

        p2psocket2.on('peer-obj', function(data) {
          p2psocket2._peers;
          console.log("Peer 2 recieved");
          expect(data).to.eql(jsonObj)
        })

        p2psocket1.on('peer-obj', function(data) {
          p2psocket1._peers;
          console.log("Peer 3 recieved");
          expect(data).to.eql(jsonObj)
          done();
          p2psocket1.disconnect()
          p2psocket2.disconnect()
          p2psocket3.disconnect()
        })
        p2psocket3.emit('peer-obj', jsonObj)
      });
    });
  });

})
