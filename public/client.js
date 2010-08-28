// time plugin

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

// websocket plugin, collects data pushed to the client.

(function($) {

  $.fn.collectorize = function(selector) {
    
    this.each(function() {
      var element = $(this);
      element.dataList = new Array();
      
      io.setPath('/Socket.IO/');

      if( window.location.toString().match(/localhost/) ) {
        socket = new io.Socket('localhost');
        
      } else {
        socket = new io.Socket('team-soundcloud.no.de', {port: 80});
        
      }

      socket.connect();
      socket.on(element.attr('data-websock-filter'), function(data) {
        element.dataList.push(data);
        element.html(data);
      });
    });
    
    return this;
  };

})(jQuery);

// sparkline plugin with google charts

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
      return $("<img class=\"spark\" src=\"http://chart.apis.google.com/chart?chs=60x20&amp;cht=ls&amp;chco=ff0084&amp;chm=B,ffd3ea,0,0,0&amp;chls=1,0,0&amp;chd=" + simpleEncode(data) + "\"");
    }

    this.each(function() {
      var element = $(this);
      chart(element.dataList);
    });

    return this;
  };

})(jQuery);

// apply plugins

$('.time').timeize();
$('.listener').collectorize();
