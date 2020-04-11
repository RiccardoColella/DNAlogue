const tasksFolder = './model/tasks/';
const fs = require('fs');

class Database {
    constructor() {
        this.tasks = [];
        this.tasksPath = [];
        this.taskDict = new Map();

        console.log("Initiating database...");
        retrieveTasks(this);
    }

    getTasks() {
        console.log("Getting tasks...");
        if (this.tasksPath.length < 1){
            console.log("Warning: no tasks. DB not yet initialized or no tasks saved.");
        }
        return this.tasksPath;
    }

    getTask(desiredTask) {
        if (typeof (desiredTask) == 'number') {
            try {
                return this.tasks[desiredTask];
            } catch (err) {
                errorManagement(err, "Invalid number for the required task.");
            }
        } else if (typeof (desiredTask) == 'string') {
            try {
                return this.tasks[this.taskDict.get(desiredTask)];
            } catch (err) {
                errorManagement(err, "Invalid name for the required task.");
            }
        } else throw new SyntaxError(
            "Invalid desired task type. Could be number or string, found " + typeof(desiredTask)
        );
    }

    saveTask(task) {
        try {
            let jsonTask = task;
            // Parsed to JSON to check if is a correct formatting
            if (typeof(task) === 'string') jsonTask = JSON.parse(task);
            // Converted to string to be saved and logged
            const stringTask = JSON.stringify(jsonTask, null, 4);
            console.log("Saving task:\n" + stringTask);
            fs.writeFile(tasksFolder + jsonTask.name + ".json", stringTask, 'utf8', errorManagement);
            // After saving the file, I update the db
            retrieveTasks(this);
        } catch (err) {
            errorManagement(err, "Error parsing or saving JSON task.");
        }
    }
}

function retrieveTasks(db) {
    fs.readdir(tasksFolder, (err, files) => {
            if (err) {
                errorManagement(err, "Error finding tasks");
            } else {
                db.taskDict.clear();
                //I clear the taskPath array
                db.tasksPath.splice(0, db.tasksPath.length);
                files.forEach((file, index) => {
                    // Put the task name and path in all available tasks
                    let taskPath = tasksFolder + file;
                    db.tasksPath.push(taskPath);
                    // Read the effective task and store it
                    fs.readFile(taskPath, 'utf8', (err, taskRead) => {
                        if (err) errorManagement(err, "Error while reading a task from directory.");
                        db.tasks[index] = JSON.parse(taskRead);
                    });
                    // Save a dictionary to retrieve task from his name
                     const fileName = file.substr(0, file.length - 5);
                     db.taskDict.set(fileName, index);
                });
            }
        });
}

function errorManagement(err, otherInfo) {
    if (arguments.length === 1) {
        if (err) {
            console.log("Logging error:");
            console.log(err);
        }
    } else if (arguments.length === 2){
        console.log(otherInfo);
        console.log(err);
    } else throw new SyntaxError("Error manager called in " + __filename + "with incorrect arguments number");
}

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
