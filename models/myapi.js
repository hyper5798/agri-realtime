var request = require('request');
var settings = require('../settings');
var fs = require('fs');
var JsonFileTools =  require('./jsonFileTools.js');
var sessionPath = './public/data/mysession.json';
var crypto = require('crypto');
var moment = require('moment');
var settings =  require('../settings.js');
var isS5 = false;
var server = isS5 ? settings.s5_server : settings.service_server;
var tmp = [{
            "length":6,
            "TYPE_ID":"10",
            "SERVICE_ID":"10",
            "DATA_0":"0",
            "DATA_1":"0",
            "time":"1502150400"
            }];
var servicePath = './public/data/service.json';
var serviceMap = JsonFileTools.getJsonFromFile(servicePath);

function getToken(callback) {
    var url = settings.api_server + settings.api_login;
    var api_name = settings.api_name;
    var api_pw = settings.api_pw;
    var form = { acc:api_name, pwd: api_pw,type: 0};
    request.post(url,{form:form},
        function(err, result) {
            if(err) {
                callback(err, null);
            }
            else {
                //console.log('flag : '+flag);
                //console.log('body type : '+typeof(result.body));
                var body= JSON.parse(result.body);
                //console.log(JSON.stringify(body));
                var code = body.responseCode;
                var authToken = body.authToken;
                var time = moment();
                time = time.add(1, 'days');
                time = time.toDate();
                var session = {"token": authToken, "expiration": time};
                if(code !== '000'){
                    callback(body.responseMsg, null);
                } else {
                    callback(null, session);
                }
            }
    });
}



function download (uri, filename){
    request.head(uri, function(err, res, body){
      if (err) callback(err, filename);
      else {
          var stream = request(uri);
          stream.pipe(
              fs.createWriteStream(filename)
                  .on('error', function(err){
                      //callback(error, filename);
                      stream.read();
                  })
              )
          .on('close', function() {
              // callback(null, filename);
          });
      }
    });
  };

  function checkAndGetToken(callback) {
    var mySession = JsonFileTools.getJsonFromFile(sessionPath);
    var hasExpiration = false;
    if(mySession && mySession.expiration) {
        var d = new Date(mySession.expiration);//UTC
        //console.log(d.getTime());
        var now = new Date();
        //console.log(now.getTime());
        hasExpiration = true;
    }

    if (hasExpiration == false || now.getTime() > d.getTime()) {
        getToken(function(err, result){
            if(err){
                JsonFileTools.saveJsonToFile(sessionPath,{});
                callback(err, null);
            }else{
                JsonFileTools.saveJsonToFile(sessionPath,result);
                sendDeviceListRequest(result, function(err, result){
                    if(err){
                        callback(err, null);
                    } else {
                        callback(null, result);
                    }
                });
            }
        })
    } else {
        callback(null, mySession);
    }
}

