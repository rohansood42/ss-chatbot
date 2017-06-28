var mongoose = require('mongoose');
var Detail = require('./model');
var fs = require('fs');

mongoose.connect('mongodb://test:test@ds129442.mlab.com:29442/ssdetails');

fs.readFile("C:\\Users\\Rohan Sood\\Documents\\Scraped Content\\life-in-sopra-steria.txt", function(err, data) {
  if (err) {
    return console.error(err);
  }
  //console.log("Asynchronous read: " + data.toString());
  var newDetail = new Detail({
    name: 'company_life',
    details: data.toString()
  });

  newDetail.save(function(err) {
    if (!err) {
      console.log("Saved Detail");
    }
    else {
      console.error(err);
    }
  });
});
