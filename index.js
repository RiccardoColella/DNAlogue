const express = require("express");
const app = express();
var http = require("http").Server(app);
const socketIO = require('./services/socketio-communication.js');

var port = 4500;

app.use(express.static('\public'));
app.use(express.static('\wizard'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/wizard', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

socketIO.startIO(http);

http.listen(port, function(){
    console.log('listening on *:' + port);
});
