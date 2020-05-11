// new socket.io instance
var socket = io('/chat');

// eventbus that deals with, amoung others, socket.io events received 
// from server, it "reroute" this events inside Vue components
var eventBus = new Vue();

// -------------------------------- COMPONENTS -----------------------------------

Vue.component('chat', {
    template: `
        <div class="child-chat child-container">
            <ul class="message-list" ref="messageList">
                <li class="single-message-item" 
                    v-bind:class="{'my-message-item': message.isMy, 'foreigner-message-item': message.isForeigner}" 
                    v-for="(message, index) in messages" 
                    :key="index">
                    {{ message.text }}
                </li>
            </ul>
            <form @submit.prevent="onSubmit" class="new-message-form">
                <input type="text" v-model="currentMessage" autocomplete="off" autofocus>
                <button>Send</button>
            </form>
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
            self.messages.push({isMy: true, isForeigner: false, text: userMessage});
            self.$nextTick(() => {
                self.$refs.messageList.lastChild.scrollIntoView({behavior: "smooth"});
            })
        })

        eventBus.$on('wizardMessageReceived', function (wizardMessage) {
            self.messages.push({isMy: false, isForeigner: true, text: wizardMessage});
            self.$nextTick(() => {
                self.$refs.messageList.lastChild.scrollIntoView({behavior: "smooth"});
            })
        });

        // eventBus.$on('textReadyToBeModified', function (text) {
        //     self.currentMessage = text;
        //     self.onSubmit();
        // });
    }
});

// --------------------------------- MAIN APP ------------------------------------

var app = new Vue({
    el: '#main-app',
    data: {

    },
    methods: {

    }
});

// ----------------------------- EXTERNAL EVENTS ---------------------------------

// Follows a list of socket.io events received from server

socket.on('user message', function (msg) {
    eventBus.$emit('userMessageReceived', msg)
});

socket.on('wizard message', function (msg) {
    eventBus.$emit('wizardMessageReceived', msg)
});