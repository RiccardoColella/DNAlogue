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
                    @click = "switchTask(task, index)">
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
                    <span   class="fa fa-close close-button"
                            @click.stop="removeI(indexI)"></span>
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
                    <span   class="fa fa-close close-button"
                            @click.stop="removeA(indexA)"></span>
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
        switchTask: function (task, index) {
            this.selectedTask = index
            socket.emit('Switch Task', task.Title);
        },
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
            console.log(JSON.stringify(tempApi))
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
            var updated = this.tasks[this.selectedTask];
            updated.PrecompiledTexts.splice(index, 1);
            this.updateTask(updated);
        },
        removeI: function (index) {
            var updated = this.tasks[this.selectedTask];
            updated.Images.splice(index, 1);
            this.updateTask(updated);
        },
        removeA: function (index) {
            var updated = this.tasks[this.selectedTask];
            updated.PresavedAPIRequests.splice(index, 1);
            this.updateTask(updated);
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
        updateTask: function (updatedTask) {
            var self= this;

            axios
                .post('/tasks/' + updatedTask.Number, updatedTask)
                .then(response => (self.updateTaskList()));

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
        var self = this;

        this.updateTaskList();

        eventBus.$on('newPrecompiled', function (precompiled) {
            var updated = self.tasks[self.selectedTask];
            updated.PrecompiledTexts.push(precompiled);
            self.updateTask(updated);
        });

        eventBus.$on('newImageUploaded', function (imageObj) {
            var updated = self.tasks[self.selectedTask];
            updated.Images.push(imageObj);
            self.updateTask(updated);
        });

        eventBus.$on('newAPICall', function (api) {
            var updated = self.tasks[self.selectedTask];
            updated.PresavedAPIRequests.push(api);
            self.updateTask(updated);
        });
    }
});

Vue.component('tabs', {
    template: `
        <div class="child-tabs child-container">
            <ul class="tab-selector">

                <li :class="{ selected: selectedTab == index }"
                    v-for="(tab, index) in tabs" 
                    :key="index">
                    {{ tabs[index].title }}
                    
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
            tabs: [],
            selectedTab : 0
        }
    },
    methods: {
        closeTab: function (index) {    

            // var closeObject = {
            //     tab: this.tabs[index].title,
            //     index: index
            // }

            // socket.emit("tabClose", closeObject);

            this.tabs.splice(index, 1);

            if (this.selectedTab > (this.tabs.length - 1))
                this.selectedTab = this.selectedTab - 1;
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

        eventBus.$on('tabClose', function (tab) {
            self.closeTab(tab.index);
        });

        eventBus.$on('tabSwitch', function (tab) {
            self.selectedTab = tab.index;
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

Vue.component('task-manager', {
    template: `
        <div class="child-task-manager child-container">
            <form @submit.prevent="newPrecompiled" class="new-precompiled" action="">
                <input type="text" v-model="precompiledFormTemp" name="precompiled" placeholder="precompiled message">
                <button name="precompiled-button">ADD</button>
            </form>
            <form @submit.prevent="newImage" class="new-image" action="">
                <input type="file" ref="file" name="image-choose" accept="image/*" v-on:change="handleFileUpload()">
                <input type="text" v-model="imageDescription" name="image-description" placeholder="Description here...">
                <input type="submit" name="image-button">
            </form>
            <form @submit.prevent="newAPI" class="new-APICall" action="">
                <button name="API-button">ADD</button>
                <select v-model="selectedAPIMethod" name="api-method">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                <input v-model="selectedAPIUrl" type="text" name="API-url" placeholder="URL here...">
                <input v-model="selectedAPIName" type="text" name="API-Name" placeholder="Name here (it's possible to use parameters with {param name})">
                <label for="checkBody">Require Body:</label>
                <input v-model="selectedAPIHasBody" type="checkbox" id="checkBody" name="API-body" true-value="yes" false-value="no"></input>
                <textarea v-model="selectedAPIScript" name="API-script" rows="5" placeholder="Scipt here... \n'response' is the output of the API call\n'output' is where to put formatted HTML"></textarea>
            </form>
        </div>        
    `,
    data: function () {
        return {
            precompiledFormTemp: "",

            imageDescription: "",
            file: "",

            selectedAPIMethod: "",
            selectedAPIUrl: "",
            selectedAPIName: "",
            selectedAPIHasBody: "",
            selectedAPIScript: ""
        }
    },
    methods: {
        newPrecompiled: function () {
            if (this.precompiledFormTemp == "")
                return;
            eventBus.$emit('newPrecompiled', this.precompiledFormTemp);
            this.precompiledFormTemp = "";
        },
        newImage: function () {

            var self = this;

            if(this.file == "" || this.imageDescription == "")
                return;

            var tempImage = {
                path: "uploads/" + this.file.name,
                description: this.imageDescription
            }

            let formData = new FormData();

            formData.append('image', this.file);

            axios.post('/upload', formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }).then(function () {
                    console.log("Success");
                    console.log(tempImage);
                    if(tempImage != null)
                        eventBus.$emit('newImageUploaded', tempImage);
                    self.imageDescription = "";
                    self.file = "";
                    self.$refs.file.value = "";
                });

        },
        newAPI: function () {

            var self = this;

            if(this.selectedAPIMethod == "" || this.selectedAPIUrl == "" || this.selectedAPIName == "")
                return;

            var hasBody = false;
            if(this.selectedAPIHasBody === "yes")
                hasBody = true;
            
            var matches = this.selectedAPIUrl.match(/[^{\}]+(?=})/g);

            console.log("Found params: " + matches)
            if (!matches) {
                matches = [];
            }

            var tempAPI = {
                "method": this.selectedAPIMethod,
                "url": this.selectedAPIUrl,
                "params": matches,
                "actualParams": [],
                "hasBody": hasBody,
                "script": this.selectedAPIScript,
                "description": this.selectedAPIName
            }

            eventBus.$emit('newAPICall', tempAPI);
            this.selectedAPIMethod = "";
            this.selectedAPIUrl = "";
            this.selectedAPIName = "";
            this.selectedAPIHasBody = "";
            this.selectedAPIScript = "";

        },
        handleFileUpload: function () {
            this.file = this.$refs.file.files[0];
        }
    },
    mounted() {
        
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

socket.on('tabSwitch', function (tab) {
    eventBus.$emit('tabSwitch', tab)
    console.log("tab cambiato");
});

socket.on('tabClose', function (tab) {
    eventBus.$emit('tabClose', tab)
    console.log("tab chiuso");
});

socket.on('Send API results', function (api) {
    console.log("'Send API results' received")
    console.log(JSON.stringify(api))
    eventBus.$emit('newAPIToShow', api)
});

socket.on('Login', function (login) {
    console.log("'Login' received")

    var text = "Welcome " + login.firstName + "! Use this chat to interact with the GenoSurf chatbot.";
    socket.emit('chat message', text);
});