// Chat example
$(function () {
  var socket = io('/chat');
  $('form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });

  socket.on('user message', function(msg){
    $('#messages').append($('<li>').text("ME: " + msg));
  });
  socket.on('wizard message', function(msg){
    $('#messages').append($('<li>').text("BOT: " + msg));
  });
});
