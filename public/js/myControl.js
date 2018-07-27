console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var connected = false;
var initBtnStr ="#pir";
var host ,port;
var index = 0;limit = 1000;
var isNeedTotal = true;
var date1 ,date2 , deviceList;
var range;
var camList = JSON.parse(document.getElementById("camList").value);
var sensorList = JSON.parse(document.getElementById("sensorList").value);
var mapList = JSON.parse(document.getElementById("mapList").value);
var profile = JSON.parse(document.getElementById("profile").value);
var final = JSON.parse(document.getElementById("final").value);
var pList = Object.keys(profile);
var ctrl1 = getInitCtrl(pList);
var typeMapObj = getTypeMap();
var cam1 = camList[0]['gid'];
var sensor1, sensor_name;
var socket = io.connect('http://localhost:8080');
var socketId = null;
if (profile[cam1] && profile[cam1].length > 0) {
  sensor1 = profile[cam1][0];
  sensor_name = allMacName[sensor1];
} else {
  sensor1 = '';
  sensor_name = '尚未設定裝置';
}
var allMacList = getMacList();
var allMacName = getAllMacName();
// var camList = document.getElementById("camList").value;
//For chart
var chart;
var emptyData =  {
      name: '',
      switch_mac: '',
      sensor_mac: '',
      sensor_param: '',
      switch_on: '',
      switch_on_radio: 'high',
      switch_off: '',
      switch_off_radio: 'high',
    };

var testData = {
      name: 'test',
      switch_mac: '12345678',
      sensor_mac: '0000000005010b75',
      sensor_param: '',
      switch_on: '60',
      switch_on_radio: 'high',
      switch_off: '20',
      switch_off_radio: 'high',
    };

var app = new Vue({
  el: '#app',
  data: {
    camList: camList,
    sensorList: sensorList,
    selectedCam: cam1,
    selectedSensor: sensor1,
    selectedCamName: getCamNameByGid(cam1),
    selectedSensorName: sensor_name,
    isSetting: false,
    isEdit: false,
    isActive: true,
     alert: '',
    //for control setting
    params: [],
    a: 'high',
    b: 'low',
    ctrl: testData,
    ctrlNameList: pList,
    currentCtrl: ctrl1,
    status: '',
    mycounter: 0,
    pageTimer: {}
  },
  methods: {
    selectProfileParam: function(ele) {
      console.log('selectProfileParam : ' + ele.target.value);
      // alert(JSON.stringify(this.ctrl));
　　 },
    enableSetting: function() {
      this.isSetting = true;
    },
   newSetting: function() {
      this.isEdit = false;
    },
    editSetting: function() {
      this.isEdit = true;s
    },
    selectProfileSensor: function(ele) {
      var mac = ele.target.value.toLowerCase();
      this.params = getParamsByMac(mac);
      // alert(JSON.stringify(this.params));
    },
    cancelSetting: function() {
      this.isSetting = false;
    },
    setting: function() {
      toSetting(this.ctrl);
    },
    selectCtrlByName: function(name,$index) {
      this.currentCtrl = getCtrlByName(name);
      /*if (this.currentCtrl) {
        alert('currentCtrl: ' + JSON.stringify(this.currentCtrl));
      }*/
    },
    swichon: function(name,$index) {
      // alert('swichon');
      sendswitchCommand(this.currentCtrl.switch_mac, '010F0000000801013F55');
      var self = this;
      this.isActive = true;
      self.mycounter = 0;
      this.status = '開啟';
      this.pageTimer["timer1"] = setInterval(function(){
          ++ self.mycounter;
          console.log(self.mycounter);
      },1000);
    },
    swichoff: function(name,$index) {
      // alert('swichoff');
      // this.isActive = false;
      this.status = '關閉';
      sendswitchCommand(this.currentCtrl.switch_mac, '010F000000080100FE95');
      clearInterval(this.pageTimer["timer1"]);
    }
  }
})

function getCamNameByGid(mygid) {
  // alert('getCamNameByGid : ' + mygid);
  let name = '';
  if (camList && camList.length > 0) {
    for (let m =0 ; m < camList.length; ++m) {
      let cam = camList[m];
      // alert('cam.gid : ' + cam.gid);
      if (cam.gid == mygid) {
        name = cam.name;
      }
    }
  }
  return '控制 : ' + name;
}

function getSensorNameByMac(mymac) {
  // alert('getSensorNameByMac : ' + mymac);
  let name = '';
  if (sensorList && sensorList.length > 0) {
    for (let m =0 ; m < sensorList.length; ++m) {
      let sensor = sensorList[m];
      // alert('sensor.device_ma : ' + sensor.device_ma);
      if (sensor.device_mac == mymac) {
        name = sensor.device_name;
      }
    }
  }
  return 'Sensor : ' + name;
}

function getTypeMap() {
  // alert('getSensorNameByMac : ' + mymac);
  let obj = {};
  if (mapList && mapList.length > 0) {
    for (let m =0 ; m < mapList.length; ++m) {
      let item = mapList[m];
      if (item.map) {
        let keys = Object.keys(item.map);
        obj[item.deviceType] = keys;
      }
    }
  }
  console.log(JSON.stringify(obj))
  return obj;
}

