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
            self.messages.push("USER: " + userMessage);
        })

        eventBus.$on('wizardMessageReceived', function (wizardMessage) {
            self.messages.push("ME: " + wizardMessage);
        });

        eventBus.$on('textReadyToBeModified', function (text) {
            self.currentMessage = text;
        });
    }
});

Vue.component('tabs', {
    template: `
    <div id="tabs">
        <div class="tabs">
            <div>
                <span :class="{ activeTab: selectedTab == index }"
                      v-for="(tab, index) in tabs" 
                      :key="index"
                      @click="selectedTab = index">
                      {{ tabs[index].Title }}
                </span>
            </div>
        </div>
        <div class="tab-content"> 
            <div v-if="tabs.length !== 0">
                <div>
                    <p v-for="(text, index) in tabs[selectedTab].PrecompiledTexts"         
                        :key="index"
                        @click = "loadTextInChat(text)">
                        {{text}}
                    </p>
                </div>
                <div>
                    <img v-for="(image, index) in tabs[selectedTab].Images"         
                        :key="index"
                        :src="image"
                        @click="sendImageToUser(image)">
                </div>
                <!-- <form action="/upload" method="post" enctype="multipart/form-data">
                    <input type="file" name="file1">
                    <input type="submit" value="Upload">
                </form> -->

            </div>
        </div>
    </div>
    `,
    data: function () {
        return {
            tabs: [],
            selectedTab : 0,
            tasksList: []
        }
    },
    methods: {
        sendImageToUser: function (image) {
            socket.emit('Push img', image);
            console.log(image + " pushed to user");
        },
        loadTextInChat: function (text) {
            eventBus.$emit('textReadyToBeModified', text);
        },
        onImageSubmit: function () {

        }
    },
    mounted() {

        var self= this;

        axios.get('/tasks').then( function (response) {

            self.tasksList = response.data;

            for (let i = 0; i < self.tasksList.length; i++) {
                axios
                    .get('/tasks/' + self.tasksList[i].Number.toString())
                    .then(response => (self.tabs.push(response.data)));
            }

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