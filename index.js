var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fbTemplate = require('fb-message-builder');
var {
  Wit,
  log
} = require('node-wit');

var client = new Wit({
  accessToken: '3DGBFIXDID64BGQVFZQJRVF77TMUDGB5'
});

client.message('i am from new delhi', {})
  .then(function(data) {
    //console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
    console.log("Important fields: " + data.entities.location[0].value);
  })
  .catch(console.error);

client.message('what are you called?', {})
  .then(function(data) {
    //console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
    console.log("Important fields: " + data.entities.intent[0].value);
  })
  .catch(console.error);

  client.message('where do you live?', {})
    .then(function(data) {
      //console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
      console.log("Important fields: " + data.entities.intent[0].value);
    })
    .catch(console.error);

var token = "EAAFt9hEhaegBANKr74s3MfvydguZAxsQBqB63ZCPVsXNpj3OiKprtuKFOnNQXwVZAJXaI7b1Aqdhlr54WqVP8E9ZCRCPxDDBWYGu8jmgi2DgRPK2y9eZCQvhEUTjn2AdMZAuUWtg4sQAEZBpUnb33Uz1KjqDw7jAH8zBaKBP7WXHQZDZD";

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//Routes

app.get('/', function(req, res) {
  res.send("Hi I am a chatbot!");
});

//Webhook

app.get('/webhook/', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === "yolo") {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function(req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message && event.message.text && !event.message.is_echo) {
          sendAction(event.sender.id, "typing_on");
          receivedMessage(event);
        } else if (event.postback) {
          sendAction(event.sender.id, "typing_on");
          receivedPostback(event);
        } else if (event.delivery) {
          console.log("Message delivered!");
        } else if (event.read) {
          console.log("Message read!");
        } else if (event.message.attachments && !event.message.is_echo) {
          sendAction(event.sender.id, "typing_on");
          receivedMessage(event);
        } else {
          if (!event.message.is_echo) {
            console.log("Webhook received unknown event: ", event);
          }
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderID);
        break;
      default:
        sendTextMessage(senderID, new fbTemplate.Text('What\'s your favorite House in Game Of Thrones?').get());
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, new fbTemplate.Text("Message with attachment received").get());
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload;
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, new fbTemplate.Text("Postback called").get());
}

function sendAction(recipientId, sender_action) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: sender_action
  };

  callSendAPI(messageData);
}

function sendGenericMessage(recipientId, messageText) {
  var generic = new fbTemplate.Generic();
  var temp_message = generic
    .addBubble('Claudia.js', 'Deploy Node.js microservices to AWS easily')
    .addUrl('https://claudiajs.com')
    .addImage('https://claudiajs.com/assets/claudiajs.png')
    .addButton('Say hello', 'HELLO')
    .addButton('Go to Github', 'https://github.com/claudiajs/claudia')
    .addBubble('Claudia Bot Builder')
    .addImage('https://claudiajs.com/assets/claudia-bot-builder-video.jpg')
    .addButton('Go to Github', 'https://github.com/claudiajs/claudia-bot-builder')
    .get();

  var messageData = {
    recipient: {
      id: recipientId
    },
    message: temp_message

  };

  setTimeout(function() {
    sendAction(recipientId, "typing_off");
    callSendAPI(messageData);
  }, 1000);
}

function sendTextMessage(recipientId, textObject) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: textObject
  };
  setTimeout(function() {
    sendAction(recipientId, "typing_off");
    callSendAPI(messageData);
  }, 1000);

}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: token
    },
    method: "POST",
    json: messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", messageId, recipientId);
      }
    } else {
      console.error("Unable to send message.");
      //console.error(response);
      //console.error(error);
    }
  });
}

app.listen(app.get('port'), function() {
  console.log("running on port: " + app.get('port'));
});
