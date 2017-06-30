var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fbTemplate = require('fb-message-builder');
var mongoose = require('mongoose');
var Detail = require('./model');
var fs = require('fs');

mongoose.connect('mongodb://test:test@ds129442.mlab.com:29442/ssdetails');

// var {
//   Wit
// } = require('node-wit');
//
//
// var client = new Wit({
//   accessToken: '3DGBFIXDID64BGQVFZQJRVF77TMUDGB5'
// });
//
// client.message('what do you do?', {})
//   .then(function(data) {
//     console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
//     //console.log("Important fields: " + data.entities.intent[0].value);
//   })
//   .catch(console.error);

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
          sendAction(event.sender.id, "mark_seen");
          setTimeout(function() {
            sendAction(event.sender.id, "typing_on");
            receivedMessage(event);
          }, 2000);
        } else if (event.postback) {
          sendAction(event.sender.id, "mark_seen");
          setTimeout(function() {
            sendAction(event.sender.id, "typing_on");
            receivedPostback(event);
          }, 2000);
        } else if (event.delivery) {
          console.log("Message delivered!");
        } else if (event.read) {
          console.log("Message read!");
        } else if (event.message.attachments && !event.message.is_echo) {
          sendAction(event.sender.id, "typing_on");
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
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

// Message functions all related to sending various messages.

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


    callWitApi(messageText, function(err, data) {
      if (err) {
        console.error(err);
      } else {
        //console.log(data);
        //console.log("Important fields: " + JSON.stringify(data));
        var witIntent;
        if (data.entities.intent !== undefined) {
          witIntent = data.entities.intent[0].value;
        }
        //console.log(witIntent);
        switch (witIntent) {
          case 'greeting':
            getUserInfo(senderID, function(err, data) {
              text = ["Hello " + data.first_name + "!", "Howdy " + data.first_name + "!", "Yo " + data.first_name + "!"];
              sendTextMessage(senderID, new fbTemplate.Text(text[Math.floor(Math.random() * 3) + 0]).get());
            });
            break;
          case 'company_about':
            findDetails(senderID, witIntent);
            break;
          case 'get_name':
            sendTextMessage(senderID, new fbTemplate.Text("My name is Sopra Steria Bot!").get());
            break;
          case 'get_job':
            sendTextMessage(senderID, new fbTemplate.Text("I am here to help you with all the things related to Sopra Stera :D").get());
            break;
          case 'get_responsibility':
            findDetails(senderID, witIntent);
            break;
          case 'company_model':
            findDetails(senderID, witIntent);
            break;
          case 'company_locations':
            findDetails(senderID, witIntent);
            break;
          case 'company_workexp':
            findDetails(senderID, witIntent);
            break;
          case 'company_markets':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions':
            findDetails(senderID, witIntent);
            break;
          case 'company_plm_cimpa':
            findDetails(senderID, witIntent);
            break;
          case 'company_life':
            findDetails(senderID, witIntent);
            break;
          case 'thanks':
          getUserInfo(senderID, function(err, data) {
            sendTextMessage(senderID, new fbTemplate.Text("No need for that " + data.first_name + ". Always there to help :D").get());
          });
            break;
          default:
            sendTextMessage(senderID, new fbTemplate.Text("Sorry I didn't understand that! Please ask me questions related to Sopra Steria India only :)").get());
        }
      }
    });
  } else if (messageAttachments) {
    sendTextMessage(senderID, new fbTemplate.Text("I can only handle text messages currently :)").get());
  }
}

function findDetails(senderid, intentWit) {
  Detail.find({
    name: intentWit
  }, function(err, detail) {
    if (err) console.log(err);
    var str = detail[0].details;
    var results = [];
    var start = 0;
    for (var i = 640; i < str.length; i += 640) { //jump to max
      while (str[i] !== "." && i) i--; //go back to .
      if (start === i) throw new Error("impossible str!");
      results.push(str.substr(start, i - start)); //substr to result
      start = i + 1; //set next start
    }
    //add last one
    results.push(str.substr(start));

    for (var g = 0; g < results.length; g++) {
      if (g === results.length - 1) {

      } else {
        results[g] = results[g] + ".";
      }
    }

    sendMultipleTextMessages(senderid, results, 0);

    //console.log(detail[0].details);
    //var str = detail[0].details;
    //console.log(str);
    //   var sentences = str.split(/\.\s+/);
    //   var result = '';
    //   sentences.forEach(function(sentence) {
    //     if ((result + sentence).length <= 640) {
    //       if (result !== '') {
    //         result = result + ". " + sentence;
    //       } else {
    //         result = result + sentence;
    //       }
    //     } else {
    //       //console.log(result);
    //       //console.log("end of sentence\n");
    //       result = result + ".";
    //       //console.log(result);
    //       if (result) {
    //         sendTextMessage(senderid, new fbTemplate.Text(result).get());
    //       }
    //       result = '';
    //     }
    //   });
    //   setTimeout(function() {
    //     if (result) {
    //       sendTextMessage(senderid, new fbTemplate.Text(result).get());
    //     }
    //   }, 400);
  });
}

function sendMultipleTextMessages(sender, text, i) {
  if (i < text.length) {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token: token
      },
      method: 'POST',
      json: {
        recipient: {
          id: sender
        },
        message: {
          text: text[i]
        },
      }
    }, function(error, response, body) {
      if (error) {
        console.log('Error sending messages: ', error);
      } else if (response.body.error) {
        console.log('Error: ', response.body.error);
      }
      sendMultipleTextMessages(sender, text, i + 1);
    });
  } else return;
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
      console.error(response);
      //console.error(error);
    }
  });
}

function callWitApi(witMessage, cb) {
  var headers = {
    'Authorization': 'Bearer 7NI2EMFTGD54OCQQYOVCHHYS5WXVUCBH'
  };

  var options = {
    url: 'https://api.wit.ai/message?v=14/06/2017&q=' + encodeURIComponent(witMessage),
    headers: headers
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      cb(null, obj);
    } else {
      cb(error);
      console.error("Unable to send to wit!");
    }
  }

  request(options, callback);

}

function getUserInfo(user_id, cb) {
  var headers = {
    'Content-Type': 'application/json'
  };

  var options = {
    url: 'https://graph.facebook.com/v2.6/' + encodeURIComponent(user_id) + '?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=' + token,
    headers: headers
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var obj = JSON.parse(body);
      cb(null, obj);
    } else {
      cb(error);
      console.error("Unable to send to wit!");
    }
  }

  request(options, callback);

}

app.listen(app.get('port'), function() {
  console.log("running on port: " + app.get('port'));
});
