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
    return now.getHours() + ":" + ("0" + now.getMinutes()).substr(-2) + ":" + ("0" + now.getSeconds()).substr(-2);
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
          chartData.push(simpleEncoding.charAt(Math.round((simpleEncoding.length-1) * currentValue / maxValue)));

        } else {
          chartData.push('_');
        }
      }

      return chartData.join('');
    }

    function chart(data) {
      var img = new Image();
      img.src = "http://chart.apis.google.com/chart?chs=60x20&cht=ls&chco=ff0084&chm=B,ffd3ea,0,0,0&chls=1,0,0&chd=" + simpleEncode(data, 500);
      img.className = "spark";

      return img;
    }

    this.each(function() {
      var element = $(this);
      var graph = element.find(".graph");
      var average = element.find(".average");
      var aggregate = element.find(".aggregate");

      element.dataList = new Array();

      $("body").bind(element.attr('data-listen'), function(e, value) {

        // start sliding after n events
        element.dataList.push(value.av);
        if(element.dataList.length > 30) { element.dataList = element.dataList.slice(1); }

        aggregate.html(value.ag);
        average.html(value.av);

        $(chart(element.dataList)).bind("load", function() {
          graph.html(this);
        })
      });
    });

    return this;
  };

})(jQuery);

// take request events from varnish

(function($) {

  $.fn.requestTable = function() {
    var element = $(this);
    var list = new TopList(element);

    $('body').bind("varnish-request", function(e, value) {
      list.add(value);
    });

    return this;
  }

})(jQuery);

// apply plugins

$('.time').timeize();
$('.spark').spark();
$('table.request-table').requestTable();

$.houston(); // start consuming server events