function getDeviceList(callback) {
    //先取得裝置列表時進行token確認,getMapList就無須檢查
    checkAndGetToken(function(err, session) {
        if (err) {
            call(err, null);
        } else {
            sendDeviceListRequest(session, function(err, result){
                if(err){
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        }
    })
}

function getMapList(callback) {
    var mySession = JsonFileTools.getJsonFromFile(sessionPath);
    sendMapListRequest(mySession, function(err, result){
        if(err){
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
}

function sendMapListRequest(session, callback) {
    var token = session.token;
    var encodeToken = encodeURIComponent(token);
    var url = settings.api_server + settings.api_get_map_list;
    url = url + '?token=' + encodeToken;
    console.log(url);
    var options = {
        'url': url
    };

    request.get(options, function(error, response, body){
        if (!error && response.statusCode == 200){
            //console.log('body : ' + body+ ', type : '+typeof(body));
            var json = JSON.parse(body);
            var code = json.responseCode;
            var msg = json.responseMsg;
            if (code == '000') {
                callback(error, json.data);
            } else {
                callback(msg, null);
            }
        }
        else{
            var json = JSON.parse(body);
            var code = json.responseCode;
            var msg = json.responseMsg;
            console.log('Code : ' + code);
            console.log('error : ' + error);
            console.log('body : ' + body);
            callback(error, null);
        }
    });
}

function sendDeviceListRequest(session, callback) {
    var token = session.token;
    var encodeToken = encodeURIComponent(token);
    var url = settings.api_server + settings.api_get_device_list;
    url = url + '?token=' + encodeToken;
    var options = {
        'url': url
    };

    request.get(options, function(error, response, body){
        if (!error && response.statusCode == 200){
            //console.log('body : ' + body+ ', type : '+typeof(body));
            var json = JSON.parse(body);
            var code = json.responseCode;
            var msg = json.responseMsg;
            if (code == '000') {
                callback(error, json.mList);
            } else {
                callback(msg, null);
            }
        }
        else{
            if (body) {
                var json = JSON.parse(body);
                var code = json.responseCode;
                var msg = json.responseMsg;
                console.log('Code : ' + code);
                console.log('error : ' + error);
                console.log('body : ' + body);
                callback(error, null);
            } else {
                callback( 'no response', null);
            }
        }
    });
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

function getEventList(mac, startDate, endDate, callback) {
    var form = {macAddr:mac};
    if(endDate == ''){
        var now = new Date();
        endDate = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
    }
    var formatStr = "YYYY-MM-DD"
    //Start day + 1 exp: 2017/8/13  => 2017/8/14 00:00:00 
    var toMoment = moment(endDate,"YYYY-MM-DD").add(1,'days');
    var to = moment(toMoment,"YYYY-MM-DD").toDate().toISOString();
    form.to = to;
    var range2 = moment(endDate,"YYYYMMDD").format("YYYYMMDD");
    //console.log('to : '+timeConverter(to));

    if(startDate.length == ''){
        var fromMoment = moment(endDate,"YYYY/MM/DD").subtract(7,'days');;
        startDate =  fromMoment.format("YYYY/MM/DD");
        //startDate = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
    }
    var from = moment(startDate,"YYYY/MM/DD").toDate().toISOString();
    form.from = from;
    var range1 = moment(startDate,"YYYYMMDD").format("YYYYMMDD");
    var range = range1 + '-' + range2;
    
    checkAndGetToken(function(err, session) {
        if (err) {
            call(err, null);
        } else {
            var token = session.token;
            form.token = token;
            sendEventListRequest(form, function(err, result){
                if(err){
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        }
    })
}

function sendEventListRequest(form, callback) {
    var url = settings.api_server + settings.api_get_event_list;
    
    console.log(JSON.stringify(form));
    var token = form.token;
    var encodeToken = encodeURIComponent(token);
    url = url + '?token=' + encodeToken + '&paginate=false&limit=1000&sort=desc';
    url = url + '&macAddr=' + form.macAddr;
    url = url + '&from=' + form.from;
    url = url + '&to=' + form.to;
    // url = url + '&sort=asc';
    console.log(url);
    var options = {
        'url': url
    };

    request.get(options, function(error, response, body){
        if (!error && response.statusCode == 200){
            //console.log('body : ' + body+ ', type : '+typeof(body));
            var json = JSON.parse(body);
            var code = json.responseCode;
            var msg = json.responseMsg;
            if (code == '000') {
                callback(error, json);
            } else {
                callback(msg, null);
            }
        }
        else{
            if(body) {
                var json = JSON.parse(body);
                var code = json.responseCode;
                var msg = json.responseMsg;
                console.log('Code : ' + code);
                console.log('error : ' + error);
                console.log('body : ' + body);
                callback(msg, null);
            } else {
                callback('no message', null);
            }
        }
    });
}

function getTimeName(timestamp) {
    var date = new Date(timestamp);
    let year = date.getFullYear();
    let month = date.getMonth()+1;
    let day = date.getDate();
    let hour = date.getHours();
    return year + toStr(month) + toStr(day) + toStr(hour);
}

function toStr(value) {
    let str = '';
    if (value < 10) {
        str = '0' + value;
    } else {
        str = value;
    }
    // node.warn(str);
    return str;
}

function getPlayList(gid, endDate, callback) {
    var folderPath = './public/data/'+gid;
    JsonFileTools.mkdir(folderPath);

    getEventList(gid, endDate, function(err,list){
        if (err) {
            callback(err, null);
        } else {
            for (let i=0; i < list.length; ++i) {
                let obj = list[i];
                let clip = obj.clips;
                let name = getTimeName(obj.time);
                console.log(clip[0]);
                name = folderPath + '/'+ name + '.jpg';
                download(clip[0], name);
            }
            callback(null, list);
        }
    });
}

exports.getToken = getToken;
exports.getDeviceList = getDeviceList;
exports.getEventList = getEventList;
exports.getPlayList = getPlayList;
exports.getMapList = getMapList;

function dateConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp*1000);
  //var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = a.getMonth()+1;
  var date = a.getDate();
  var date = year +'/'+month+'/'+date ;
  return date;
}

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp*1000);
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = hour + ':' + min + ':' + sec ;
  return time;
}

function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function getDataList(list){
    var arr = [];
    for(var i = 0;i<list.length;i++){
        arr.push(getData(list[i]));
    }
    return arr;
}

function getData(json){
    var arr = [];
    var arrData = json._source.data;
    if( getType(arrData) !== 'array' ){
        arrData = tmp;
    }
    var data = arrData[0];
    var account = json._source.account;
    var reportTime = moment(json._source.report_timestamp, 'YYYY-MM-DD hh:mm:ss');
    var myDate = reportTime.format('YYYY-MM-DD');
    var myTime = reportTime.format('hh:mm:ss');
    //arr.push(timeConverter(data.time));

    arr.push(account.mac);
    arr.push(account.gid);
    //console.log(typeof(reportTime));
    //arr.push(dateConverter(data.time));
    //arr.push(timeConverter(data.time));
    arr.push(myDate);
    arr.push(myTime);
    arr.push(data.SERVICE_ID);
    arr.push(serviceMap[data.SERVICE_ID]);
    arr.push(data.length);
    arr.push(data.DATA_0);
    arr.push(data.DATA_1);
    return arr;
}