var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var fbTemplate = require('fb-message-builder');
var mongoose = require('mongoose');
var Detail = require('./model');
var jobs = require('./data');
var fs = require('fs');

mongoose.connect('mongodb://' + process.env.DATABASE_KEY + ':' + process.env.DATABASE_PASS + '@ds129442.mlab.com:29442/ssdetails', function(res, err) {
  if (err) console.error("Mongo Error");
});

// var {
//   Wit
// } = require('node-wit');
//
//// var client = new Wit({
//   accessToken: ''
// });
//
// client.message('what do you do?', {})
//   .then(function(data) {
//     console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
//     //console.log("Important fields: " + data.entities.intent[0].value);
//   })
//   .catch(console.error);

var token = process.env.FB_TOKEN;

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
          case 'company_market_aerospace':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_banking':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_defence':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_energy':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_insurance':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_homeland':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_retail':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_public_sector':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_tele':
            findDetails(senderID, witIntent);
            break;
          case 'company_market_transport':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_banking':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_bigdata':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_cloud':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_cim':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_cybersecurity':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_enterprisearch':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_erp':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_hrs':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_itassets':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_mobility':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_pms':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_smartcities':
            findDetails(senderID, witIntent);
            break;
          case 'company_offerings_socialmedia':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_am':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_bps':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_consulting':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_im':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_sti':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_software':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_systemsint':
            findDetails(senderID, witIntent);
            break;
          case 'company_solutions_testing':
            findDetails(senderID, witIntent);
            break;
          case 'full_form_sopra':
            sendTextMessage(senderID, new fbTemplate.Text("It stands for Society Of Programmers Researchers and Analysts. Bet you didn't know that :p").get());
            break;
          case 'thanks':
            getUserInfo(senderID, function(err, data) {
              sendTextMessage(senderID, new fbTemplate.Text("No need for that " + data.first_name + ". Always there to help :D").get());
            });
            break;
          case 'company_jobs_skill':
            processJob(senderID, data.entities);
            break;
          case 'company_jobs':
            sendTextMessage(senderID, new fbTemplate.Text("Please tell me the skills you posses and the years of experience you have! Or you can view all the jobs without me sorting them for you :)").get());
            break;
          case 'company_all_jobs':
            processJob(senderID, 'all');
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

function processJob(senderid, entities) {
  var skills = [];
  var generic = new fbTemplate.Generic();
  var shortDesp;
  var message, yoe, i, j;
  if (entities !== 'all') {
    for (i = 0; i < entities.skills.length; i++) {
      skills.push(entities.skills[i].value);
    }
    yoe = entities.yoe[0].value.split(" ")[0];

    if (yoe === undefined) {
      sendTextMessage(senderid, new fbTemplate.Text("You forgot to tell me the amount of experience you have :)").get());
      return;
    } else if (skills.length === 0) {
      sendTextMessage(senderid, new fbTemplate.Text("Please tell me the skills you have :)").get());
      return;
    }

    for (i = 0; i < jobs.length; i++) {
      for (j = 0; j < skills.length; j++) {
        if (jobs[i].skills.includes(skills[j])) {
          if (jobs[i].exp_min <= yoe) {
            shortDesp = "Skills -";
            for (var k = 0; k < jobs[i].skills.length; k++) {
              shortDesp = shortDesp + " " + jobs[i].skills[k];
            }
            shortDesp = shortDesp + "\n" + "Experience - " + jobs[i].exp_min + "-" + jobs[i].exp_max + " years";
            message = generic.addBubble(jobs[i].title, shortDesp)
              .addImage('http://www.prestationintellectuelle.com/wp-content/uploads/2015/04/logo-sopra-steria-groupe.jpg')
              .addButton('Job Description', '' + i)
              .addButton('Sopra Jobs Site', 'https://steria.taleo.net/careersection/in_cs_ext_fs/jobsearch.ftl')
              .get();
          }
        }
      }
    }
  } else {
    for (i = 0; i < jobs.length; i++) {
      shortDesp = "Skills -";
      for (j = 0; j < jobs[i].skills.length; j++) {
        shortDesp = shortDesp + " " + jobs[i].skills[j];
      }
      shortDesp = shortDesp + "\n" + "Experience - " + jobs[i].exp_min + "-" + jobs[i].exp_max + " years";
      message = generic.addBubble(jobs[i].title, shortDesp)
        .addImage('http://www.prestationintellectuelle.com/wp-content/uploads/2015/04/logo-sopra-steria-groupe.jpg')
        .addButton('Job Description', '' + i)
        .addButton('Sopra Jobs Site', 'https://steria.taleo.net/careersection/in_cs_ext_fs/jobsearch.ftl')
        .get();
    }
  }
  if (message !== undefined) {
    sendGenericMessage(senderid, message);
  } else {
    sendTextMessage(senderid, new fbTemplate.Text("Sorry no jobs currently match your search criteria :)").get());
  }
  //console.log(message);
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
  switch (payload) {
    case '0':
      sendTextMessage(senderID, new fbTemplate.Text(jobs[0].desp).get());
      break;
    case '1':
      sendTextMessage(senderID, new fbTemplate.Text(jobs[1].desp).get());
      break;
    case '2':
      sendTextMessage(senderID, new fbTemplate.Text(jobs[2].desp).get());
      break;
    case '3':
      sendTextMessage(senderID, new fbTemplate.Text(jobs[3].desp).get());
      break;
    case '4':
      sendTextMessage(senderID, new fbTemplate.Text(jobs[4].desp).get());
      break;
  }
  console.log("Received postback for user %d and page %d with payload '%s' " +
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  //sendTextMessage(senderID, new fbTemplate.Text("Postback called").get());
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

function sendGenericMessage(recipientId, message) {
  var generic = new fbTemplate.Generic();
  var temp_message = message;
  //  generic
  //   .addBubble('Claudia.js', 'Deploy Node.js microservices to AWS easily')
  //   .addUrl('https://claudiajs.com')
  //   .addImage('https://claudiajs.com/assets/claudiajs.png')
  //   .addButton('Say hello', 'HELLO')
  //   .addButton('Go to Github', 'https://github.com/claudiajs/claudia')
  //   .addBubble('Claudia Bot Builder')
  //   .addImage('https://claudiajs.com/assets/claudia-bot-builder-video.jpg')
  //   .addButton('Go to Github', 'https://github.com/claudiajs/claudia-bot-builder')
  //   .addBubble('Claudia.js', 'Deploy Node.js microservices to AWS easily')
  //   .addButton('Say hello', 'HELLO')
  //   .addBubble('Claudia.js', 'Deploy Node.js microservices to AWS easily')
  //   .addButton('Say hello', 'HELLO')
  //   .addBubble('Claudia.js', 'Deploy Node.js microservices to AWS easily')
  //   .addButton('Say hello', 'HELLO')
  //   .get();
  // var data = ["Rohan", "Sood", "Yolo", "AWESOME"];
  //
  // for (var i = 0; i < data.length; i++) {
  //   temp_message = generic.addBubble(data[i], data[i])
  //     .addButton('Say hello', 'HELLO')
  //     .get();
  // }

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

function formatDate(date) {

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();
  monthIndex++;

  return day + '/' + monthIndex + '/' + year;
}

function callWitApi(witMessage, cb) {
  var headers = {
    'Authorization': 'Bearer ' + process.env.WIT_TOKEN
  };

  var date = formatDate(new Date());

  var options = {
    url: 'https://api.wit.ai/message?v=' + encodeURIComponent(date) + '&q=' + encodeURIComponent(witMessage),
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
