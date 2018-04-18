<template>
  <div>
    <div v-for="item in wordList" class="primary">
    <div class="primary">
    <p class="word">{{ item.word }}</p>
    <p class="meaning">{{ item.meaning }}</p>
    </div>
    <form v-on:submit.prevent="deleteCard" class="tweetForm">
    <div class="buttonWrap">

    <button class="primary" type="submit" v-on:click.prevent="deleteCard(item)">Delete</button>
    </div>
    </form>
    </div>
  </div>
</template>

<script>
 import moment from 'moment';
 export default {
   name: 'FeedList',
   props: ['wordList'],
  methods: {
     formatTweet: function(text) {
       return linkify(text, {
         defaultProtocol: 'https'
       });
     },
     deleteCard: function(item) {
     console.log("dete");
     console.log(item);
        this.$store.dispatch('deleteWord', item);
     }
   },
 }
</script>

<style scoped>
 .word {
    font-weight: bold;
    color: #666;
    border-bottom: 1px solid #ddd;
 }
 .meaning {

 }
 .item {
     border-bottom: 1px solid #ddd;
     padding: 10px;
 }
 .tweet {
     margin-top: 0px;
 }
 .idline {
     margin-bottom: 0px;
 }
 .user {
     font-weight: bold;
     margin-right: 10px;
 }
 .handle {
     margin-right: 10px;
     color: #666;
 }
 .time {
     float: right;
     color: #666;
 }
</style>
