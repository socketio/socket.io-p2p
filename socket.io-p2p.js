var inherits = require('inherits');
var SimplePeer = require('simple-peer');

function Socketiop2p (opts, socket) {
  SimplePeer.call(this, opts)
  var self = this;
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
  socket.on('start_signalling', function(cb) {
    self.startSignalling();
    cb();
  });

  self.startSignalling = function() {
    socket.on('peer_signal', function (message){
      self.signal(message.data)
    });

    self.on('signal', function (data) {
      socket.emit('peer_signal', {type: 'signal', data: data})
    })

    self.on('error', function(data) {
      // handle some errors here, like "Failed to set remote answer sdp: Called in wrong state: STATE_INPROGRESS" by falling back to sockets
      console.log(data);
      console.log(self);
    })
  }  
}
inherits(Socketiop2p, SimplePeer);

Socketiop2p.prototype.emit = function (data, cb) {
  if (this._peerEvents.hasOwnProperty(data)) {
    this.__proto__.__proto__.emit.call(this, data, cb);
  } else {
    this.send(data, cb);
  }
};

module.exports = Socketiop2p
