const winston = require('winston');

dateFormat = () => {
    return new Date(Date.now()).toUTCString()
}

class LoggerService {
    constructor(route) {
        this.log_data = null;
        this.route = route
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                }),
                new winston.transports.File({
                    filename: `./logs/log.log`
                })
            ],
            format: winston.format.printf((info) => {
                let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${this.route} | ${info.message} | `;
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

        return this;
    }

    setLogData(log_data) {
        this.log_data = log_data;
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
}

module.exports = LoggerService;
