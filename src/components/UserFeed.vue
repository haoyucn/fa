
<template>
  <div class="feed">
    <div>
    <h1>Word</h1>
      <form v-on:submit.prevent="makeCard" class="tweetForm">
	<textarea v-model="word" placeholder=""/><br/>
      </form>

<h1>Meaning</h1>
      <form v-on:submit.prevent="makeCard" class="tweetForm">
	<textarea v-model="meaning" placeholder=""/><br/>
	<div class="buttonWrap">
	  <button class="primary" type="submit">Make a Flashcard</button>
	</div>
      </form>

    </div>
    <h1>My Flashcards</h1>
    <form v-on:submit.prevent="sort" class="tweetForm">
    <button class="primary" type="submit">Sort alphabetically</button>
    </form>
    <feed-list v-bind:wordList="wordList" />
  </div>
</template>

<script>
 import FeedList from './FeedList';
 export default {
   name: 'UserFeed',
   components: { FeedList },
   data () {
     return {
      word: '',
      meaning: '',
       text: '',
     }
   },
   computed: {
     wordList: function() {
       return this.$store.getters.wordList;
     },
   },
   created: function() {
     this.$store.dispatch('getwordList');
   },
   methods: {
     tweet: function() {
       this.$store.dispatch('addTweet',{
         tweet: this.text,
       }).then(tweet => {
	 this.text = "";
       });
     },
     makeCard: function() {
      this.$store.dispatch('addWord', {
        word: this.word,
        meaning: this.meaning
      }).then(words => {
        this.word = "";
        this.meaning = "";
      })
     },
     sort: function() {
      this.$store.dispatch('sort');
     }
   }
 }
</script>

<style scoped>
 .feed {
     width: 600px;
 }
 .tweetForm {
     background: #eee;
     padding: 10px;
     margin-bottom: 10px;
 }
 .buttonWrap {
     width: 100%;
     display: flex;
 }
 button {
     margin-left: auto;
     height: 2em;
     font-size: 0.9em;
 }
 textarea {
     width: 100%;
     height: 5em;
     padding: 2px;
     margin-bottom: 5px;
     resize: none;
     box-sizing: border-box;
 }
</style>
