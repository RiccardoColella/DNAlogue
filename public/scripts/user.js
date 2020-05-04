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
                <li v-for="(message, index) in messages" :key="index">{{ message }}</li>
            </ul>
        </div>
        <div class="form"> 
            <form @submit.prevent="onSubmit" class="chat-element">
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

Vue.component('tabs', {
    template: `
    <div id="tabs">
        <div class="tabs">

            <div :class="{ activeTab: selectedTab == index }"
                v-for="(tab, index) in tabs" 
                :key="index"
                @click="selectedTab = index">
                {{ tabs[index].title }}
                <span class="close" @click.stop="closeTab(index)">x</span>
            </div>

        </div>
        <div class="tab-content"> 
            <div v-if="tabs.length !== 0">
                <img v-for="(image, index) in tabs[selectedTab].images"         
                     :key="index"
                     :src="image">
            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
            tabs: [],
            selectedTab : 0
        }
    },
    methods: {

        closeTab: function (index) {    
            this.tabs.splice(index, 1);

            if (this.selectedTab > (this.tabs.length - 1))
                this.selectedTab = this.selectedTab - 1;
        }

    },
    mounted() {
        var self = this;

        eventBus.$on('newImageToShow', function (image) {
            var newTab = {
                title : "Tab " + self.tabs.length.toString(),
                images : [image]
            };
            self.tabs.push(newTab);
            self.selectedTab = self.tabs.length - 1;
            console.log(image + " received from wizard");
        })
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

socket.on('Update image', function (image) {
    eventBus.$emit('newImageToShow', image)
});