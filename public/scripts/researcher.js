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

        eventBus.$on('textReadyToBeModified', function (text) {
            self.currentMessage = text;
            // self.onSubmit(); // DISABLED, we allow the wizard to edit before sending it
        });
    }
});

Vue.component('tasks', {
    template: `
        <div class="child-tasks child-container">

            <ul class="tasks-selector tab-selector">
                <li v-for="(task, index) in tasks"
                    :key="index"
                    :class="{ selected: selectedTask == index }"
                    @click = "selectedTask = index">
                    {{ tasks[index].Title }}
                </li>
            </ul>
            
            <form @submit.prevent="onTaskCreation" class="tasks-newtask">
                <input  v-model="newTaskName" type="text">
                <button @click.prevent="newTask" class="new-task-button">New Task</button>
                <button @click.prevent="deleteTask" class="remove-task-button">Remove current Task</button>
            </form>

            <ul v-if="tasks[selectedTask] != null" class="task-content tab-selector">
                <li v-for="(text, indexP) in tasks[selectedTask].PrecompiledTexts"         
                    :key="'P' + indexP"
                    @click = "loadTextInChat(text)">
                    {{ text }}
                        <span   class="fa fa-close close-button" 
                                @click.stop="removeP(indexP)">
                        </span>
                </li>

                <li v-for="(image, indexI) in tasks[selectedTask].Images"         
                    :key="'I' + indexI">
                    <img @click = "sendImageToUser(image)" :src="image.path" alt="">
                    <span class="image-description">
                        {{image.description}}
                    </span>
                    <span class="fa fa-close close-button"></span>
                </li>

                <li v-for="(api, indexA) in tasks[selectedTask].PresavedAPIRequests"
                    :key="'A' + indexA">
                    <form @submit.prevent="sendCallToServer(api,indexA)" action="">
                        <button name="callButton">Invio</button>
                        <input type="text" name="callMethod" :value="api.method" disabled>
                        <input type="text" name="callUrl" :value="api.url" readonly>
                        <span class="API-description">{{  api.description  }}</span>
                        <input v-if="api.hasBody" v-model = "api.actualBody" type="text" name="callBody" placeholder="body">
                        <input  v-for="(param, indexAP) in tasks[selectedTask].PresavedAPIRequests[indexA].params"
                                :key="indexAP"
                                type="text" name="callParam" :placeholder="param"
                                v-model = "api.actualParams[indexAP]">
                    </form>
                    <span class="fa fa-close close-button"></span>
                </li>

            </ul>
               
        </div>
    `,
    data: function () {
        return {
            tasks: [],
            selectedTask : 0,
            tasksList: [],

            newTaskName: "",

        }
    },
    methods: {
        sendImageToUser: function (image) {
            var tempImg = {

                title: image.description,
                isImage: true,
                isHTML: false,
                src: image.path  

            }
            socket.emit('Push img', tempImg);
            console.log(tempImg.src + " pushed to user");
        },
        sendCallToServer: function (api,indexA) {
            var tempURL = api.url;

            var i;
            for (i = 0; i < api.params.length; i++) {
                var idi = "{" + api.params[i].toString() + "}";
                var ido = api.actualParams[i];
                tempURL = tempURL.replace(idi, ido);
            }

            var tempApi = {
                path: tempURL,
                method: api.method,
                script: api.script,
                description: api.description 
            };

            if (api.hasBody === true) {
                tempApi.body = api.actualBody;
            }

            socket.emit('GMQL http request', tempApi);
            console.log(tempApi.path + " pushed to server");

            api.actualParams = [];
            api.actualBody = "";
        },
        loadTextInChat: function (text) {
            eventBus.$emit('textReadyToBeModified', text);
        },
        onImageSubmit: function () {

        },
        removeP: function (index) {

        },
        newTask: function () {

            var self= this;

            var newTask = {
                "Title": this.newTaskName,
                "Number": Date.now(),
                "Description": "",
                "Images": [],
                "PrecompiledTexts": [],
                "PresavedAPIRequests": []
            };

            axios
                .post('/tasks/' + newTask.Number, newTask)
                .then(response => (self.updateTaskList()));

            this.newTaskName = "";
        },
        deleteTask: function () {
            var self= this;

            axios
                .delete('/tasks/' + self.tasks[self.selectedTask].Number)
                .then(response => (self.updateTaskList()));
        },
        updateTaskList: function () {
            var self= this;
            self.tasksList = [];
            self.tasks = [];

            axios.get('/tasks').then( function (response) {
                

                self.tasksList = response.data;

                for (let i = 0; i < self.tasksList.length; i++) {
                    axios
                        .get('/tasks/' + self.tasksList[i].Number.toString())
                        .then(response => (self.tasks.push(response.data)));
                }

            });
        }
    },
    mounted() {

        this.updateTaskList();

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
}); // we can receive it??
