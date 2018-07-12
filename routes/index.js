var express = require('express');
var router = express.Router();
var UserDbTools =  require('../models/userDbTools.js');
var cloud =  require('../models/cloud.js');
var settings = require('../settings');
var JsonFileTools =  require('../models/jsonFileTools.js');
var sessionPath = './public/data/session.json';
var deviceListPath = './public/data/deviceList.json';

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
	cloud.getDeviceList(
		function(err, result){
			JsonFileTools.saveJsonToFile(deviceListPath, {"device_list": result.device_list});
			res.render('index', { title: 'Index',
				user:req.session.user,
				camList: result.device_list
			});
		}
	);
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
	req.session.user = null;
  	var name = req.flash('post_name').toString();
	var successMessae,errorMessae;
	console.log('Debug register get -> name:'+ name);

	if(name ==''){
		errorMessae = '';
		res.render('user/login', { title: 'Login',
			error: errorMessae
		});
	}else{
		var password = req.flash('post_password').toString();

		console.log('Debug register get -> password:'+ password);
		UserDbTools.findUserByName(name,function(err,user){
			if(err){
				errorMessae = err;
				res.render('user/login', { title: 'Login',
					error: errorMessae
				});
			}
			if(user == null ){
				//login fail
				errorMessae = 'The account is invalid';
				res.render('user/login', { title: 'Login',
					error: errorMessae
				});
			}else{
				//login success
				if(password == user.password){
					req.session.user = user;
					/*cloud.getToken(
						function(err,session){
							if(err){
								JsonFileTools.saveJsonToFile(sessionPath,{});
							}else{
								JsonFileTools.saveJsonToFile(sessionPath,session);
							}
						}
					);*/

					return res.redirect('/');
				}else{
					//login fail
					errorMessae = 'The password is invalid';
					res.render('user/login', { title: 'Login',
						error: errorMessae
					});
				}
			}
		});
	}
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	var post_name = req.body.account;
  	var	post_password = req.body.password;
  	console.log('Debug login post -> name:'+post_name);
	console.log('Debug login post -> password:'+post_password);
	req.flash('post_name', post_name);
	req.flash('post_password', post_password);
	return res.redirect('/login');
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
		var myusers = req.session.userS;
		var successMessae,errorMessae;
		var post_name = req.flash('name').toString();

		console.log('Debug account get -> refresh :'+refresh);
		UserDbTools.findAllUsers(function (err,users){
			if(err){
				errorMessae = err;
			}
			if(refresh == 'delete'){
				successMessae = 'Delete account ['+post_name+'] is finished!';
			}else if(refresh == 'edit'){
				successMessae = 'Edit account ['+post_name+'] is finished!';
			}
			req.session.userS = users;
			var newUsers = [];
			for(var i=0;i<  users.length;i++){
				//console.log('name : '+users[i]['name']);
				if( users[i]['name'] !== 'admin'){
					newUsers.push(users[i]);
				}
			}
			console.log('Debug account get -> users:'+users.length+'\n'+users);

			//console.log('Debug account get -> user:'+mUser.name);
			res.render('user/account', { title: 'Account', // user/account
				user:myuser,//current user : administrator
				users:newUsers,//All users
				error: errorMessae,
				success: successMessae
			});
		});
    });

  	app.post('/account', checkLogin);
  	app.post('/account', function (req, res) {
  		var	post_name = req.body.postName;
		var postSelect = req.body.postSelect;
		console.log('post_name:'+post_name);
		console.log('postSelect:'+postSelect);
		var successMessae,errorMessae;
		req.flash('name',post_name);//For refresh users data

		if(postSelect == ""){//Delete mode
			UserDbTools.removeUserByName(post_name,function(err,result){
				if(err){
					console.log('removeUserByName :'+post_name+ " fail! \n" + err);
					errorMessae = err;
				}else{
					console.log('removeUserByName :'+post_name + 'success');
					successMessae = successMessae;
				}
				UserDbTools.findAllUsers(function (err,users){
					console.log('Search account count :'+users.length);
				});
				req.flash('refresh','delete');//For refresh users data
				return res.redirect('/account');
			});
		}else if(postSelect == "new"){//New account
			var	password = req.body.password;
			UserDbTools.findUserByName(post_name,function(err,user){
				if(err){
					errorMessae = err;
					res.render('user/register', { title: '註冊',
						error: errorMessae
					});
				}
				console.log('Debug register user -> name: '+user);
				if(user != null ){
					errorMessae = 'Have the same account!';
					res.render('user/account', { title: 'Account',
						error: errorMessae
					});
				}else{
					//save database
					var level = 1;
					if(post_name == 'admin'){
						level = 0;
					}
					UserDbTools.saveUser(post_name,password,'',level,function(err,result){
						if(err){
							errorMessae = '註冊帳戶失敗';
							res.render('user/register', { title: 'Account',
								error: errorMessae
							});
						}
						return res.redirect('/account');
					});
				}
			});

		}else{//Edit modej
			console.log('postSelect :'+typeof(postSelect) );

			var json = {enable:(postSelect==="false")?false:true};

			console.log('updateUser json:'+json );

			UserDbTools.updateUser(post_name,json,function(err,result){
				if(err){
					console.log('updateUser :'+post_name + err);
					errorMessae = err;
				}else{
					console.log('updateUser :'+post_name + 'success');
					successMessae = successMessae;
				}
				req.flash('refresh','edit');//For refresh users data
				return res.redirect('/account');
			});
		}
  	});
};

function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'No Register!');
    res.redirect('/login');
  }else
  {
	  next();
  }
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', 'Have login!');
    res.redirect('back');//返回之前的页面
  }else
  {
	  next();
  }
}