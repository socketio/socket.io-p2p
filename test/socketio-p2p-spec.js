var Socketiop2p = require('../index');
var io = require('socket.io-client');

var expect = require('expect.js');
var extend = require('extend.js');

var peerOpts = {
  initiator: false,
  stream: false,
  config: { iceServers: [] },
  constraints: {},
  channelName: 'simple-peer',
  trickle: false
};

describe('Socket inoperablitiy', function() {

  var socket1 = io({ forceNew: true });
  var socket2 = io({ forceNew: true });
  var p2psocket1 = new Socketiop2p(peerOpts, socket1);
  var p2psocket2 = new Socketiop2p(extend(peerOpts, {initiator: true}), socket2);

  describe('JSON', function(done) {
    it('should parse data from peer connection and sockets', function(done) {

      var jsonObj = {ping: 'pong', ding: {dong: 'song'}};
      p2psocket1.on('ready', function() {
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
  });

  describe('ArrayBufferr', function() {
    it('should receive utf8 multibyte characters', function(done) {
      var correct = [
        'てすと',
        'Я Б Г Д Ж Й',
        'Ä ä Ü ü ß',
        'utf8 — string',
        'utf8 — string'
      ];

      p2psocket1.useSockets = false;
      p2psocket2.useSockets = false;

      var i = 0;
      p2psocket1.on('takeUtf8', function(data) {
        expect(data).to.be(correct[i]);
        i++;
        if (i == correct.length) {
          done();
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
