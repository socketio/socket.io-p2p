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

describe('ArrayBufferr', function() {

  var socket1 = io({ forceNew: true });
  var socket2 = io({ forceNew: true });

  it('should receive utf8 multibyte characters', function(done) {
    var correct = [
      'てすと',
      'Я Б Г Д Ж Й',
      'Ä ä Ü ü ß',
      'utf8 — string',
      'utf8 — string'
    ];

    var p2psocket1 = new Socketiop2p(extend(peerOpts, {initiator: true}), socket1);
    var p2psocket2 = new Socketiop2p(extend(peerOpts, {initiator: false}), socket2);

    var i = 0;
    p2psocket2.on('takeUtf8', function(data) {
      expect(data).to.be(correct[i]);
      i++;
      if (i == correct.length) {
        done();
      }
    });
    p2psocket2.on('ready', function() {
      p2psocket1.emit('takeUtf8', 'てすと');
      p2psocket1.emit('takeUtf8', 'Я Б Г Д Ж Й');
      p2psocket1.emit('takeUtf8', 'Ä ä Ü ü ß');
      p2psocket1.emit('takeUtf8', 'utf8 — string');
      p2psocket1.emit('takeUtf8', 'utf8 — string');
    })
  });
})
