const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const socketIO = require('./services/socketio-communication.js');
const database = require('./model/tasksmanager.js');

const port = 4500;

app.use(bodyParser.json());
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


app.get('/tasks', function (req, res) {
    let tasks = db.getTasks();
    res.send(tasks);
});

app.delete('/tasks/:task', function (req, res) {
    db.deleteTask(req.params.task);
    console.log("Task " + req.params.task + " should have been deleted");
});

app.post('/tasks/:taskname', function (req, res) {
    db.saveTask(req.body);
    res.send("Adding or updating task + " + req.params.taskname);
});


http.listen(port, function(){
    console.log('listening on *:' + port);
});

setTimeout(() => {console.log(db.getTasks());}, 1000);