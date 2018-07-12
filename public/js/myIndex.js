console.log("message manager");
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var connected = false;
var initBtnStr ="#pir";
var host = window.location.hostname;
var port = window.location.port;
var cal1,cal2;
var index = 0;limit = 1000;
var isNeedTotal = true;
var date1 ,date2 , deviceList;
var range;
var camList = JSON.parse(document.getElementById("camList").value);
var cam1 = camList[0]['gid'];
// var camList = document.getElementById("camList").value;
// console.log(camList);
var app = new Vue({
  el: '#app',
  data: {
    camList: camList,
    selectedCam: cam1,
    test: false
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

function search(){
  $('#myModal').modal('show');
}

function refresh(){
  //alert('refresh');
  toQuery();
}

function disableBtn() {
    //document.getElementById("BTN").disabled = true;
    //document.getElementById("BTN2").disabled = true;
    $('#BTN').attr('disabled', true);
    $('#BTN2').attr('disabled', true);
    $('#startDate').attr('disabled', true);
    $('#endDate').attr('disabled', true);
    $('#startDate').val('');
    $('#endDate').val('');
}

function enableBtn() {
    //document.getElementById("BTN").disabled = false;
    //document.getElementById("BTN2").disabled = false;
    $('#BTN').attr('disabled', false);
    $('#BTN2').attr('disabled', false);
    $('#startDate').attr('disabled', false);
    $('#endDate').attr('disabled', false);
}

function disableMac() {
    //document.getElementById("mac").disabled = true;
    $('#mac').attr('disabled', true);
}

function enableMac() {
    //document.getElementById("mac").disabled = false;
    $('#mac').attr('disabled', false);
  }

function hidePaging(){
  $('#codici_transazioni').hide();
  $("#lblTotalPage").hide();
}

function showPage(total){
  console.log('showPage()');
  $('#codici_transazioni').show();
  $("#lblTotalPage").show();
  $('#codici_transazioni').html("");
  var page = Math.ceil( total/limit );
  for (var i=0; i< page ; i ++) {
      $('#codici_transazioni').append("<option value=" + i + "> " + "<i>" + (i+1)+ "</i></option>");
  }
  var num = "/ &nbsp;&nbsp;"+ page;
  $("#lblTotalPage").html(num);
}

function find() {

    var page = $('#codici_transazioni').val();
    index = page*limit;
    //alert('index : '+index);
    toQuery();
}

function firstQuery(){
  index = 0;
  isNeedTotal = true;
  hidePaging();
  //alert('firstQuery() total='+isNeedTotal);
  toQuery();
}

function toQuery(){
  //alert($("#startDate").val());
  console.log('toQuery()');
  $.LoadingOverlay("show");
  $('#myModal').modal('hide');
  table.fnClearTable();
  var mac = $('#mac').val();
  var from = $('#startDate').val();
  var to = $('#endDate').val();
  if(document.getElementById("startDate").value === ''){
      to = date;
  }
  //alert('toQuery() total='+isNeedTotal);
  var url = 'http://'+host+":"+port+'/todos/query?mac='+mac+'&from='+from+'&to='+to+'&index='+index+'&limit='+limit+'&total='+isNeedTotal;
  console.log(url);
  if(isNeedTotal){
    isNeedTotal = !isNeedTotal;
  }
  loadDoc("query",url);
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
            //console.log('json  : '+JSON.stringify(json));
            if(queryType === 'query'){
                console.log('Show query list');
                if(json.data && json.data.length>0){
                    //console.log('type.indexOf(data) data : '+json.data.length);
                    table.fnAddData(json.data);
                }

                console.log('total  : '+ json.total );


                if( json.total && json.total > limit){
                  showPage(json.total);
                }
                if(json.range){

                  if( $('#codici_transazioni') ){
                    var select = $('#codici_transazioni').val();
                    //alert(select);
                    range = $('#mac').val()+'_'+json.range +'-'+ ( Number(select) +1 );
                  }else{
                    range = $('#mac').val()+'_'+json.range +'-1';
                  }
                }
            }else if(queryType === "device_list"){
                //Show device list
                if(json.device_list){
                    toShowDevice(json.device_list);
                }else{
                    //Show alert
                    alert('Unable get device list!');
                }
            }
        }
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}

function toShowDevice(list){
  //console.log('Show device list :\n'+JSON.stringify(list));
  $('#mac').html("");
  for (var i = 0;i<list.length;i++) {
      $('#mac').append("<option value=" + list[i]['mac'] + "> " + "<i>" + getMac(list[i])+ "</i></option>");
  }
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

   /*$('#input-1').iCheck({
    checkboxClass: 'icheckbox_flat-red',
    radioClass: 'iradio_flat-red'
  });
   $('#input-2').iCheck({
    checkboxClass: 'icheckbox_flat-red',
    radioClass: 'iradio_flat-red'
    });

  $('#input-1').on('ifToggled', function(event){

      if( $("#input-1").prop("checked") ) {
         //alert('input-1 ifToggled checked');
         enableBtn();
       } else {
         //alert('input-1 ifToggled unchecked');
         disableBtn();
       }
  });

  $('#input-2').on('ifToggled', function(event){

      if( $("#input-2").prop("checked") ) {
         //alert('input-2 ifToggled checked');
         enableMac();
       } else {
         //alert('input-2 ifToggled unchecked');
         disableMac();
       }

  });*/
  //disableBtn();
  //disableMac();
  hidePaging();
});


