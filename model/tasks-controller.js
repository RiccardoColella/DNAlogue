const database = require('./tasksmanager.js');

const db = new database().getInstance();

exports.getTasks = function (req, res) {
    console.log("Requested: GET /tasks");
    db.getTasks().then((tasks) => {
        res.send(tasks);
    });
};

exports.getTask = function (req, res) {
    console.log("Requested: GET /tasks/" + req.params.taskid);
    let task = db.getTaskSync(req.params.taskid);
    res.send(task);
}

exports.deleteTask = function (req, res) {
    console.log("Requested: DELETE /tasks/:taskid\n", );
    db.deleteTask(req.params.taskid).then( () => {
        console.log("Task " + req.params.taskid + " should have been deleted");
        res.send("Task " + req.params.taskid + " eliminato.");
    });
}

exports.setTask = function (req, res) {
    db.saveTask(req.body).then( () =>{
        res.send("Adding or updating task + " + req.params.taskid);
    });
};