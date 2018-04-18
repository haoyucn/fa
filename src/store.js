import Vue from 'vue';
import Vuex from 'vuex';

import axios from 'axios';

Vue.use(Vuex);

 const getAuthHeader = () => {
   return { headers: {'Authorization': localStorage.getItem('token')}};
 }

export default new Vuex.Store({
  state: {
    user: {},
    token: '',
    loginError: '',
    registerError: '',
    wordList: [],
  },
  getters: {
    user: state => state.user,
    wordList: state => state.wordList,
    getToken: state => state.token,
    loggedIn: state => {
      if (state.token === '')
       return false;
      return true;
    },
    loginError: state => state.loginError,
    registerError: state => state.registerError,
    feed: state => state.feed,
  },
  mutations: {
    setUser (state, user) {
      state.user = user;
    },
    setToken (state, token) {
      state.token = token;
      if (token === '')
	localStorage.removeItem('token');
      else
	localStorage.setItem('token', token)
},
    setLoginError (state, message) {
      state.loginError = message;
    },
    setRegisterError (state, message) {
      state.registerError = message;
    },
    setFeed (state, feed) {
      state.feed = feed;
    },
    setWordList (state, wordList) {
      state.wordList = wordList;
    },
  },
  actions: {
    // Registration, Login //
    register(context,user) {
      axios.post("/api/users",user).then(response => {
	context.commit('setUser', response.data.user);
	context.commit('setToken',response.data.token);
	context.commit('setRegisterError',"");
	context.commit('setLoginError',"");
      }).catch(error => {
	context.commit('setLoginError',"");
  context.commit('setUser',{});
  context.commit('setToken','');

	if (error.response) {
	  if (error.response.status === 403)
	    context.commit('setRegisterError',"That email address already has an account.");
	  else if (error.response.status === 409)
	    context.commit('setRegisterError',"That user name is already taken.");
	  return;
	}
	context.commit('setRegisterError',"Sorry, your request failed. We will look into it.");
      });
    },
    login(context,user) {
      axios.post("/api/login",user).then(response => {
	context.commit('setUser', response.data.user);
	context.commit('setToken',response.data.token);
	context.commit('setRegisterError',"");
	context.commit('setLoginError',"");
      }).catch(error => {
	context.commit('setRegisterError',"");
	if (error.response) {
	  if (error.response.status === 403 || error.response.status === 400)
	    context.commit('setLoginError',"Invalid login.");
	  context.commit('setRegisterError',"");
	  return;
	}
	context.commit('setLoginError',"Sorry, your request failed. We will look into it.");
      });
    },
    logout(context,user) {
      context.commit('setUser', {});
      context.commit('setToken','');
    },

    addWord(context,card) {
      console.log("get asdfasdf");
      axios.post("/api/users/" + context.state.user.id + "/words",card, getAuthHeader()).then(response => {
        console.log("getting here");
        console.log(response);
        console.log(this.wordList);
	return context.dispatch('getwordList');
      }).catch(err => {
	console.log("addTweet failed:",err);
      });
    },


    // Users //
    // get a user, must supply {username: username} of user you want to get
    getUser(context,user) {
      return axios.get("/api/users/" + user.id).then(response => {
	context.commit('setUserView',response.data.user);
      }).catch(err => {
	console.log("getUser failed:",err);
      });
    },
    // get tweets of a user, must supply {id:id} of user you want to get tweets for
    getUserTweets(context,user) {
      return axios.get("/api/users/" + user.id + "/tweets").then(response => {
	context.commit('setFeedView',response.data.tweets);
      }).catch(err => {
	console.log("getUserTweets failed:",err);
      });
    },

    getUserCards(context, user) {
      return axios.get("/api/users/" + user.id + "/words").then(response => {
	context.commit('setWordList',response.data.cards);
      console.log(response.data.cards);
      console.log("FF");
      }).catch(err => {
	console.log("getUserTweets failed:",err);
      });
      // return axios.get()
    },

    sort(context) {
      return axios.put("/api/users/" +  context.state.user.id + "/sort").then(response => {
	context.commit('setWordList',response.data.cards);
      console.log(response.data.cards);
      console.log("FF");
      }).catch(err => {
	console.log("getUserTweets failed:",err);
      });
      // return axios.get()
    },


    deleteWord(context, item) { //FIXME**
      console.log("delete called");
      console.log(item.meaning + " " + item.id);
      return axios.delete("/api/users/" + context.state.user.id + "/feed/" + item.id, getAuthHeader()).then(response => {
       context.dispatch('getwordList');
      }).catch(err => {
       console.log("unfollow failed:",err);
      });
    },

      getwordList(context) {
        console.log("called");
        return axios.get("/api/users/" + context.state.user.id + "/feed").then(response => {
  	context.commit('setWordList',response.data.cards);
    console.log("##");
        }).catch(err => {
  	console.log("getFeed failed:",err);
        });
    },
        // Initialize //
    initialize(context) {
      let token = localStorage.getItem('token');
      if(token) {
       // see if we can use the token to get my user account
       axios.get("/api/me",getAuthHeader()).then(response => {
         context.commit('setToken',token);
         context.commit('setUser',response.data.user);
       }).catch(err => {
         // remove token and user from state
        localStorage.removeItem('token');
         context.commit('setUser',{});
         context.commit('setToken','');
       });
      }
    },
  }
});
