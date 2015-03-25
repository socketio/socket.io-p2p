var express = require('express');
var app = require('express')();
var server = require('http').Server(app);
var p2pserver = require('socket.io-p2p-server')
var io = require('socket.io')(server);

server.listen(3030, function() {
  console.log("Listening on 3030");
});

app.use(express.static(__dirname));
io.use(p2pserver);

io.on('connection', function(socket) {
  socket.on('peer-msg', function(data) {
    console.log("peer msg");
    socket.broadcast.emit('peer-msg', data);
  })

  socket.on('go-private', function(data) {
    socket.broadcast.emit('go-private', data);
  })
})
