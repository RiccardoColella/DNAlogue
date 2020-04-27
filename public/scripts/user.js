// new socket.io instance
var socket = io('/chat');

// eventbus that deals with, amoung others, socket.io events received 
// from server, it "reroute" this events inside Vue components
var eventBus = new Vue();



Vue.component('chat', {
    template: `
    <div id="chat">
        <div class="dialogue">
            <ul>
                <li v-for="message in messages">{{ message }}</li>
            </ul>
        </div>
        <div class="form"> 
            <form @submit.prevent="onSubmit">
                <input autocomplete="off" v-model="currentMessage">
                <button>Send</button>
            </form>
        </div>
    </div>
    `,
    data: function () {
        return {
            currentMessage: null,
            messages: []
        }
    },
    methods: {
        onSubmit: function () {
            if (this.currentMessage) {
                socket.emit('chat message', this.currentMessage);
                this.currentMessage = null;
            }
        }
    },
    mounted() {
        var self = this;

        eventBus.$on('userMessageReceived', function (userMessage) {
            self.messages.push("ME: " + userMessage)
        })

        eventBus.$on('wizardMessageReceived', function (wizardMessage) {
            self.messages.push("BOT: " + wizardMessage)
        });
    }
});

var app = new Vue({
    el: '#page',
    data: {

    },
    methods: {

    }
});

// Follows a list of socket.io events received from server+

socket.on('user message', function (msg) {
    eventBus.$emit('userMessageReceived', msg)
});

socket.on('wizard message', function (msg) {
    eventBus.$emit('wizardMessageReceived', msg)
});