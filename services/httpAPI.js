const got = require('got');
const loggerService = require('../services/logger.js');

let ls = new loggerService('httpAPI');

exports.httpRequest = async function (url, options) {
    options.maxRedirects = 20;
    return got(url, options).then( response => {
        ls.logSync(
            'info',
            `Response code ${response.statusCode} from ${response.ip} with following body` ,
            JSON.parse(response.body));
        return response
    });
};