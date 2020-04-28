const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const multer = require('multer');
const taskscontroller = require('./model/tasks-controller.js');
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

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/wizard', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/tasks', taskscontroller.getTasks);

app.get('/tasks/:taskid', taskscontroller.getTask);

app.delete('/tasks/:taskid', taskscontroller.deleteTask);

app.post('/tasks/:taskid', taskscontroller.setTask);

app.post('/upload', uploading.single("image"), function(req, res) {
    console.log("WOOOOW! image uploaded");
    res.sendStatus(200);
});

http.listen(port, function(){
    console.log('listening on *:' + port);
});

setTimeout(() => {
    db.getTasks().then( (res) => {
        console.log(res);
    });
}, 1000);