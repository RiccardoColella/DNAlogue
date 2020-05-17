const httpAPI = require('./httpAPI.js');
const loggerService = require('../services/logger.js');

let ls = new loggerService('SocketIO');
let io;
let userSocket;
let wizardSocket;
let chat;
let wizardRE = /.*\/wizard.*/;
const chatParticipants = 'chat participants';
const toWizard = 'Wizard chat'
const events = {
    chatMsg: 'chat message',
    wizMsg: 'wizard message',
    usrMsg: 'user message',
    imgPush: 'Push img',
    sendUpImg: 'Update image',
    GMQLreq: 'GMQL http request',
    HTTPres: 'Send to wizard results',
    tabClose: "tabClose",
    tabSwitch: "tabSwitch"

}

function startIO(http) {
    io = require("socket.io")(http);
    chat = io.of('/chat');
    chat.on('connection', onChatConnection);
    //TODO implement registration/login event for the user
    //TODO implement the StartSession event from the wizard
}

function onChatConnection(socket){
    //console.log("New socket: " + JSON.stringify(socket.handshake, null, 4));
    if (wizardRE.test(socket.handshake.headers.referer)){
        wizardSocket = socket;
        socket.join(toWizard);
        ls.infoSync("New wizard connected to the chat");
    } else {
        userSocket = socket;
        ls.infoSync("New user connected to the chat");
    }
    socket.join(chatParticipants);
    ls.logSync('debug', "Joining " + socket + " at chatParticipants room")
    socket.on(events.chatMsg, (msg) => {
        let eventName;
        let message;
        if (socket === wizardSocket){
            eventName = events.wizMsg;
            message = {
                eventName: eventName,
                message : msg
            };
            ls.infoSync("Received message from wizardSocket. Forwarding it to chatParticipants", message);
        } else {
            eventName = events.usrMsg;
            message = {
                eventName: eventName,
                message : msg
            };
            ls.infoSync("Received message from a non wizardSocket. Forwarding it to chatParticipants", message);
        }
        sendToChatParticipants(eventName, msg);
    });

    socket.on(events.imgPush, (image) => {
        ls.infoSync("Received 'push img' event for image at: " + image);
        sendMessageTo(chatParticipants, events.sendUpImg, image);
    });

    socket.on(events.GMQLreq, (options) => {
        ls.infoSync("GMQL request incoming", options);
        httpAPI.httpRequest('http://geco.deib.polimi.it', options).then(response => {
            sendMessageTo(toWizard, events.HTTPres, response)
        });
    })

    socket.on(events.tabClose, (details) => {
        ls.infoSync("User closed tab \"" + details.tab + "\"");
        sendMessageTo(toWizard, events.tabClose, details)
    })

    socket.on(events.tabSwitch, (details) => {
        ls.infoSync("User changed view to tab \"" + details.tab + "\"");
        sendMessageTo(toWizard, events.tabSwitch, details)
    })
}

function sendToChatParticipants(e, message){
    sendMessageTo(chatParticipants, e, message);
}

function sendMessageTo(addressee, e, message) {
    chat.to(addressee).emit(e, message);
}

module.exports = {startIO};
