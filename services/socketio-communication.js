const httpAPI = require('./httpAPI.js');
let io;
let userSocket;
let wizardSocket;
let chat;
let wizardRE = /.*\/wizard.*/;
const chatParticipants = 'chat participants';

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
        console.log("New wizard connected to chat");
        // TODO implement log of the wizard connected
    } else {
        userSocket = socket;
        console.log("New user connected to chat");
        // TODO implement log of the user connected
    }
    socket.join(chatParticipants);
    // TODO implement log of the join
    socket.on('chat message', (msg) => {
        if (socket === wizardSocket){
            sendToChatParticipants('wizard message', msg);
        } else {
            sendToChatParticipants('user message', msg);
        }
        // TODO implement log of the event
    });

    // not tested
    socket.on('Push img', (image) => {
        sendMessageTo(userSocket, 'Update image', image);
    });

    socket.on('GMQL http request', (options) => {
        httpAPI.httpRequest('http://geco.deib.polimi.it', options).then(response => {
            sendMessageTo(wizardSocket, response)
        });
    })
}

function sendToChatParticipants(e, message){
    sendMessageTo(chatParticipants, e, message);
}

function sendMessageTo(addressee, e, message) {
    chat.to(addressee).emit(e, message);
}

module.exports = {startIO};
