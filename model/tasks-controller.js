const database = require('./tasksmanager.js');

const db = new database().getInstance();

exports.getTasks = function (req, res) {
    console.log("Requested: GET /tasks");
    db.getTasks().then((tasks) => {
        res.send(tasks);
    }).catch(reason => errorManager(reason, res, req));
};

exports.getTask = function (req, res) {
    console.log("Requested: GET /tasks/" + req.params.taskid);
    let task;
    try {
        task = db.getTaskSync(req.params.taskid);
    } catch (err) {
        errorManager(err, res, req)
    }
    res.send(task);
}

exports.deleteTask = function (req, res) {
    console.log("Requested: DELETE /tasks/:taskid\n", );
    db.deleteTask(req.params.taskid).then( () => {
        console.log("Task " + req.params.taskid + " should have been deleted");
        res.send("Task " + req.params.taskid + " eliminato.");
    }).catch(reason => errorManager(reason, res, req));
}

exports.setTask = function (req, res) {
    db.saveTask(req.body).then( () =>{
        res.send("Adding or updating task + " + req.params.taskid);
    }).catch(reason => errorManager(reason, res, req));
};

function errorManager(error, res, req) {
    let message = error.name + ": " + error.message + "\n";
    message += "Requested URL: " + req.url;
    if (error.name === 'SyntaxError') {
        res.status(400).send(message);
    } else res.status(500).send(message);
}
