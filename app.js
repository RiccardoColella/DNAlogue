const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const multer = require('multer');
const configClass = require('./config.js');
const config = new configClass().getInstance();
const loggerService = require('./services/logger.js');
const tasksController = require('./model/tasks-controller');
const socketIO = require('./services/socketio-communication');
const httpAPI = require('./services/httpAPI');

const port = config.getPort();

app.use(bodyParser.json());
app.use(express.static('public'));

let ls = new loggerService('app');

socketIO.startIO(http);
const db = tasksController.getDB();

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
    ls.info("Required page at '/'.")
        .then( () => config.increaseSessID())
        .then( () => res.sendFile(__dirname + config.getUserPage()));
});

app.get('/wizard', function (req, res) {
    ls.info("Required page at '/wizard'.")
        .then( () => res.sendFile(__dirname + config.getWizardPage()));
});

app.get('/tasks', tasksController.getTasks);

app.get('/tasks/:taskid', tasksController.getTask);

app.delete('/tasks/:taskid', tasksController.deleteTask);

app.post('/tasks/:taskid', tasksController.setTask);

app.post('/upload', uploading.single("image"), function(req, res) {
    ls.info("Received request at '/upload'.", req.body).then( () => {
        res.sendStatus(200);
    });
});

http.listen(port, function(info){
    ls.log('info', "Server listening on port " + port, {'port': port}).catch( () => {
        throw new Error("Unexpected error while trying to log in http.listen callback...\n" + info);
    });
});

/*
setTimeout(() => {
    db.getTasks().then( (res) => {
        console.log(res);
    });
}, 2000);


setTimeout(() => {
    db.getTasks().then( (res) => {
        console.log(res);
    });
}, 2000);

let options = {
    'method': 'GET',
    'hostname': 'geco.deib.polimi.it',
    'path': '/genosurf/api/field',
    'headers': {
    },
    'maxRedirects': 20
};

setTimeout(() => {
    httpAPI.httpRequest('http://geco.deib.polimi.it', options).catch( reason => {
        ls.logSync('info', "Unexpected problem executing httpRequest", reason);
    });
}, 3000);
*/