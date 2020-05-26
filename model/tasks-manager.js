const fs = require('fs');
const tasksFolder = './model/tasks/';
const loggerService = require('../services/logger.js');

let ls = new loggerService('tasks-manager');

class Database {
    constructor() {
        this.taskDict = new Map();

        updateDB(this)
            .then( function () {
                return ls.log('info', "Database initialized.")
            });

    }

    async getTasks() {
        let db = this;
        return ls.debug("Updating DB before getting tasks...")
            .then( function () {
                return updateDB(db);
            }).then( function () {
                ls.log('info', "Getting tasks...")
        }).then( function () {
            let tasks = [];
            for (let key of db.taskDict.keys()){
                tasks.push({
                    Title: db.taskDict.get(key).Title,
                    Number: key
                });
            }
            return tasks;
        }).catch( reason => {
            errorManagement(reason);
        })
    }

    getTaskSync(desiredTask) {
        if (this.taskDict.has(desiredTask) || this.taskDict.has(parseInt(desiredTask))) {
            try {
                let taskToGet = this.taskDict.get(parseInt(desiredTask)).path;
                return fs.readFileSync(taskToGet, 'utf8');
            } catch (err) {
                errorManagement(err,
                    desiredTask +
                    " <-- error retrieving the task");
            }
        } else {
            errorManagement(desiredTask + " <-- incorrect desired task for the dict");
            throw new SyntaxError("Task " + desiredTask + " seems to be not existing...");
        }
    }

    async saveTask(task) {
        let db = this;
        return ls.log('info', "Starting task-saving process")
            .then( function () {
                let syntaxError = false;
                try {
                    let jsonTask = task;
                    // Parsed to JSON to check if is a correct formatting
                    if (typeof(task) === 'string') jsonTask = JSON.parse(task);
                    if (jsonTask.hasOwnProperty('Title') && jsonTask.hasOwnProperty('Number')) {
                        fs.writeFileSync(
                            tasksFolder + jsonTask.Number + ".json",    // path where to save
                            JSON.stringify(jsonTask, null, 4),          // task to save (converted to string)
                            'utf8',                                     // characters encoding
                        );
                        return;
                    } else {
                        syntaxError = true;
                    }
                } catch (err) {}
                if (syntaxError){
                    throw new SyntaxError("Trying to save task with incorrect format.");
                } else throw new Error("An internal error occurred (Error parsing or saving JSON task, maybe)");
            })
            .then( function () {
                // After saving the file, I update the db
                return updateDB(db);
            }).catch( reason => {
                errorManagement("Error while saving task", reason);
                throw reason;
            })
    }

    async deleteTask(task) {
        let error = false
        task = parseInt(task);
        try {
            if (this.taskDict.has(task)) {
                let taskToDelete = this.taskDict.get(task).path;
                fs.unlinkSync(taskToDelete);
                await ls.info("DELETED following task: " + taskToDelete);
            } else {
                throw new SyntaxError("WARNING: no key in taskDict for task " + task + " as " + typeof (task));
            }
        } catch (err) {
            error = err;
            let message = "Error deleting this task: " + task
            error.message = message
            errorManagement(err, message);
        }
        await updateDB(this);
        if (error) {
            throw error;
        }
    }

}

async function updateDB(db) {
    return new Promise(((resolve, reject) => {
        return fs.readdir(tasksFolder, (err, files) => {
            if (err) {
                reject(err);
            } else {
                db.taskDict.clear();
                // Building taskDict structure
                files.filter(el => /\.json$/i.test(el))
                    .forEach((file) => {
                    let taskPath = tasksFolder + file;
                    try {
                        let taskInfo = getTaskTitleAndNumber(taskPath);
                        db.taskDict.set(
                            taskInfo.Number,            // key
                            {
                                Title: taskInfo.Title,  // value
                                path: taskPath          // value
                            });
                    } catch (err) {
                        errorManagement(err, "Error while reading specific task here: " + taskPath);
                        reject(err);
                    }
                });
                resolve();
            }
        })
    })).then( function () {
        return ls.log('info', "DB updated");
    }).catch( reason => {
        errorManagement("Error while updating the DB.", reason.message);
    });
}

function getTaskTitleAndNumber(taskPath) {
    let task = fs.readFileSync(taskPath, 'utf8');
    //console.log(task);
    task = JSON.parse(task);
    return {
        Title: task.Title,
        Number: task.Number
    };
}

function errorManagement(err, otherInfo) {
    if (arguments.length <= 2){
        ls.error(err, otherInfo)
            .catch( (reason => console.log("UNEXPECTED ERROR: " + reason.message)));
    } else throw new SyntaxError("Error manager called in " + __filename + "with incorrect arguments number");
/*
    if (arguments.length === 1) {
        if (err) {
            console.log("Logging error:");
            console.log(err);
        }
    } else if (arguments.length === 2){
        console.log(otherInfo);
        console.log(err);
    } else throw new SyntaxError("Error manager called in " + __filename + "with incorrect arguments number");
*/}

class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new Database();
        }
    }

    getInstance() {
        return Singleton.instance;
    }
}

module.exports = Singleton;
