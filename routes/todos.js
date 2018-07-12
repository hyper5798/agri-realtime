var express = require('express');
var router = express.Router();
var JsonFileTools =  require('../models/jsonFileTools.js');
var moment = require('moment');
var cloud = require('../models/cloud.js');
var deviceListPath = './public/data/deviceList.json';
var schedule = require('node-schedule');
var jobs = {};

function createJob(jobid, jobtime) {
  // *    *    *    *   *    *
  // 秒   分   時   ㄖ   月   年
  jobs[jobid] = schedule.scheduleJob(jobtime, function(){
		// do something you want...
		var formatStr = 'YYYY-MM-DD 23:59:59';
		var nowStr = moment().format(formatStr);
		var time = moment(nowStr,formatStr);
		var endDate = time.toDate();
		var timestamp = endDate.getTime();
		cloud.getPlayList(jobid, timestamp, function(err,results){
			if (err)
				console.log('???? createJob '+ jobid + ' ' + new Date() + '\n' + err);
			console.log(jobid + 'results: ' + results.length);
	  });
  });
}

function deleteJob(jobid) {
  jobs[jobid].cancel();
};

function scheduleDownloadImage(){
    /*schedule.scheduleJob('00 56 16 * * *', function(){
		console.log('scheduleDownloadImage :' + new Date());
	});*/
	var json =JsonFileTools.getJsonFromFile(deviceListPath);
	if (json.device_list) {
		cloud.getDeviceList(function(err, result){
      if(err) {
				return;
			}
			var list = result.device_list;
      for (let i=0; i < list.length; ++i) {
				let cam = list[i];
				let gid = cam.gid;
				createJob(gid, '55 59 23 * * *');
			}
		});
	}
}

scheduleDownloadImage();

router.route('/query')

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var gid     = req.query.gid;
		var endDate  = req.query.to;
		var startDate= req.query.from;
		var index    = req.query.index;
		var limit    = req.query.limit;
		var total    = req.query.total;
		/*cloud.query(mac, startDate, endDate, index, limit, total,function(err,results){
              if (err)
				return res.send(err);
			  return res.json(results);
		});*/
		
	});

router.route('/device_list')

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		cloud.getDeviceList(function(err,results){
              if (err)
				return res.send(err);
			  return res.json(results);
		});
	});

module.exports = router;

