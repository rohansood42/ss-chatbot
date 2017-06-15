var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var detailSchema = new Schema({
  name: { type: String, unique: true },
  details: { type: String, unique: true }
});

var Detail = mongoose.model('Detail', detailSchema);

module.exports = Detail;
