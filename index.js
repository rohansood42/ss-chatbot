var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//Routes

app.get('/', function(req,res) {
  res.send("Hi I am a chatbot!");
});

//Webhook

app.get('/webhook', function(req,res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === "yolo") {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.listen(app.get('port'), function() {
  console.log("running on port");
});
