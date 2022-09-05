//Imports
const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const db = mongoose.connection;
const bodyParser = require('body-parser');


const messageSchema = {
    name: {
        type: String,
        required: true
    },   
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    } 
}

const Message = mongoose.model("Message", messageSchema);

dotenv.config()

//Static files
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/css', express.static(__dirname + 'public/css'));
// app.use('/img', express.static(__dirname + 'public/img'));
// app.use('/js', express.static(__dirname + 'public/js'));

//Views
app.set('views', './views');
app.set('view engine', 'html');


//GET INDEX.HTML
app.get('', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

//POST METHOD
app.post('/submit', (req, res) => {

    let newMessage = new Message({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message
    })

    newMessage.save();

    // db.collection('messages').insertOne(data, (err, collection) => {
    //     if (err) throw err;
    //     console.log("Record inserted Successfully");
    // });
    res.redirect("localhost:3000/");
});

mongoose.connect(process.env.DB_CONNECT);

//Listen
app.listen(port, () => {
    console.log(`listening on port ${port}`)
});