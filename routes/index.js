var express = require('express');
var router = express.Router();
var cloud =  require('../models/cloud.js');
var myapi =  require('../models/myapi.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var sessionPath = './public/data/session.json';
var mysessionPath = './public/data/mysession.json';
var profilePath = './public/data/profile.json';
var autoPath = './public/data/auto.json';
var deviceListPath = './public/data/deviceList.json';
var dataPath = './public/data/data.json';
var finalPath = './public/data/final.json';
var async = require('async');

function findUnitsAndShowSetting(req,res,isUpdate){
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var macTypeMap = {};

		if(err){
			errorMessae = err;
		}else{
			if(+units.length>0){
				successMessae = '查詢到'+units.length+'筆資料';
			}
		}
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('setting', { title: 'Setting',
			units:req.session.units,
			user:req.session.user,
			success: successMessae,
			error: errorMessae
		});
	});
}

module.exports = function(app) {
  app.get('/', checkLogin);
  app.get('/', function (req, res) {
	
	var profileObj;
	try {
		JsonFileTools.saveJsonToFile(dataPath, {});
		profileObj = JsonFileTools.getJsonFromFile(profilePath);
		if (profileObj == null) {
			profileObj = {};
			JsonFileTools.saveJsonToFile(profilePath, profileObj);
		}
	} catch (error) {
		profileObj = {};
		JsonFileTools.saveJsonToFile(profilePath, profileObj);
	}
	getData(function(err, data){
		if(err) {
			res.render('index', { title: 'Index',
				user:req.session.user,
				camList: [],
				sensorList: [],
				profile: profileObj
			});
		} else {
            res.render('index', { title: 'Index',
				user:req.session.user,
				camList: data.camList,
				sensorList: data.sensorList,
				profile: profileObj
			});
		}
	});
  });

  app.get('/control', checkLogin);
  app.get('/control', function (req, res) {
	var autoObj;
	try {
		autoObj = JsonFileTools.getJsonFromFile(autoPath);
		if (autoObj == undefined || autoObj == null) {
			autoObj = {};
			JsonFileTools.saveJsonToFile(autoPath, autoObj);
		}
	} catch (error) {
		autoObj = {};
		JsonFileTools.saveJsonToFile(autoPath, autoObj);
	}
	try {
		finalObj = JsonFileTools.getJsonFromFile(finalPath);
		if (finalObj == undefined || finalObj == null) {
			autoObj = {};
			JsonFileTools.saveJsonToFile(finalPath, finalObj);
		}
	} catch (error) {
		finalObj = {};
		JsonFileTools.saveJsonToFile(finalPath, finalObj);
	}
	getData(function(err, data){
		if(err) {
			res.render('control', { title: 'Control',
			    user:req.session.user,
			    camList: [],
			    mapList: [],
			    sensorList: [],
				profile: autoObj,
				final: finalObj
		    });
		} else {
            res.render('control', { title: 'Control',
			    user:req.session.user,
			    camList: data.camList,
			    mapList: data.mapList,
			    sensorList: data.sensorList,
			    profile: autoObj,
				final: finalObj
		    });
		}
	});
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
	//Reset data to empty
	try {
		JsonFileTools.saveJsonToFile(dataPath, {});
	} catch (error) {
		JsonFileTools.saveJsonToFile(dataPath, {});
	}
	req.session.user = null;
  	// var name = req.flash('post_name').toString();
	res.render('user/login', { title: 'Login',
		error: ''
	});
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	var post_name = req.body.account;
	var	post_password = req.body.password;
	var successMessae,errorMessae;
  	console.log('Debug login post -> name:'+post_name);
	console.log('Debug login post -> password:'+post_password);
	myapi.toLogin(post_name, post_password, function(err, result) {
		if(err) {
			res.render('user/login', { title: 'Login',
				error: err
			});
		} else {
			JsonFileTools.saveJsonToFile(mysessionPath, result);
			req.session.user = result;
			return res.redirect('/');
		}
	})
  });

  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '');
    res.redirect('/login');
  });

  app.get('/account', checkLogin);
    app.get('/account', function (req, res) {

		console.log('render to account.ejs');
		var refresh = req.flash('refresh').toString();
		var myuser = req.session.user;
		var successMessae,errorMessae;
		res.render('user/account', { title: 'Account', // user/account
			user:myuser,//current user : administrator
			users:[],//All users
			error: errorMessae,
			success: successMessae
		});
    });

  	app.post('/account', checkLogin);
  	app.post('/account', function (req, res) {
		return res.redirect('/account');
  	});
};

function checkLogin(req, res, next) {
	if(myapi.isExpired(req.session.user)) {
		//Expired is true
		errorMessae = '請重新登錄!';
		res.render('user/login', { title: 'Login',
			error: errorMessae
		});
	} else {
		next();
	}
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', 'Have login!');
    res.redirect('back');//返回之前的页面
  } else {
	  next();
  }
}

function getData(callback) {
	var data;
	try {
		data = JsonFileTools.getJsonFromFile(dataPath);
		if (data == undefined || data == null || data.mapList === undefined) {
			getCloudData(function(err, result){
				if(err){
					return callback(err, {});
				}
				return callback(null, result);
			})
		} else {
			return callback(null, data);
		}
	} catch (error) {
		JsonFileTools.saveJsonToFile(dataPath, {});
		return callback(error, {});
	}
}

function getCloudData(callback) {
    async.series([
		function(next){
			cloud.getDeviceList(function(err1, result1){
				next(err1, result1);
			});
		},
		function(next){
			myapi.getDeviceList(function(err2, result2){
				next(err2, result2);
			});
		},
		function(next){
			myapi.getMapList(function(err3, result3){
				next(err3, result3);
			});
		}
	], function(errs, results){
		if(errs) {
			return callback(errs, null);
		} else {
			console.log(results);   // results = [result1, result2, result3]
			var result_1 = results[0];
			var sensorList = results[1];
			var mapList = results[2];//map list
			var mapObj = {}, gidStr = '';
			if(result_1.device_list) {
				for (let i=0; i < result_1.device_list.length; ++i) {
					gidStr = gidStr + result_1.device_list[i].gid + ',';
				}
				console.log('**** IPCAM gid list: ' + gidStr);
			}
			if(mapList) {
				for (let i=0; i < mapList.length; ++i) {
					mapObj[mapList[i]['deviceType']] = mapList[i]['typeName'];
				}
			}
			if (sensorList) {
				for (let j=0; j < sensorList.length; ++j) {
					let sensor = sensorList[j];
					sensor['device_mac'] = sensor['device_mac'].toLowerCase();
					sensor['typeName'] = mapObj[sensor['fport']];
				}
			}
			
			var data = {camList: result_1.device_list,
				    	sensorList: sensorList,
						mapList: mapList };
			try {
				JsonFileTools.saveJsonToFile(dataPath, data);
			} catch (error) {
				JsonFileTools.saveJsonToFile(dataPath, {});
			}
			return callback(null, data);
		}
	});
}