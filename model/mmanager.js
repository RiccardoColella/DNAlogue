const tasksFolder = './model/tasks/';
const fs = require('fs');

class Database {
    constructor() {
        this.tasks = [];

        console.log("Initiating database...");
        retrieveTasks(this);
    }

    getTasks() {
        console.log("Getting tasks...");
        if (this.tasks.length < 1){
            console.log("Warning: no tasks. DB not yet initialized or no tasks saved.");
        }
        return this.tasks;
    }
}

function retrieveTasks(db) {
    fs.readdir(tasksFolder, (err, files) => {
            if (err) {
                console.log("Error finding files: " + err);
            } else {
                files.forEach((file) => {
                    db.tasks.push(tasksFolder + file);
                });
            }
        });
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
