const winston = require('winston');
const datetime = require('datetime');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const configClass = require('../config');
const config = new configClass().getInstance();

dateFormat = () => {
    return new Date(Date.now()).toUTCString()
}

class LoggerService {
    constructor(route) {
        this.sessID = config.getSessID();
        this.route = route;
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                }),
                new winston.transports.File({
                    filename: `./logs/log.log`
                })
            ],
            format: winston.format.printf((info) => {
                let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${this.route} | ${this.sessID} | ${info.message} | `;
                message = info.obj ?
                    message + ( typeof info.obj === 'object' ?
                        `\ndata:${JSON.stringify(info.obj, null, 4)} | ` :
                        "\ndata: " + info.obj + " | " ):
                    message;
                        //`\ndata:${JSON.stringify(info.obj, null, 4)} | ` : message;
                message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message;
                return message;
            })
        });

        this.csvWriter = createCsvWriter({
            path: './logs/logfile' + Date.now() + '.csv',

            header: [
                {id: 'datetime', title: 'DATE & TIME'},
                {id: 'sess', title: 'SESSION ID'},
                {id: 'type', title: 'TYPE'},
                {id: 'agent', title: 'AGENT'},
                {id: 'msg', title: 'MSG'},
                {id: 'content', title: 'CONTENT'}
            ]
        });

        config.emitter.on("Update SessID", () => {
            this.sessID = config.getSessID()
        });

        return this;
    }

    setSessID(sessID) {
        this.sessID = sessID;
    }

    async log(level, message, obj) {
        if (!(typeof obj === "undefined"))
            this.logger.log(level, message, {
                obj
            });
        else
            this.logger.log(level, message);
    }

    logSync(level, message, obj) {
        if (!(typeof obj === "undefined"))
            this.logger.log(level, message, {
                obj
            });
        else
            this.logger.log(level, message);
    }

    async info(message, obj) {
        obj ?
            this.logger.log('info', message, {
                obj
            }) : this.logger.log("info", message);
    }

    infoSync(message, obj) {
        obj ?
            this.logger.log('info', message, {
                obj
            }) : this.logger.log("info", message);
    }

    async debug(message, obj) {
        if (obj !== "undefined")
            this.logger.log('debug', message, {
                obj
            });
        else
            this.logger.log('debug', message);
    }

    debugSync(message, obj) {
        if (obj !== "undefined")
            this.logger.log('debug', message, {
                obj
            });
        else
            this.logger.log('debug', message);
    }

    async error(message, obj) {
        if (!(typeof obj === "undefined"))
            this.logger.log('error', message, {
                obj
            });
        else
            this.logger.log('error', message);
    }

    errorSync(message, obj) {
        if (!(typeof obj === "undefined"))
            this.logger.log('error', message, {
                obj
            });
        else
            this.logger.log('error', message);
    }

    csvOperation(type, agent, msg, content){
        let record = [
            {
                datetime: dateFormat(),
                sess: this.sessID,
                type: type,
                agent: agent,
                msg: msg,
                content: content
            }
        ]
        this.csvWriter.writeRecords(record)
            .then(() => this.info(type + " logged", content))
            .catch(error => this.errorSync(error.stack))
    };

    csvLogin(loginInfo) {
        this.csvOperation("Login", "User", "New login", loginInfo);
    }

    csvSwitchTask(taskName){
        this.csvOperation("Task switch", "Wizard", "Task switched", taskName);
    };

    csvSwitchTab(tabName){
        this.csvOperation("Tab switch", "User", "Tab switched", tabName);
    };

    csvCloseTab(tabName){
        this.csvOperation("Tab closed", "User", "Tab closed", tabName);
    };

    csvCreateTab(tabName){
        this.csvOperation("Tab creation", "Wizard", "Tab created", tabName);
    };

    csvMessage(msg, agent){
        this.csvOperation("Message", agent, msg, undefined);
    }

}

module.exports = LoggerService;
