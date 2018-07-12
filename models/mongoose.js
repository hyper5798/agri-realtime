var mongoose = require('mongoose');
var settings = require('../settings');
mongoose.Promise = global.Promise;
var dbPath = settings.dbpath;
mongoose.connect(dbPath);
module.exports = mongoose;