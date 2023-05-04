const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config()

mongoose.connect('mongodb://127.0.0.1:27017/exercise', { useNewUrlParser: true, useUnifiedTopology: true });

var set = mongoose.connection;
set.on('error', console.error.bind(console, 'connection error:'));
set.once('open', function() {
    console.log('Db connected successfully')
});

const User = mongoose.model('User',{
  username: { type: String, required: true, unique: true},
  description: String, 
  duration: Number,
  date: String,
  count: {type: Number, default: 0},
  log: [{
    description: String, 
    duration: Number,
    date: String
   }]
})

async function grabAllUsers(){
  const foundUsers = await User.find()
  const data = foundUsers
  return data
}

async function grabDetails(username){
  const foundUser = await User.findOne({ username: username })
  const data = foundUser
  return data
}

async function updateUser(id, duration, description, date, item){
   await User.findByIdAndUpdate( id, {
    duration: duration,
    description: description,
    date: date,
    $inc: { count: 1 },
    $push: { log: item }
  })

  const updatedUser = await User.findOne({ _id: id })
  const data = updatedUser
  return data
}

async function getLogs(id){
  const foundLogs = await User.findOne({ _id: id })
  const data = foundLogs
  return data
}

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', function(req, res){
  grabAllUsers()
    .then(data => {
      const users = []
      for (let i = 0; i < data.length; i++){
        const item = { username: data[i].username, _id: data[i]._id }
        users.push(item)
      }
      res.json({ users })
      
  })
    .catch(error => console.log(error))
})

app.post('/api/users', function(req, res){
  const name = req.body.username
  
  const newUser = new User({
    username: name
  })
  newUser.save();

  grabDetails(name)
    .then(data => {
      const user = data
      res.json({ username: user.username, _id: user._id})
    })
    .catch(error => console.log(error))
})

app.post('/api/users/:_id/exercises', function(req, res){
  const id = req.params._id
  const duration = req.body.duration
  const description = req.body.description
  let date = ""

  if (!(req.body.date)){
     date = new Date().toDateString()
  }else{
     date = req.body.date
     date = new Date(date).toDateString()
  }

  const item = {  
    description: description, 
    duration: duration,
    date: date 
  }

  updateUser(id, duration, description, date, item)
    .then(data => {
      const details = data
      res.json({ 
        _id: details._id, 
        username: details.username, 
        date: details.date, 
        duration: details.duration, 
        description: details.description
      })
    })
    .catch(error => console.log(error))
})

app.get('/api/users/:_id/logs', function(req, res){
  const id = req.params._id
  let numOfLogs = 0

  getLogs(id)
    .then(data => {
      const logs = []

      if (!(req.query.limit)){
        numOfLogs = data.length
      }
      else{
        numOfLogs = req.query.limit
      }

      for (let i = 0; i < numOfLogs; i++){
        logs.push(data.log[i])
      }

      res.json({ username: data.username, count: data.count, _id: data._id, log: logs })
    })
    .catch(error => console.log(error))
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
