// Express Setup
const express = require('express');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('public'));

// Knex Setup
const env = process.env.NODE_ENV || 'development';
const config = require('./knexfile')[env];
const knex = require('knex')(config);

// bcrypt setup
let bcrypt = require('bcrypt');
const saltRounds = 10;

// jwt setup
const jwt = require('jsonwebtoken');
let jwtSecret = process.env.jwtSecret;
if (jwtSecret === undefined) {
  console.log("You need to define a jwtSecret environment variable to continue.");
  knex.destroy();
  process.exit();
}

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token)
    return res.status(403).send({ error: 'No token provided.' });
  jwt.verify(token, jwtSecret, function(err, decoded) {
    if (err)
      return res.status(500).send({ error: 'Failed to authenticate token.' });
    // if everything good, save to request for use in other routes
    req.userID = decoded.id;
    next();
  });
}

app.post('/api/login', (req, res) => {
  if (!req.body.email || !req.body.password)
    return res.status(400).send();
  knex('users').where('email',req.body.email).first().then(user => {
    if (user === undefined) {
      res.status(403).send("Invalid credentials");
      throw new Error('abort');
    }
    return [bcrypt.compare(req.body.password, user.hash),user];
  }).spread((result,user) => {
    if (result) {
       let token = jwt.sign({ id: user.id }, jwtSecret, {
        expiresIn: 86400 // expires in 24 hours
       });
      res.status(200).json({user:{username:user.username,name:user.name,id:user.id},token:token});
    } else {
       res.status(403).send("Invalid credentials");
    }
    return;
  }).catch(error => {
    if (error.message !== 'abort') {
      console.log(error);
      res.status(500).json({ error });
    }
  });
});

app.post('/api/users', (req, res) => {
  if (!req.body.email || !req.body.password || !req.body.username || !req.body.name)
    return res.status(400).send();
  knex('users').where('email',req.body.email).first().then(user => {
    if (user !== undefined) {
      res.status(403).send("Email address already exists");
      throw new Error('abort');
    }
    return knex('users').where('username',req.body.username).first();
  }).then(user => {
    if (user !== undefined) {
      res.status(409).send("User name already exists");
      throw new Error('abort');
    }
    return bcrypt.hash(req.body.password, saltRounds);
  }).then(hash => {
    return knex('users').insert({email: req.body.email, hash: hash, username:req.body.username,
				 name:req.body.name, role: 'user'});
  }).then(ids => {
    return knex('users').where('id',ids[0]).first().select('username','name','id');
  }).then(user => {
      let token = jwt.sign({ id: user.id }, jwtSecret, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).json({user:user,token:token});
    return;
  }).catch(error => {
    if (error.message !== 'abort') {
      console.log(error);
      res.status(500).json({ error });
    }
  });
});

app.post('/api/users/:id/words', verifyToken, (req, res) => {
  console.log("RRR");
  console.log("working");
  let id = parseInt(req.params.id);
  console.log(id);
  console.log(req.userID);
  if (id !== req.userID) {
    res.status(403).send();
    return;
  }
  knex('users').where('id',id).first().then(user => {
    return knex('words').insert({user_id: id, word:req.body.word, meaning:req.body.meaning});
  }).then(ids => {
    return knex('words').where('id',ids[0]).first();
  }).then(card => {
    console.log(card);
    res.status(200).json({card:card});
    return;
  }).catch(error => {
    // console.log(error);
    // res.status(500).json({ error });
  });
});


app.get('/api/users/:id/words', (req, res) => {
  let id = parseInt(req.params.id);
  knex('users').join('words','users.id','words.user_id')
    .where('users.id',id)
    .select('word','meaning','name', 'words.id').then(cards => {
      res.status(200).json({cards:cards});
    }).catch(error => {
      res.status(500).json({ error });
    });
});

app.put('/api/users/:id/sort', (req, res) => {
  let id = parseInt(req.params.id);
  knex('users').join('words','users.id','words.user_id')
    .where('users.id',id)
    .orderBy('word')
    .select('word','meaning','name', 'words.id').then(cards => {
      res.status(200).json({cards:cards});
    }).catch(error => {
      res.status(500).json({ error });
    });
});

app.get('/api/users/:id', (req, res) => {
  let id = parseInt(req.params.id);
  // get user record
  knex('users').where('id',id).first().select('username','name','id').then(user => {
    res.status(200).json({user:user});
   }).catch(error => {
     res.status(500).json({ error });
   });
 });


// unfollow someone
app.delete('/api/users/:id/feed/:card',verifyToken, (req,res) => {
  // id of the person who is following
  let id = parseInt(req.params.id);
    // check this id
  if (id !== req.userID) {
    res.status(403).send();
    return;
  }
  // id of the person who is being followed
  let card = parseInt(req.params.card);
  // make sure both of these users exist
  knex('users').where('id',id).first().then(user => {
    return knex('words').where({'id': card, 'user_id': id}).first();
  }).then(user => {
    // delete the entry in the followers table
    return knex('words').where({'id': card, 'user_id': id}).first().del();
  }).then(ids => {
    res.sendStatus(200);
    return;
  }).catch(error => {
    console.log(error);
    res.status(500).json({ error });
  });
});

app.get('/api/users/:id/feed', (req,res) => {
  console.log("aaaaaa");
  // id of the person we are interested in
  let id = parseInt(req.params.id);

  // get people this person is following
  knex('users').where('id',id).then(followed => {
    // get tweets from this users plus people this user follows
    return knex('words')
      .where('words.user_id',id)
      .select('word', 'meaning', 'words.id');
  }).then(cards => {
    res.status(200).json({cards:cards});
  }).catch(error => {
    console.log(error);
    res.status(500).json({ error });
  });
});

// Get my account
app.get('/api/me', verifyToken, (req,res) => {
  knex('users').where('id',req.userID).first().select('username','name','id').then(user => {
    res.status(200).json({user:user});
  }).catch(error => {
    res.status(500).json({ error });
  });
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
