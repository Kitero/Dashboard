const http = require('http');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const User = require('./models/user');
var request = require('request');
//var parseXML = require("xml-parse-from-string");


//connect to MongoDB
var url = "mongodb://cisa:bob!@cluster0-shard-00-00-xlcog.mongodb.net:27017,cluster0-shard-00-01-xlcog.mongodb.net:27017,cluster0-shard-00-02-xlcog.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true";
mongoose.connect(url)
var db = mongoose.connection;

//handle mongo error
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  // we're connected!
});

//use sessions for tracking logins
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

var server = http.createServer(app);

var io = require('socket.io').listen(server);

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('express-title')());
app.set('title', 'DashBoard');

// serve static files from template
app.use(express.static(__dirname + '/templateLogReg'));

// include routes
var routes = require('./routes/router');

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});

io.on('connection', function (socket) {
    console.log('A client joined');

    socket.on('disconnect', function() {
      console.log('A client left');
    });

    socket.on('widget', function (widget) {
      needRequest = false;
      switch (widget.type) {
        case "weather":
          var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + widget.city + '&appid=919c102f2c1c8e5f0df121faf05baf31';
          needRequest = true;
          break;
        case "convert":
          var url = "http://api.cambio.today/v1/quotes/" + widget.source + "/" + widget.dest + "/json?quantity=" + widget.value + "&key=1402|m6jBK9vZeEw^XFkQ4JOqMtcotM8_A0X5";
          needRequest = true;
          break;
        case "nasa":
          if (widget.id == 1) {
            var url = "https://api.nasa.gov/planetary/earth/imagery/?lon=" + widget.longitude + "&lat=" + widget.latitude + "&dim=0.08&date=2017-04-06&cloud_score=True&api_key=NNKOjkoul8n1CH18TWA9gwngW1s1SmjESPjNoUFo";
          } else if (widget.id == 2) {
            var url = "https://api.nasa.gov/planetary/apod?date=" + widget.date + "&api_key=NNKOjkoul8n1CH18TWA9gwngW1s1SmjESPjNoUFo";
          } else if (widget.id == 3) {
            var url = "https://epic.gsfc.nasa.gov/api/natural/date/" + widget.date;
          } else if (widget.id == 4) {
            var url ="https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&api_key=NNKOjkoul8n1CH18TWA9gwngW1s1SmjESPjNoUFo";
          }
          needRequest = true;
      }
      request.get(url, function (error, HttpResponse, HttpBody) {
        var Widget = {obj: HttpBody, type: widget.type, id: widget.id, date: widget.date};
        socket.emit('widget', Widget);
      });
    });
});

// listen on port 3000
server.listen(8080, function () {
  console.log('Express app listening on port 8080');
});