function getParamsByMac(mymac) {
  // alert('getParamsByMac : ' + mymac);
  let type;
  if (sensorList && sensorList.length > 0) {
    for (let m =0 ; m < sensorList.length; ++m) {
      let sensor = sensorList[m];
      // alert('sensor.device_mac : ' + sensor.device_mac.toLowerCase());
      if (sensor.device_mac.toLowerCase() == mymac) {
        // alert(JSON.stringify(sensor));
        type = sensor.fport;
        break;
      }
    }
  }
  // alert(typeof type)
  if (typeMapObj && typeMapObj[type]) {
    return typeMapObj[type];
  } else {
    return [];
  }
}

function toQuery(gid, mac){
  // alert(gid + ' : ' + mac);
  var list = profile[gid];
  if (list == undefined || list.length == 0) {
    alert('IPCAM尚未綁定裝置,請先設定再查詢!');
    return;
  }
  console.log('toQuery()');
  var url = 'http://'+host+":"+port+'/todos/query?gid='+gid+'&from='+from+'&to='+to;
  console.log(url);
  loadDoc("query",url);
}

function toSetting(ctrl){
  console.log('toSetting : ' + JSON.stringify(ctrl));
  var autoCtrl = JSON.stringify(ctrl);
  // console.log(selectMac.toString());
  var url = 'http://'+host+":"+port+'/todos/ctrlSetting?ctrl='+autoCtrl;
  console.log(url);
  loadDoc("setting",url);
}

function loadDoc(queryType,url) {
  console.log('loadDoc()');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       //document.getElementById("alert").innerHTML = this.responseText;
       // $.LoadingOverlay("hide");

       var type = this.getResponseHeader("Content-Type");   // 取得回應類型
       console.log('type  : '+type);

        // 判斷回應類型，這裡使用 JSON
        if (type.indexOf("application/json") === 0) {
            var json = JSON.parse(this.responseText);
            console.log('json  : '+JSON.stringify(json));
            if(queryType === 'query'){
                console.log('Show query list');
            } else if(queryType === 'setting'){
              app.isSetting = false;
              console.log('Settiong profile');
              profile = json;
              console.log('setting profile :\n' + JSON.stringify(profile));
            }
        }
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}


function getTimeName(timestamp) {
  var date = new Date(timestamp);
  let year = date.getFullYear();
  let month = date.getMonth()+1;
  let day = date.getDate();
  let hour = date.getHours();

  return (year + toStr(month) + toStr(day) + toStr(hour) + '.jpg');
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


function getMac(item){
  //console.log('getMac :\n'+JSON.stringify(item));
  var tmp = item.mac +' - '+item.name;
  return tmp;
}

$(document).ready(function(){
    /* setTimeout(function(){
        //do what you need here
        var mUrl = 'http://'+host+":"+port+'/todos/device_list';
        loadDoc("device_list",mUrl)
    }, 3000);  */
    host = window.location.hostname;
    port = window.location.port;
    init();
});

function drawChart() {
  var  chartData = google.visualization.arrayToDataTable([
      ['Label', 'Value'],
      ['溫度', Math.round(30)]
    ]);

  var options = {
    width: 250, height: 250,
    redFrom: 30, redTo: 40,
    yellowFrom:25, yellowTo: 30,
    minorTicks: 5,
    max:40,
    min: 0
  };

  chart = new google.visualization.Gauge(document.getElementById('chart_div'));
  chart.draw(chartData, options);
}

function init(){
  google.charts.load('current', {'packages':['gauge']});
  google.charts.setOnLoadCallback(drawChart);
}

function getMacList(gid) {
  var list = [];
  for (let i=0; i< sensorList.length; ++i) {
      let sensor = sensorList[i];
      list.push(sensor.device_mac.toLowerCase());
  }
  return list;
}

function getAllMacName() {
  var obj = {};
  for (let i=0; i< sensorList.length; ++i) {
      let sensor = sensorList[i];
      // alert(JSON.stringify(sensor));
      obj[sensor.device_mac.toLowerCase()] = sensor.device_name;
      // alert(JSON.stringify(obj));
  }
  console.log('getAllMacName() : ' + JSON.stringify(obj));
  return obj;
}

function getInitCtrl (list) {
  var name, tmpCtrl;
  if(list && list.length > 0) {
    name = list[0];
  } else {
    return emptyData;
  }
  if (profile[name]) {
    tmpCtrl = profile[name];
  } else {
    tmpCtrl = emptyData;
  }
  return  tmpCtrl;
}

function getCtrlByName (name) {
  if (profile[name]) {
    return profile[name];
  } else {
    return emptyData;
  }
}

socket.on('connect',function(){
  socketId = socket.id;
  console.log('connection socketId : ' + socketId);
});


socket.on('news', function (data) {
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});

socket.on('command_response', function (data) {
  console.log(data);
});


function sendswitchCommand(mac, cmd) {
  socket.emit('switch_command', { mac: mac, cmd: cmd });
}