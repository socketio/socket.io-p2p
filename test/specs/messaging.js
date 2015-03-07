var Socketiop2p = require('../../index');
var io = require('socket.io-client');
var expect = require('expect.js');

var peerOpts = {}

describe('Socket inter-operability', function() {
  var manager1 = io.Manager();
  var manager2 = io.Manager();
  var socket1 = manager1.socket('/inter')
  var socket2 = manager2.socket('/inter')
  var p2psocket1 = new Socketiop2p(peerOpts, socket1);
  var p2psocket2 = new Socketiop2p(peerOpts, socket2);
  p2psocket1.useSockets = true;
  p2psocket2.useSockets = true;

  describe('JSON', function(done) {
    it('should parse data from peer connection and sockets', function(done) {
      var jsonObj = {ping: 'pong', ding: {dong: 'song'}};
      // from webrtc
      p2psocket1.on('peer-obj', function(data) {
        expect(data).to.eql(jsonObj)
        done();
      })

      p2psocket2.on('socket-obj', function(data) {
        // over socket
        expect(data).to.eql(jsonObj)
        p2psocket1.useSockets = false;
        p2psocket2.useSockets = false;
        p2psocket2.emit('peer-obj', jsonObj)
      })

      p2psocket1.emit('socket-obj', jsonObj)
    });
  });

  describe('ArrayBufferr', function() {
    it('should receive utf8 multibyte characters', function(done) {
      p2psocket1.useSockets = false;
      p2psocket2.useSockets = false;
      var correct = [
        'てすと',
        'Я Б Г Д Ж Й',
        'Ä ä Ü ü ß',
        'utf8 — string',
        'utf8 — string'
      ];

      var i = 0;
      p2psocket1.on('takeUtf8', function(data) {
        expect(data).to.be(correct[i]);
        i++;
        if (i == correct.length) {
          done();
          p2psocket1.disconnect()
          p2psocket2.disconnect()
          p2psocket1 = null;
          p2psocket2 = null;
          socket1 = null;
          socket2 = null;
        }
      });
      p2psocket2.emit('takeUtf8', 'てすと');
      p2psocket2.emit('takeUtf8', 'Я Б Г Д Ж Й');
      p2psocket2.emit('takeUtf8', 'Ä ä Ü ü ß');
      p2psocket2.emit('takeUtf8', 'utf8 — string');
      p2psocket2.emit('takeUtf8', 'utf8 — string');
    });
  })
})
