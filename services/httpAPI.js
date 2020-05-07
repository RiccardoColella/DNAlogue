const got = require('got');

exports.httpRequest = async function (url, options) {
    return got(url, options).then(response => {
        console.log("RESPONSE: ", response.statusCode);
        console.log("BODY: ", response.body);
        return response
    });
};