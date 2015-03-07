var Socketiop2p = require('../../index');
var io = require('socket.io-client');
var connectionUrl = '/chat';

var peerOpts = {};

function init () {

  var manager = io.Manager();
  var socket = manager.socket(connectionUrl)
  var p2psocket = new Socketiop2p(peerOpts, socket);

  // Elements
  var privateButton = document.getElementById('private');
  var form = document.getElementById('msg-form');
  var box = document.getElementById('msg-box');
  var msgList = document.getElementById('msg-list');

  var jsonObj = {ping: 'pong', ding: {dong: 'song'}};
  p2psocket.on('ready', function() {
    console.log("socketp2p ready");
    console.log(p2psocket.peerId);
    privateButton.disabled = false;
    p2psocket.emit('peer-obj', 'Hello there. I am ' + p2psocket.peerId)
  });

  p2psocket.on('peer-msg', function(data) {
    console.log(data);
    var li = document.createElement("li");
    li.appendChild(document.createTextNode(data));
    msgList.appendChild(li);
  });

  form.addEventListener('submit', function(e, d) {
    e.preventDefault();
    p2psocket.emit('peer-msg', box.value)
  });

  p2psocket.on('go-private', function() {
    p2psocket.useSockets = false;
  });

  privateButton.addEventListener('click', function(e) {
    p2psocket.useSockets = false;
    p2psocket.emit('go-private', true)
  })

}

document.addEventListener('DOMContentLoaded', init, false)
