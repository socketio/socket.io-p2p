var inherits = require('inherits');
var SimplePeer = require('simple-peer');
var parser = require('socket.io-parser');
var toArray = require('to-array');
var hasBin = require('has-binary');
var bind = require('component-bind');
var debug = require('debug');

var Socketiop2p = function(opts, socket) {
  SimplePeer.call(this, opts)
  var self = this;
  this.decoder = new parser.Decoder(this);
  this.decoder.on('decoded', bind(this, this.ondecoded));
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
    self.signal(message.data);
  });

  self.on('signal', function (data) {
    socket.emit('peer_signal', {type: 'signal', data: data});
  });
};

inherits(Socketiop2p, SimplePeer);

/**
 * Overwride the inheritted 'on' method to add listeners to socket instance
 * in addition to the peer so that events can be listened to on both channels
**/

Socketiop2p.prototype.on = function(type, listener) {
  var self = this;
  this.socket.addEventListener(type, function(data) {
    data['_fromSocket'] = true;
    self.emit(data); 
    listener(data);
  })
  this.addListener(type, listener)
};

Socketiop2p.prototype.emit = function (data, cb) {
  var self = this;
  var encoder = new parser.Encoder();
  if (this._peerEvents.hasOwnProperty(data) || data['_fromSocket']) {
    this.__proto__.__proto__.emit.call(this, data, cb);
  } else {
    var args = toArray(arguments);
    var parserType = parser.EVENT; // default
    if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
    var packet = { type: parserType, data: args};

    encoder.encode(packet, function(encodedPackets) {
      if (encodedPackets[1] instanceof ArrayBuffer) {
        if (self._channel) self._sendArray(encodedPackets);
      } else if (encodedPackets) {
        for (var i = 0; i < encodedPackets.length; i++) {
          self.send(encodedPackets[i], cb);
        }
      } else {
        throw new Error('Encoding error');
      }
    });
  }
};


/**
* If the second packet is a binary attachment,
* swap out the attachment number for the number of chunks in the array
* before sending the new packet and chunks
**/

Socketiop2p.prototype._sendArray = function(arr) {
  var firstPacket = arr[0];
  var interval = 5000;
  var arrLength = arr[1].byteLength;
  var nChunks = Math.ceil(arrLength/interval);
  var packetData = firstPacket.substr(0, 1)+nChunks+firstPacket.substr(firstPacket.indexOf('-'));
  this.send(packetData);
  this.binarySlice(arr[1], interval, this.send);
}

Socketiop2p.prototype.binarySlice = function(arr, interval, callback) {
  var chunks = [];
  for (start = 0; start < arr.byteLength; start += interval) {
    var chunk = arr.slice(start, start + interval);
    callback.call(this, chunk);
  }
}

Socketiop2p.prototype.send = function(data, cb) {
  if (this._channel) {
    this._channel.send(data);
  }
}

Socketiop2p.prototype._onChannelMessage = function (event) {
  if (this.destroyed) return;
  var data = event.data;
  this.decoder.add(data);
}

Socketiop2p.prototype.ondecoded = function(packet) {
  var args = packet.data || [];
  var ev = args[0];
  if (this._events[ev]) {
    this._events[ev](args[1]);
  } else {
    throw new Error('No callback registered for '+ev);
  }
}

module.exports = Socketiop2p;
