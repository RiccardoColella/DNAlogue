const express = require("express");
const app = express();
const http = require("http").Server(app);
const socketIO = require('./services/socketio-communication.js');
const database = require('./model/mmanager.js');

const port = 4500;

app.use(express.static('\public'));
app.use(express.static('\wizard'));

socketIO.startIO(http);
const db = new database().getInstance();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/wizard', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

/*
app.get('/tasks', function (req, res) {
    let tasks = db.getTasks();
    res.send(tasks);
});
*/

http.listen(port, function(){
    console.log('listening on *:' + port);
});

setTimeout(() => {console.log(db.getTasks());}, 1000);