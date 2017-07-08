var mongoose = require('mongoose');
var Detail = require('./model');
var fs = require('fs');

mongoose.connect('mongodb://test:test@ds129442.mlab.com:29442/ssdetails',function(err,res){
  if(err) throw err;
});

fs.readFile("C:\\Users\\Rohan Sood\\Documents\\Scraped Content\\Offerings\\Propert-Managemen-Solutions.txt", function(err, data) {
  if (err) {
    return console.error(err);
  }
  //console.log("Asynchronous read: " + data.toString());
  var newDetail = new Detail({
    name: 'company_offerings_pms',
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

//SOCIETY OF RESEARCH ANALYST
