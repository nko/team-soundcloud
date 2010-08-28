// phone home

(function($) {

  $.houston = function() {
    io.setPath('/Socket.IO/');

    if( window.location.toString().match(/localhost/) ) {
      socket = new io.Socket('localhost');

    } else {
      socket = new io.Socket('team-soundcloud.no.de', {port: 80});

    }

    socket.connect();
    socket.on('message', function(data) {
      var message = JSON.parse(data);
      $("body").trigger("varnish-" + message.key, message.value)
    });
  }

})(jQuery);

// dashboard clock

(function($) {

  $.dashboardTime = function() {
    var now = new Date();
    return now.getHours() + ":" + now.getMinutes() + ":" + ("0" + now.getSeconds()).substr(-2);
  }

  $.fn.timeize = function(selector) {
    this.html($.dashboardTime());
    var that = this;

    setInterval(function() { that.html($.dashboardTime()); }, 1000);
    
    return this;
  };

})(jQuery);

// sparkline

(function($) {

  $.fn.spark = function(selector) {
    var simpleEncoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    function simpleEncode(valueArray, maxValue) {
      var chartData = ['s:'];

      for (var i = 0; i < valueArray.length; i++) {
        var currentValue = valueArray[i];
        if (!isNaN(currentValue) && currentValue >= 0) {
        chartData.push(simpleEncoding.charAt(Math.round((simpleEncoding.length-1) *
          currentValue / maxValue)));
        }
          else {
          chartData.push('_');
          }
      }

      return chartData.join('');
    }

    function chart(data) {
      return $("<img class=\"spark\" src=\"http://chart.apis.google.com/chart?chs=60x20&amp;cht=ls&amp;chco=ff0084&amp;chm=B,ffd3ea,0,0,0&amp;chls=1,0,0&amp;chd=" + simpleEncode(data, 500) + "\"></img>");
    }

    this.each(function() {
      var element = $(this);
      element.dataList = new Array();

      $("body").bind(element.attr('data-listen'), function(e, value) {
        element.dataList.push(value);
        element.find(".graph").html(chart(element.dataList));
      });
    });

    return this;
  };

})(jQuery);

// apply plugins

$('.time').timeize();
$('.spark').spark();

$.houston(); // start consuming server events
