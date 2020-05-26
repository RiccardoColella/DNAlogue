// can't import logger.js in this module, dkw.
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;
//const loggerService = require('./services/logger.js');
const config_file = './config.json';

//let ls = new loggerService('config');

class Options {
    constructor() {
        try {
            this.options = JSON.parse(fs.readFileSync(config_file));
        } catch (err) {
            //ls.errorSync("Error reading config file", err.message);
            console.log("Error reading config file. " + err.message);
        }
        this.emitter = new EventEmitter();
        //ls.infoSync("Read config options", this.options);
        console.log("Read config options. " + this.options)
    }

    getPort() {
        return this.options.port;
    }
    
    getUserPage() {
        return this.options.HTMLs.user;
    }
    
    getWizardPage() {
        return this.options.HTMLs.wizard;
    }

    getUploadFolderPath() {
        return this.options.paths.uploadFolder;
    }
    
    getPublicFolderPath() {
        return this.options.paths.publicFolder;
    }
    
    getSessID() {
        return this.options.sessID;
    }
    
    increaseSessID() {
        this.options.sessID += 1;
        this.emitter.emit("Update SessID");
        const jsonString = JSON.stringify(this.options, null, 4);
    
        fs.writeFile(config_file, jsonString, err => {
            if (err) {
                //ls.errorSync('Error writing file', err);
                console.log("Error writing file. " + err);
            } else {
                //ls.infoSync('Successfully updated config file');
                console.log("Successfully updated config file");
            }
        })
    }
}


class Singleton {
    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new Options();
        } else {
            this.getInstance();
        }
    }


    getInstance() {
        return Singleton.instance;
    }
}

let myEx = new Singleton().getInstance()
console.log(myEx.getPort())

module.exports = Singleton;
