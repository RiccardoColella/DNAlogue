// new socket.io instance
var socket = io('/chat');

// eventbus that deals with, amoung others, socket.io events received 
// from server, it "reroute" this events inside Vue components
var eventBus = new Vue();

// -------------------------------- COMPONENTS -----------------------------------

Vue.component('chat', {
    template: `
        <div class="child-chat child-container">
            <ul v-show="!loginPhase" class="message-list" ref="messageList">
                <li class="single-message-item" 
                    v-bind:class="{'my-message-item': message.isMy, 
                                   'foreigner-message-item': message.isForeigner}" 
                    v-for="(message, index) in messages" 
                    :key="index">
                    {{ message.text }}
                </li>
            </ul>
            <form v-show="!loginPhase" @submit.prevent="onSubmit" class="new-message-form">
                <input type="text" v-model="currentMessage" autocomplete="off" autofocus>
                <button>Send</button>
            </form>
            <form @submit.prevent="sendLogin" v-if="loginPhase" id="loginForm">
                
                <input type="text" v-model="loginFirst" name="firstname" placeholder="Firstname" autofocus>
                <input type="text" v-model="loginLast" name="lastname" placeholder="Lastname">
                <input type="text" v-model="loginCompany" name="company" placeholder="Your Company">
                <input type="text" v-model="loginRole" name="role" placeholder="Your Role">
                <button>Login</button>
            </form>
        </div>
    `,
    data: function () {
        return {
            loginPhase: true,
            loginFirst: "",
            loginLast: "",
            loginCompany: "",
            loginRole: "",

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
        },
        sendLogin: function () {
            var tempLogin = {
                firstName: this.loginFirst,
                lastName: this.loginLast,
                company: this.loginCompany,
                role: this.loginRole,
            }
            socket.emit('Login', tempLogin);
            this.loginPhase = false;
        }
    },
    mounted() {
        var self = this;

        eventBus.$on('userMessageReceived', function (userMessage) {
            self.messages.push({isMy: true, isForeigner: false, text: userMessage})
            self.$nextTick(() => {
                self.$refs.messageList.lastChild.scrollIntoView({behavior: "smooth"});
            })
        })

        eventBus.$on('wizardMessageReceived', function (wizardMessage) {
            self.messages.push({isMy: false, isForeigner: true, text: wizardMessage})
            self.$nextTick(() => {
                self.$refs.messageList.lastChild.scrollIntoView({behavior: "smooth"});
            })
        });
    }
});

Vue.component('tabs', {
    template: `
        <div class="child-tabs child-container">
            <ul class="tab-selector">

                <li :class="{ selected: selectedTab == index }"
                    v-for="(tab, index) in tabs" 
                    :key="index"
                    @click="switchTab(tab,index)">
                    {{ tabs[index].title }}
                    <span class="fa fa-close close-button" @click.stop="closeTab(index)">
                    </span>
                </li>
                
            </ul>
            <div class="tab-content" v-if="tabs.length !== 0">
                <img v-if="tabs[selectedTab].isImage" :src="tabs[selectedTab].src" alt="">
                <div v-if="tabs[selectedTab].isHTML" v-html="tabs[selectedTab].htmlContent">
                </div>
            </div>
        </div>    
    `,
    data: function () {
        return {
            tabs: [
            {
                title: "TIMG 1 di prova",
                isImage: true,
                isHTML: false,
                src: "./images/genomic_1.jpg"
            },
            {
                title: "API Call result di prova",
                isImage: false,
                isHTML: true,
                htmlContent: "<p style='color: brown;'>Paragrafo di prova</p>"
            },
            {
                title: "IMG 2 di prova",
                isImage: true,
                isHTML: false,
                src: "./images/genomic_2.png"
            },
            {
                title: "IMG 3 di prova",
                isImage: true,
                isHTML: false,
                src: "./images/genomic_3.png"
            }
            ],
            selectedTab : 0
        }
    },
    methods: {
        closeTab: function (index) {    

            var closeObject = {
                tab: this.tabs[index].title,
                index: index
            }

            socket.emit("tabClose", closeObject);

            this.tabs.splice(index, 1);

            if (this.selectedTab > (this.tabs.length - 1))
                this.selectedTab = this.selectedTab - 1;
        },
        switchTab: function (tab,index) {
            this.selectedTab = index;

            var tempTab = {
                tab: tab.title,
                index: index
            }
            socket.emit("tabSwitch", tempTab);
        },
        evalResponse: function (resp, script) {
            var response = resp;
            var output = "";
            eval(script);
            return output;
        }
    },
    mounted() {
        var self = this;

        eventBus.$on('newImageToShow', function (tab) {
            self.tabs.push(tab);
            self.selectedTab = self.tabs.length - 1;
            console.log(tab + " received from wizard");
        });

        eventBus.$on('newAPIToShow', function (api) {
            var newAPITab = api;
            var finalHTML = newAPITab.htmlContent;
            if (newAPITab.script)
                finalHTML = self.evalResponse(newAPITab.htmlContent, newAPITab.script);
            newAPITab.htmlContent = finalHTML;
            delete newAPITab.script;

            self.tabs.push(newAPITab);
            self.selectedTab = self.tabs.length - 1;
            console.log(newAPITab + " received from wizard");
        });
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

socket.on('Update image', function (tab) {
    eventBus.$emit('newImageToShow', tab)
});

socket.on('Send API results', function (api) {
    console.log("'Send API results' received")
    console.log(JSON.stringify(api))
    eventBus.$emit('newAPIToShow', api)
});

socket.on('Login', function (api) {
    console.log("'Login' received")
});