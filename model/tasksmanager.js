const tasksFolder = './model/tasks/';
const fs = require('fs');

class Database {
    constructor() {
        this.taskDict = new Map();

        console.log("Initiating database...");
        updateDB(this);
    }

    async getTasks() {
        console.log("Updating DB before getting tasks...");
        await updateDB(this);
        console.log("Getting tasks...");
        let tasks = [];
        for (let key of this.taskDict.keys()){
            tasks.push({
                Title: this.taskDict.get(key).Title,
                Number: key
            });
        }
        return tasks;
    }

    getTaskSync(desiredTask) {
        try {
            let taskToGet = this.taskDict.get(parseInt(desiredTask)).path;
            return fs.readFileSync(taskToGet, 'utf8');
        } catch (keyError) {
            errorManagement(keyError,
                desiredTask +
                " <-- incorrect desired task for the dict");
        }
    }

    async saveTask(task) {
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
                // After saving the file, I update the db
                 await updateDB(this);
            } else errorManagement(new SyntaxError("Trying to save task with incorrect format"));
        } catch (err) {
            errorManagement(err, "Error parsing or saving JSON task.");
        }
    }

    async deleteTask(task) {
        task = parseInt(task);
        try {
            if (this.taskDict.has(task)) {
                let taskToDelete = this.taskDict.get(task).path;
                fs.unlinkSync(taskToDelete);
                console.log("DELETED following task: " + taskToDelete);
            } else console.log("WARNING: no key in taskDict for task " + task, typeof (task));
        } catch (err) {
            errorManagement(err, "Error deleting this task: " + task);
        }
        await updateDB(this);
    }

}

async function updateDB(db) {
    await fs.readdir(tasksFolder, (err, files) => {
        if (err) {
            errorManagement(err, "Error while reading task directory");
        } else {
            db.taskDict.clear();
            // Building taskDict structure
            files.forEach((file) => {
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
                }
            });
        }
    });
    console.log("DB UPDATED");
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
