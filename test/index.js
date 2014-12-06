  it('should receive utf8 multibyte characters', function(done) {
    var correct = [
      'てすと',
      'Я Б Г Д Ж Й',
      'Ä ä Ü ü ß',
      'utf8 — string',
      'utf8 — string'
    ];

    var socket = io({ forceNew: true });
    var i = 0;
    socket.on('takeUtf8', function(data) {
      expect(data).to.be(correct[i]);
      i++;
      if (i == correct.length) {
        socket.disconnect();
        done();
      }
    });
    socket.emit('getUtf8');
  });


