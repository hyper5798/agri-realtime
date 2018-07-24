console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var connected = false;
var initBtnStr ="#pir";
var host ,port;
var cal1,cal2;
var index = 0;limit = 1000;
var isNeedTotal = true;
var date1 ,date2 , deviceList;
var range;
var camList = JSON.parse(document.getElementById("camList").value);
var sensorList = JSON.parse(document.getElementById("sensorList").value);
var profile = JSON.parse(document.getElementById("profile").value);
var cam1 = camList[0]['gid'];
var sensor1 = sensorList[12]['device_mac'];
var allMacList = getMacList();
var allMacName = getAllMacName();
// var camList = document.getElementById("camList").value;
//Slider
var min = 0;
var max = 12;
var value = 0;
//For chart
var colorNames = Object.keys(window.chartColors);
var imgArr = ['2018071500.jpg'];
var msgArr = ['2018071500.jpg'];
// console.log(camList);
var tmpImg = '/data/600018691/' + imgArr[0];
var dataset = ['Test'];
var datasetIndex = 0;
var chartData = [];
//Transfet
var t;
var allDataSet = [];
var selectedSet = '';

var app = new Vue({
  el: '#app',
  data: {
    camList: camList,
    sensorList: sensorList,
    selectedCam: cam1,
    selectedSensor: sensor1,
    selectedCamName: getCamNameByGid(cam1),
    selectedSensorName: getSensorNameByMac(sensor1),
    isSetting: false,
    isChart: true,
    isShowCSV: false,
    hasTab: false,
    sImg : tmpImg,
    pageTimer: {},
    alert: '',
    eventDate: '',
    eventData: '',
    items: []
  },
  methods: {
    backStart: function () {
      value = 0;
      setSliderValue(value);
      this.sImg = imgArr[value];
      self.eventDate = msgArr[value];
      // console.log(this.sImg);
    },
    playImg: function () {
      const self = this;
      this.pageTimer["timer1"] = setInterval(function(){
          ++value;
          if (value > max) {
            // alert(value + ' : ' + max);
            value = 0;
            resetChart(); 
          }
          setSliderValue(value);
          self.sImg = imgArr[value];
          self.eventDate = msgArr[value];
          self.eventData = JSON.stringify(chartData[value]);
          addData(chartData[value], selectedSet);
          // console.log(self.sImg);
      },1000);
    },
    stopPlay: function () {
      clearInterval(this.pageTimer["timer1"]);
    },
    firstQuery: function () {
      toQuery(this.selectedCam, this.selectedSensor);
    },
    selectCam: function(ele) {
      // alert(ele.target.value);
      this.selectedCamName = getCamNameByGid(ele.target.value);
    },
    selectSensor: function(ele) {
      // alert(ele.target.value);
      this.selectedSensorName = getSensorNameByMac(ele.target.value);
    },
    alocked: function(myitem, index) {
      changeDataset(index);
      selectedSet = myitem;
      // alert(selectedSet);
　　 },
    showTab: function(ele) {
      console.log(ele.target)
      ele.target.tab('show');
    },
    enableSetting: function() {
      this.isSetting = true;
      setChosen(this.selectedCam);
    },
    selectProfileCam: function(ele) {
      this.selectedCamName = getCamNameByGid(ele.target.value);
      // alert(this.selectedCam);
      setChosen(this.selectedCam);;
    },
    cancelSetting: function() {
      this.isSetting = false;
    },
    setting: function() {
      // alert('setting');
      toSetting(this.selectedCam);
    }
  }
})


var opt2={
   dom: 'lrtip',
   //"order": [[ 2, "desc" ]],
   "iDisplayLength": 100,
    scrollY: 400
 };

var table = $("#table1").dataTable(opt2);

var buttons = new $.fn.dataTable.Buttons(table, {
     buttons: [
       //'copyHtml5',
       //'excelHtml5',
       {
          extend: 'csvHtml5',
          text: 'CSV',
          //title: $("#startDate").val()+'-'+$("#endDate").val(),
          filename: function(){
                /*var d = $("#startDate").val();
                var n = $("#endDate").val();
                return 'file-'+d+'-' + n;*/
                return range;
            },
          footer: true,
          bom : true
        },
       //'pdfHtml5'
    ]
}).container().appendTo($('#buttons'));

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
  return 'IPCAM : ' + name;
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

