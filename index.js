var inherits = require('inherits');
var Peer = require('simple-peer');
var parser = require('socket.io-parser');
var toArray = require('to-array');
var hasBin = require('has-binary');
var bind = require('component-bind');
var debug = require('debug');
var hat = require('hat');
var EventEmitter = require('events').EventEmitter

var Socketiop2p = function(opts, socket) {
  EventEmitter.call(this)
  /* When socket receives given event addPeer() to create new peer connection
   * Attatch listeners to that peer for message and signal
   * Peers generate a code that is passed with signalling data so that you can
   * Questions?
   * How do indicate that the peer is an initiator?
   * Connect to server, receive numClients and create peers for each of them
   * Receive answers and add them to the current peers
   * Emit ice candidates (further signalling) and listen further signalling
   * Listen for offers and create a peer for that
   * */
  var self = this;
  self.useSockets = true;
  self.decoder = new parser.Decoder(this);
  self.decoder.on('decoded', bind(this, this.ondecoded));
  self.socket = socket;
  self.opts = opts;
  self._peers = {};
  // TODO Set this from opts or when receiving numClients
  self.numClients = 4;
  self.numConnectedClients;
  self.readyPeers = 0;
  // TODO Clean up these events
  self._peerEvents = {
                   signal: 1,
                   signalingStateChange: 1,
                   iceConnectionStateChange: 1,
                   _onChannelMessage: 1,
                   _iceComplete: 1,
                   ready: 1,
                   error: 1,
                   peer_signal: 1,
                   message: 1,
                   addPeer: 1,
                   peer_ready: 1
                 };

  // Events coming in
  socket.on('numClients', function(numClients) {
    self.peerId = socket.io.engine.id;
    self.numConnectedClients = numClients;
    generateOffers(function(offers) {
      var offerObj = {
        offers: offers,
        fromPeerId: self.peerId
      };
      socket.emit('offers', offerObj)
    });

    function generateOffers(cb) {
      var offers = [];
      for (var i = 0; i < self.numClients; ++i) {
        generateOffer();
      }
      function generateOffer () {
        var offerId = hat(160)
        // TODO Extend the passed in options properly
        var peer = self._peers[offerId] = new Peer({initiator: true, trickle: true})
        // TODO Set listeners sensibly
        peer.setMaxListeners(50)
        self.setupPeerEvents(peer);
        peer.once('signal', function (offer) {
          offers.push({
            offer: offer,
            offerId: offerId
          })
          checkDone();
        })
      }

      function checkDone () {
        if (offers.length === self.numClients) {
          console.log('generated %s offers', self.numClients);
          cb(offers);
        }
      }
    }
  });

  socket.on('offer', function(data) {
    // TODO extend the passed in options properly
    var peer = self._peers[data.fromPeerId] = new Peer({trickle: true})
    self.numConnectedClients++;
    // TODO Set listeners sensibly
    peer.setMaxListeners(50)
    self.setupPeerEvents(peer);
    peer.on('signal', function(signalData) {
      console.log("signalling");
      var signalObj = {
        signal: signalData,
        offerId: data.offerId,
        fromPeerId: self.peerId,
        toPeerId: data.fromPeerId
      }
      socket.emit('signal', signalObj);
    });
    peer.signal(data.offer);
  });

  socket.on('signal', function(data) {
    // Select peer from offerId if exists
    var id = data.offerId || data.fromPeerId;
    var peer = self._peers[data.offerId] || self._peers[data.fromPeerId];

    peer.on('signal', function signalll(signalData) {
      var signalObj = {
        signal: signalData,
        offerId: data.offerId,
        fromPeerId: self.peerId,
        toPeerId: data.fromPeerId
      }
      socket.emit('signal', signalObj);
    })

    // TODO Handle errors properly
    peer.on('error', function(err) {
      console.log("Error "+err);
    })
    peer.signal(data.signal)
  })

  self.on('peer_ready', function(peer) {
    self.readyPeers++
    if (self.readyPeers == self.numConnectedClients) {
      self.emit('ready')
    }
  })

};

inherits(Socketiop2p, EventEmitter);

/**
 * Overwride the inheritted 'on' method to add a listener to the socket instance
 * that emits the event on the Socketio event loop
**/

Socketiop2p.prototype.on = function(type, listener) {
  var self = this;
  this.socket.addEventListener(type, function(data) {
    var dataObj = data || {}
    dataObj['_fromSocket'] = true;
    self.emit(type, dataObj);
  })
  this.addListener(type, listener)
};

Socketiop2p.prototype.setupPeerEvents = function(peer) {
  var self = this;

  peer.on('ready', function(peer) {
    self.emit('peer_ready', peer)
  });

  peer.on('message', function(data) {
    var key = Object.keys(self._peers).filter(function(key) {return self._peers[key] === peer})[0];
    if (this.destroyed) return;
    var data = event.data;
    self.decoder.add(data);
  })
}

Socketiop2p.prototype.emit = function (data, cb) {
  var self = this;
  var argsObj = cb || {};
  var encoder = new parser.Encoder();

  if (this._peerEvents.hasOwnProperty(data) || argsObj['_fromSocket']) {
    delete argsObj['_fromSocket']
    // Hackety hack
    this.__proto__.__proto__.emit.call(this, data, argsObj);
  } else if (this.useSockets) {
    this.socket.emit(data, cb);
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
          for (var peerId in self._peers) {
            self._peers[peerId].send(encodedPackets[i]);
          }
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

Socketiop2p.prototype.ondecoded = function(packet) {
  var args = packet.data || [];
  var ev = args[0];
  if (this._events[ev]) {
    this._events[ev](args[1]);
  } else {
    throw new Error('No callback registered for '+ev);
  }
}

Socketiop2p.prototype.disconnect = function() {
  console.log("Disconnecting");
  for (var peerId in this._peers) {
    var peer = this._peers[peerId];
    peer.destroy();
    this.socket.disconnect();
  }
}

module.exports = Socketiop2p;
