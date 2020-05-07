const database = require('./tasksmanager.js');
const loggerService = require('../services/logger.js');

let ls = new loggerService('tasks-controller');
const db = new database().getInstance();

exports.getTasks = function (req, res) {
    ls.info("Requested to getTasks!", req.originalUrl)
        .then( () => {
            return db.getTasks();
        }).then((tasks) => {
            res.send(tasks);
            return ls.log('info', "Sent following tasks", tasks);
        }).catch(reason => errorManager(reason, res, req));
};

exports.getTask = function (req, res) {
    ls.info("Requested to get a specific tasks: " + req.params.taskid, req.originalUrl)
        .then( function () {
            return db.getTaskSync(req.params.taskid);
        })
        .then( function (task) {
            ls.info("Sending requested task.", task);
            return task
        })
        .then( function (task) {
            res.send(task)
        }).catch(errorManager);
}

exports.deleteTask = function (req, res) {
    ls.info("Requested to delete a tasks: " + req.params.taskid, req.originalUrl)
        .then( function () {
            return db.deleteTask(req.params.taskid);
        })
        .then( function () {
            return ls.info("Task " + req.params.taskid + " should have been deleted");
        })
        .then( function () {
            res.send("Task " + req.params.taskid + " eliminato.");
        })
        .catch(reason => errorManager(reason, res, req));
}

exports.setTask = function (req, res) {
    ls.info("Trying to save task " + req.params.taskid, req.body)
        .then( function () {
            return db.saveTask(req.body);
        })
        .then( function () {
                return ls.info("Task " + req.params.taskid + " should be saved");
        })
        .then( function () {
            res.send("Adding or updating task + " + req.params.taskid);
        })
        .catch(reason => errorManager(reason, res, req));
};

function errorManager(error, res, req) {
    let message = error.name + ": " + error.message;
    message += " - Requested URL: " + req.originalUrl;
    if (error.name === 'SyntaxError') {
        res.status(400).send(message);
    } else res.status(500).send(message);
    ls.error("Sending: " + message)
        .catch(error)
}