function search(){
  $('#myModal').modal('show');
}

function refresh(){
  //alert('refresh');
  //toQuery();
  // alert(isHasImg('2018071100.jpg'));
}

function isHasImg(pathImg){
    pathImg = 'http://localhost:3000/data/600018691/' + pathImg;
    var ImgObj=new Image();
    ImgObj.src= pathImg;
     if(ImgObj.fileSize > 0 || (ImgObj.width > 0 && ImgObj.height > 0))
     {
       return true;
     } else {
       return false;
    }
}


function find() {
    toQuery();
}

/*function firstQuery(){
  index = 0;
  isNeedTotal = true;
  //alert('firstQuery() total='+isNeedTotal);
  toQuery();
}*/


function toQuery(gid, mac){
  // alert(gid + ' : ' + mac);
  var list = profile[gid];
  if (list == undefined || list.length == 0) {
    alert('IPCAM尚未綁定裝置,請先設定再查詢!');
    return;
  }
  console.log('toQuery()');
  removeDataset();
  // $.LoadingOverlay("show");
  $('#myModal').modal('hide');
  // table.fnClearTable();
  var from = $('#startDate').val();
  var to = $('#endDate').val();
  // var url = 'http://'+host+":"+port+'/todos/query?gid='+gid+'&mac='+mac+'&from='+from+'&to='+to;
  var url = 'http://'+host+":"+port+'/todos/query?gid='+gid+'&from='+from+'&to='+to;
  console.log(url);
  loadDoc("query",url);
}

function toSetting(gid){
  // alert(gid + ' : ' + mac);
  //alert($("#startDate").val());
  console.log('toSetting()');
  console.log(t.get_values());
  var arr = t.get_values();
  var selectMac = [];
  var selectType;
  if (arr.length > 1) {
    alert('選中裝置數量不得超過1個,請重新選擇!');
    return;
  }
  for (let m =0 ; m < arr.length; ++m) {
    let index = parseInt(arr[m]);
    // alert('sensor.device_ma : ' + sensor.device_ma);
    if (sensorList[index]) {
      let mac = sensorList[index]['device_mac'];
      let type = sensorList[index]['typeName'];
      if (m == 0) {
        selectType = type;
      } else  if (type != selectType) {
        alert('選中裝置類型不同,請重新選擇!');
        return;
      }
      if (mac)
        selectMac.push(mac.toLowerCase());
    }
  }
  app.isSetting = false;
  // console.log(selectMac.toString());
  var url = 'http://'+host+":"+port+'/todos/setting?gid='+gid+'&macs='+selectMac.toString();
  console.log(url);
  loadDoc("setting",url);
}

function loadDoc(queryType,url) {
  console.log('loadDoc()');
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       //document.getElementById("alert").innerHTML = this.responseText;
       $.LoadingOverlay("hide");

       var type = this.getResponseHeader("Content-Type");   // 取得回應類型
       console.log('type  : '+type);

        // 判斷回應類型，這裡使用 JSON
        if (type.indexOf("application/json") === 0) {
            var json = JSON.parse(this.responseText);
            console.log('json  : '+JSON.stringify(json));
            if(queryType === 'query'){
                console.log('Show query list');
                /*if(json.data && json.total>0){
                    //console.log('type.indexOf(data) data : '+json.data.length);
                    table.fnAddData(json.data);
                }*/
                
                var keys = Object.keys(json);
                // alert(JSON.stringify(keys))
                var alertMessage = '';
                var result;
                var list;
                var total = 0;
                if (keys.length > 0) {
                  let result = json[keys[0]];
                  list = result.data;
                  alertMessage = alertMessage + allMacName[keys[0]] + ' : ' + result.total + '筆 ';
                  total = total + result.total;
                }
                
                app.alert = alertMessage;
                if (total > 0) {
                  makeChartData(list);
                } else {
                  alert('找不到資料')
                }
            } else if(queryType === 'setting'){
              console.log('Settiong profile');
              profile = json;
              console.log('setting profile :\n' + JSON.stringify(profile));
              // var clist = getChosenList(app.selectCam);
            }
        }
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}

