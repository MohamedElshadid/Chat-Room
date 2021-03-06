/**
 * First we will load all of this project's JavaScript dependencies which
 * includes Vue and other libraries. It is a great starting point when
 * building robust, powerful web applications using Vue and Laravel.
 */

require('./bootstrap');

window.Vue = require('vue').default;

import axios from 'axios';
import Vue from 'vue'
import VueChatScroll from 'vue-chat-scroll'
Vue.use(VueChatScroll)

import Toaster from 'v-toaster'
import 'v-toaster/dist/v-toaster.css'
Vue.use(Toaster, {timeout: 5000})

Vue.component('message', require('./components/Message.vue').default);

const app = new Vue({
    el: '#app',
    data:{
        message:'',
        chat:{
            message:[],
            user:[],
            color:[],
            time:[],
            styleMesage:[],
        },
        typing:'',
        numbersOfUsers:0
    },
    watch:{
        message(){
            Echo.private(`chat`)
            .whisper('typing', {
                name: this.message
            });
        }
    },
    methods:{
        send(){
            if(this.message.length != 0)
            {
                this.chat.message.push(this.message)
                this.chat.user.push('You')
                this.chat.color.push('success')
                this.chat.time.push(this.getTime())
                
                axios.post('/send',{
                    message:this.message,
                    chat:this.chat
                }).then(response=>{
                    this.message=''
                }).catch(error=>{
                    console.log(error);
                })
            }
        },
        getTime()
        {
            let date = new Date()
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            return hours + ':' + minutes + ' ' + ampm;
          
        },
        getOldMessage(){
            axios.post('/getOldMessage').then(response=>{
                if(response.data != '')
                    this.chat = response.data;
            }).catch(error=>{
                console.log(error);
            })
        },
        deleteSession()
        {
            axios.post('/deleteSession').then(response=>{
                this.$toaster.success('Chat history is deleted')
                this.chat.message = []
            });
        }
    },
    mounted()
    {
        this.getOldMessage()
        Echo.private(`chat`)
        .listen('ChatEvent', (e) => {
            this.chat.message.push(e.message)
            this.chat.user.push(e.user)
            this.chat.color.push('warning')
            this.chat.time.push(this.getTime())
            axios.post('/saveToSession',{chat:this.chat}).then(response=>{
            }).catch(error=>{
                console.log(error);
            })
        }).listenForWhisper('typing', (e) => {
            if(e.name != '')
                this.typing = 'typing...'
            else
                this.typing = ''
        })
        Echo.join(`chat`)
        .here((users) => {
            this.numbersOfUsers = users.length
        })
        .joining((user) => {
            this.numbersOfUsers += 1;
            this.$toaster.success(user.name+' is joined the chat room')
        })
        .leaving((user) => {
            this.numbersOfUsers -= 1;
            this.$toaster.warning(user.name+' is leaved the chat room')
        })
        .error((error) => {
            console.error(error);
        });
    }
});
