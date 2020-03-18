var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = 4500;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});
