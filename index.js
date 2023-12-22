const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Connecting to Mongoose
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL)


//User Schema
const UserSchema = new Schema({
  username: String,  
});
const User = mongoose.model("User", UserSchema);

const ExcerciseSchema = new Schema({  
    user_id : { type: String, required: true },
    description: String,
    duration: Number,
    date: Date,  
});

const Excercise = mongoose.model("Excercise", ExcerciseSchema); 

app.use(cors())
app.use(express.static('public'))

//Middleware
app.use(express.urlencoded({ extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//All Users Route

app.get("/api/users", async (req, res) => {
  const users = await User.find ({}).select("_id username");
  if (!users) {
    res.send("No Users")
  } else {
    res.send(users);
  }
})

//First Route

app.post("/api/users", async(req, res) => {
  console.log(req.body)

  const userObj = new User({
    username: req.body.username
  })

  try {   
    const user = await userObj.save()
    console.log(user);
    res.json(user)

  } catch(err) {
    console.log(err)    
  }
})

// Second Route

app.post("/api/users/:_id/exercises", async(req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body
  try {
    const user = await User.findById(id)
    if(!user) {
      res.send("Could not find user")
    } else {
      const excerciseObj = new Excercise ({
        user_id: user._id,
        description, 
        duration, 
        date: date ? new Date(date) : new Date()
      })
      const excercise = await excerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: excercise.description,
        duration: excercise.duration,
        date: new Date(excercise.date).toDateString()
      })
    } 
  } catch(err) {
    console.log(err);
    res.send("There was an error saving this excercise")
  }
})

//Logs

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to , limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if(!user) {
    res.send("Couldn't find users")
    return;
  }
  let dateObj = {}
  if (from) {
    dateObj["$gte"] = new Date(from)    
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
   filter.date = dateObj;
  }
  const excercises = await Excercise.find(filter).limit(+limit ?? 500)

  const log = excercises.map(e => ({
    description: e.description,
    duration: e.duration, 
    date: e.date.toDateString()
  }))

  res.json({
    username: user.username,
    count: excercises.length, 
    _id: user._id,
    log
  })
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