function makeChartData(list) {
  //Set slider
  max = list.length - 1;
  value = 0;
  setSliderValue(value);

  //Data offset
  var mdata1 = list[0];
  /*var mdata2 = list[1];
  var d1 = new Date(mdata1.recv);
  var d2 = new Date(mdata2.recv);
  var d3 = Math.floor((d1.getTime() - d2.getTime())/60000 );
  var offset = (60/d3);
  console.log('offset : ' + offset);
  console.log(mdata1);*/
  datasetIndex = 0;
  dataset = Object.keys(mdata1.information);
  //For image
  var now_gid = app.selectedCam;
  imgArr = [];
  msgArr = [];
  chartData = [];
  // alert(now_gid);
  for(let j=list.length-1; j > -1; --j) {
    let event = list[j];
    let image = '/data/' + now_gid + '/' + getTimeName(event.timestamp);
    imgArr.push(image);
    msgArr.push(event.date); 
    let data = {time:event.date};
    data = Object.assign(data, event.information);
    chartData.push(data);
    // break;
  }
  app.sImg = imgArr[0];
  app.eventDate = msgArr[0];
  var lastAll = [];
  for(let k=0; k< dataset.length; ++k) {
    let newset = getDataSet(k, dataset[k]);
    allDataSet.push(newset);
    lastAll.push(newset);
  } 
  allDataSet.push(lastAll);
  // alert(JSON.stringify(allDataSet));

  if (dataset.length > 0) {
    app.hasTab = true;
    app.items = dataset;
    app.items.push('all');
  }
  
  selectedSet = dataset[0];
  
  console.log('allDataSet : ' + JSON.stringify(allDataSet));
  console.log('app.items : ' + JSON.stringify(app.items));
  console.log(JSON.stringify(chartData));
  changeDataset(0);
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

function setSliderValue(value) {
  $( "#slider" ).slider({
      min: min,
      max: max,
      value: value,
    });

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
    setSliderValue(500);
    host = window.location.hostname;
    port = window.location.port;

    cal1 =new Calendar({
        inputField: "startDate",
        dateFormat: "%Y/%m/%d",
        trigger: "BTN",
        bottomBar: true,
        weekNumbers: true,
        showTime: false,
        onSelect: function() {this.hide();}
    });

    cal2 = new Calendar({
        inputField: "endDate",
        dateFormat: "%Y/%m/%d",
        trigger: "BTN2",
        bottomBar: true,
        weekNumbers: true,
        showTime: false,
        onSelect: function() {this.hide();}
    });
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

    $(".nav-tabs a").click(function(){
        $(this).tab('show');
    });

    //Profile Transfer
    t = $('#test').bootstrapTransfer(
      {'target_id': 'multi-select-input',
       'height': '15em',
       'hilite_selection': true});
    console.log('########### transfer');
    var slist = [];
    console.log(cam1);
    for (let i=0; i< sensorList.length; ++i) {
        let item = {value:i, content:sensorList[i].device_name+'('+sensorList[i].typeName+')'};
        slist.push(item);
    }
    t.populate(slist);
    /*t.populate([
      {value:"1", content:"Apple"},
      {value:"2", content:"Orange"},
      {value:"3", content:"Banana"},
      {value:"4", content:"Peach"},
      {value:"5", content:"Grapes"}
    ]);*/
    //console.log(t.get_values());
});

function setChosen(mgid) {
  console.log('setChosen :  ' + mgid);
  var clist = getChosenList(mgid);
  console.log(JSON.stringify(clist));
  t.clear_values();
  t.set_values(clist);
}

