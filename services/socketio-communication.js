var io;
var userSocket;
var wizardSocket;
var chat;
var wizardRE = /.*\/wizard.*/;
const chatpartecipants = 'chat partecipants';

function startIO(http) {
    io = require("socket.io")(http);
    chat = io.of('/chat');
    chat.on('connection', onChatConnection);
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
    socket.join(chatpartecipants);
    // TODO implement log of the join
    socket.on('chat message', (msg) => {
        if (socket == wizardSocket){
            sendToChatPartecipants('wizard message', msg);
        } else {
            sendToChatPartecipants('user message', msg);
        }
        // TODO implement log of the event
    });
}

function sendToChatPartecipants(e, message){
    sendMessageTo(chatpartecipants, e, message);
}

function sendMessageTo(addressee, e, message) {
    chat.to(addressee).emit(e, message);
}

module.exports = {startIO};
