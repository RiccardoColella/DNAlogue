const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const multer = require('multer');
const socketIO = require('./services/socketio-communication.js');
const database = require('./model/tasksmanager.js');

const port = 4500;

app.use(bodyParser.json());
app.use(express.static('\public'));
app.use(express.static('\wizard'));

socketIO.startIO(http);
const db = new database().getInstance();

let uploading = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            let path = `./public/uploads`;
            callback(null, path);
        },
        filename: (req, file, callback) => {
            //originalname is the uploaded file's name with extn
            callback(null, file.originalname);
        }
    })
});

// ---------------------------!!!---------------------------- //
// -----------------------CHANGE HERE------------------------ //
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/user.html');
});

app.get('/wizard', function (req, res) {
    res.sendFile(__dirname + '/public/researcher.html');
});


app.get('/tasks', function (req, res) {
    console.log("Requested: GET /tasks");
    db.getTasks().then((tasks) => {
        res.send(tasks);
    })
    // let tasks = db.getTasks();
    // res.send(tasks);
});

app.get('/tasks/:taskid', function (req, res) {
    console.log("Requested: GET /tasks/" + req.params.taskid);
    // db.getTaskSync(req.params.taskid).then((task) => {
    //     res.send(task);
    // })
    let task = db.getTaskSync(req.params.taskid);
    res.send(task);
});

app.delete('/tasks/:taskid', function (req, res) {
    console.log("Requested: DELETE /tasks/:taskid");
    db.deleteTask(req.params.taskid);
    console.log("Task " + req.params.taskid + " should have been deleted");
    res.send("Task " + req.params.taskid + " eliminato.");
});

app.post('/tasks/:taskid', function (req, res) {
    db.saveTask(req.body);
    res.send("Adding or updating task + " + req.params.taskid);
});

app.post('/upload', uploading.single("image"), function(req, res) {
    console.log("WOOOOW! image uploaded");
    res.sendStatus(200);
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});

setTimeout(() => {console.log(db.getTasks());}, 1000);