function getChosenList(gid) {
  var list = [];
  var maclist = []; 
  console.log('getChosenList profile :\n' + JSON.stringify(profile));
  if (profile[gid]) {
    maclist = profile[gid];
  }
  console.log('getChosenList maclist :\n' + JSON.stringify(maclist));
  // console.log(allMacList);
  for (let i=0; i< maclist.length; ++i) {
      let index = allMacList.indexOf(maclist[i]);
      // alert(index);
      if (index != -1) {
        list.push(index);
      }
  }
  if (list.length > 0) {
    return list;
  } else {
    return 0;
  }
  
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

var timeFormat = 'YYYY-MM-DD HH:mm';

		function newDate(days) {
			return moment().add(days, 'hours').toDate();
		}

		function newDateString(days) {
			return moment().add(days, 'hours').format(timeFormat);
		}

		var color = Chart.helpers.color;
		var config = {
			type: 'line',
			data: {
				labels: [],
				datasets: []
			},
			options: {
				title: {
					text: 'Chart.js Time Scale'
        },
        tooltips: {
          mode: 'index'
        },
        hover: {
          mode: 'index'
        },
				scales: {
					xAxes: [{
						type: 'time',
						time: {
							parser: timeFormat,
							// round: 'day'
							tooltipFormat: 'll HH:mm'
						},
						scaleLabel: {
							display: false,
							labelString: 'Date'
						}
					}],
					yAxes: [{
            ticks: {
              beginAtZero: true
            },
						scaleLabel: {
							display: false,
							labelString: 'value'
						}
					}]
				},
			}
		};


function randomizeData () {
  config.data.datasets.forEach(function(dataset) {
    dataset.data.forEach(function(dataObj, j) {
      if (typeof dataObj === 'object') {
        dataObj.y = randomScalingFactor();
      } else {
        dataset.data[j] = randomScalingFactor();
      }
    });
  });

  window.myLine.update();
}

function getDataSet (i, label) {
  var colorName = colorNames[ ((i * 2 ) % colorNames.length) ];
  var newColor = window.chartColors[colorName];
  var newDataset = {
    label: label,
    borderColor: newColor,
    backgroundColor: color(newColor).alpha(0.5).rgbString(),
    fill: false,
    data: [],
  };
  return newDataset;
}

function changeDataset (index) {
  /*var colorName = colorNames[ ((config.data.datasets.length * 2 ) % colorNames.length) ];
  var newColor = window.chartColors[colorName];
  var label = '';
  if (datasetIndex < dataset.length ) {
    label = dataset[datasetIndex];
    ++datasetIndex;
  } else {
    alert('無法新增dataset');
    return;
  }
  console.log('addDataset : ' + label);
  var newDataset = {
    label: label,
    borderColor: newColor,
    backgroundColor: color(newColor).alpha(0.5).rgbString(),
    fill: false,
    data: [],
  };

  for (var index = 0; index < config.data.labels.length; ++index) {
    newDataset.data.push(randomScalingFactor());
  } 
  config.data.datasets.push(newDataset);*/
  var newDataset = allDataSet[index];
  if (index == allDataSet.length-1) {
    config.data.datasets = newDataset;
  } else {
    config.data.datasets = [newDataset];
  }

  
  window.myLine.update();
}

function addData (data, mySet) {
  // alert(JSON.stringify(data));
  // alert(mySet);
  if (config.data.datasets.length > 0) {
    // config.data.labels.push(newDate(config.data.labels.length));
    config.data.labels.push(data.time);
    if (config.data.datasets.length == 1 ) {
      
      config.data.datasets[0].data.push(data[mySet]);
    } else {
      for (var index = 0; index < config.data.datasets.length; ++index) {
        /*if (typeof config.data.datasets[index].data[0] === 'object') {
          config.data.datasets[index].data.push({
            x: newDate(config.data.datasets[index].data.length),
            y: randomScalingFactor(),
          });
        } else {
          config.data.datasets[index].data.push(randomScalingFactor());
        }*/
        // alert(dataset[index] + '->' + data[dataset[index]]);
        if (typeof config.data.datasets[index].data[0] === 'object') {
          config.data.datasets[index].data.push({
            x: data.time,
            y: data[dataset[index]],
          });
        } else {
          config.data.datasets[index].data.push(data[dataset[index]]);
        }
        // config.data.datasets[index].data.push(data[dataset[index]]);
      }
    }
    
    if (config.data.labels.length > 48) {
      removeData ();
    }
    window.myLine.update();
  }
}

function resetChart () {
  config.data.labels = [];
  for (var index = 0; index < config.data.datasets.length; ++index) {
    config.data.datasets[index].data = [];
  }
  window.myLine.update();
}

function removeDataset () {
  //config.data.datasets.splice(0, 1);
  config.data.labels = [];
  config.data.datasets = [];
  datasetIndex = 0;
  window.myLine.update();
  app.alert = '';
  app.hasTab = false;
  app.items = [];
  app.eventData = '';
  app.eventDate = '';
}

function removeData () {
  config.data.labels.splice(0, 1); // remove the label first

  config.data.datasets.forEach(function(dataset) {
    // dataset.data.pop();
    dataset.data.splice(0, 1);
  });
  window.myLine.update();
}


