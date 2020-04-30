const got = require('got');

exports.httpRequest = async function (options) {
    return got('http://geco.deib.polimi.it', options).then(response => {
        console.log("RESPONSE: ", response.statusCode);
        console.log("BODY: ", response.body);
        return response
    });
};