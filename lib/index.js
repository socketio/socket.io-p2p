var inherits = require('inherits');
var SimplePeer = require('simple-peer');
var parser = require('socket.io-parser');
var EventEmitter = require('events').EventEmitter
var toArray = require('to-array');
var hasBin = require('has-binary');
var parser = require('socket.io-parser');
var engineParser = require('engine.io-parser');
var bind = require('component-bind');
var debug = require('debug');

var Socketiop2p = function(opts, socket) {
  SimplePeer.call(this, opts)
  var self = this;
  this.decoder = new parser.Decoder(this);
  this.decoder.on('decoded', bind(this, this.ondecoded))
  self.socket = socket;
  self.opts = opts;
  self._peerEvents = {
                   signal: 1,
                   signalingStateChange: 1,
                   iceConnectionStateChange: 1,
                   _onChannelMessage: 1,
                   _iceComplete: 1,
                   ready: 1,
                   error: 1,
                   peer_signal: 1,
                   message: 1
                 };

  socket.on('peer_signal', function (message){
    self.signal(message.data)
  });

  self.on('signal', function (data) {
    socket.emit('peer_signal', {type: 'signal', data: data})
  })

  self.on('error', function(data) {
    throw new Error('', data);
  })
}
inherits(Socketiop2p, SimplePeer);

Socketiop2p.prototype.emit = function (data, cb) {
  var self = this;
  var encoder = new parser.Encoder();
  if (this._peerEvents.hasOwnProperty(data)) {
    this.__proto__.__proto__.emit.call(this, data, cb);
  } else {
    var args = toArray(arguments);
    var parserType = parser.EVENT; // default
    if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
    var packet = { type: parserType, data: args};

    encoder.encode(packet, function(encodedPackets) {
      if (encodedPackets[1] instanceof ArrayBuffer) {
        self.binarySlice(encodedPackets, self.send);
      } else if encodedPackets {
        for (var i = 0; i < encodedPackets.length; i++) {
          self.send(encodedPackets[i], cb);
        }
      } else {
        throw new Error('Encoding error');
      }
    });
  }
};

Socketiop2p.prototype.binarySlice = function(arr, callback) {
  var interval = 1000;
  var end = arr[1].byteLength;
  var chunks = [];
  var nChunks = Math.ceil(end/interval);
  var packetData = arr[0].substr(0, 1)+nChunks+arr[0].substr(arr[0].indexOf('-'));
  this.send(packetData);
  for (start = 0; start < end; start += interval) {
    var chunk = arr[1].slice(start, start + interval);
    this.send(chunk);
  }
}


Socketiop2p.prototype.send = function(packet, cb) {
  if (this._channel) {
    this._channel.send(packet);
  } else {
    new Error('No channel established');
  }
}

Socketiop2p.prototype._onChannelMessage = function (event) {
  if (this.destroyed) return;
  var data = event.data;
  this.decoder.add(data);
}

Socketiop2p.prototype.ondecoded = function(packet) {
  console.log(packet);
  var args = packet.data || [];
  var ev = args[0];
  if (this._events[ev]) {
    this._events[ev](args[1]);
  } else {
    throw new Error('No callback registered for');
  }
}

module.exports = Socketiop2p;
