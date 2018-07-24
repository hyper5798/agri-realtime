var express = require('express');
var async = require('async');
var router = express.Router();
var JsonFileTools =  require('../models/jsonFileTools.js');
var moment = require('moment');
var cloud = require('../models/cloud.js');
var myapi =  require('../models/myapi.js');
var deviceListPath = './public/data/deviceList.json';
var profilePath = './public/data/profile.json';
var schedule = require('node-schedule');
var jobs = {};
var test = false;

function createJob(jobid, jobtime) {
  // *    *    *    *   *    *
  // 秒   分   時   ㄖ   月   年
    if (test == false) {
		jobs[jobid] = schedule.scheduleJob(jobtime, function(){
			// do something you want...
			console.log('**** schedule.scheduleJob ');
			toGetEvent(test, jobid);
		});
	} else {
		toGetEvent(test, jobid);
	}
}

function toGetEvent(test, gid) {
	if (test != true) {
		var time = moment();
	} else {
		var formatStr = 'YYYY-MM-DD 23:59:59';
		var nowStr = moment().format(formatStr);
		var time = moment(nowStr,formatStr);
		// time = time.subtract(4, 'days');
		console.log(nowStr);
	}

	var endDate = time.toDate();
	var timestamp = endDate.getTime();
	console.log(time);
	console.log(endDate);
	console.log(timestamp);

	cloud.getPlayList(gid, timestamp, function(err,results){
		if (err)
			console.log('???? createJob error : '+ gid + ' ' + new Date() + '\n' + err);
		if(results)
			console.log(gid + ' results: ' + results.length);
	});
}

function deleteJob(jobid) {
  jobs[jobid].cancel();
};

function scheduleDownloadImage(){
	var retry = 0;
    cloud.getDeviceList(function(err, result){
		if(err) {
			if(retry < 2) {
				++retry;
				scheduleDownloadImage();
			}
			return;
		}
		var list = result.device_list;
		if (list) {
			retry = 0;
			for (let i=0; i < list.length; ++i) {
				let cam = list[i];
				let gid = cam.gid;
				createJob(gid, '59 59 23 * * *');
				/*if (test) {
					break;
				}*/
			}
		} else {
			if(retry < 2) {
				++retry;
				scheduleDownloadImage();
			}
			return;
		}
	});
}

scheduleDownloadImage();

router.route('/query')

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var gid     = req.query.gid;
		toGetEvent(false, gid);
		var endDate  = req.query.to;
		var startDate= req.query.from;
		var maclist;
		try {
			var profile = JsonFileTools.getJsonFromFile(profilePath);
		    maclist = profile[gid];
		} catch (error) {
			return res.send(err);
		}
		if (maclist && maclist.length == 1 ) {
			var mac = maclist[0];
			mac = mac.toLowerCase();
			myapi.getEventList(mac, startDate, endDate,function(err,results){
				if (err)
				  return res.send(err);
				var value = {};
				value[mac] = results;
				return res.json(value);
		  });
		} 
		/* else if (maclist && maclist.length == 2) {
			var mac1 = maclist[0];
			var mac2 = maclist[1];
			mac1 = mac1.toLowerCase();
			mac2 = mac2.toLowerCase();
			async.series([
				function(next){
					myapi.getEventList(mac1, startDate, endDate, function(err1, result1){
						next(err1, result1);
					});
				},
				function(next){
					myapi.getEventList(mac2, startDate, endDate, function(err2, result2){
						next(err2, result2);
					});
				}
			], function(errs, results){
				if(errs) 
				    return res.send(err);
				var value = {};
				value[mac1] = results[0]['data'];
				value[mac2] = results[1]['data'];
				return res.json(value);
			});
		}*/
	});

router.route('/setting')

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		var gid     = req.query.gid;
		var macs = req.query.macs;
		var macList = macs.split(",");
		var profileObj;
		try {
			profileObj = JsonFileTools.getJsonFromFile(profilePath);
			if (profileObj == null) {
				profileObj = {};
			}
		} catch (error) {
			profileObj = {};
		}
		profileObj[gid] = macList;
		try {
			JsonFileTools.saveJsonToFile(profilePath, profileObj);
		} catch (error) {
			profileObj = {};
		}
		return res.json(profileObj);
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

